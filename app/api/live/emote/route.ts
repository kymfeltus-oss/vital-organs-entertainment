import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedBuyer } from "@/lib/checkout/server";
import {
  computeAuthoritativeEmoteBatchCost,
  getTotalBatchQuantity,
  MAX_EMOTE_BATCH_TOTAL_QUANTITY,
} from "@/lib/live/emote-billing";
import {
  getLiveEmote,
  LIVE_EMOTE_BATCH_BROADCAST_EVENT,
  type LiveEmoteBatchBroadcastPayload,
  type LiveEmoteBroadcastPayload,
} from "@/lib/live/emotes";
import { LIVE_ROOM_CHAT_CHANNEL } from "@/lib/live/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type EmoteBatchItem = {
  emoteId: string;
  quantity: number;
  originX?: number;
};

type EmoteRequestBody = {
  emoteId?: string;
  quantity?: number;
  batches?: EmoteBatchItem[];
  originX?: number;
};

function displayAuthorFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return "Fan";
  return localPart.length > 18 ? `${localPart.slice(0, 16)}…` : localPart;
}

function normalizeBatches(body: EmoteRequestBody): EmoteBatchItem[] {
  if (Array.isArray(body.batches) && body.batches.length > 0) {
    return body.batches
      .map((item) => ({
        emoteId: item.emoteId?.trim() ?? "",
        quantity: Math.max(1, Math.floor(item.quantity ?? 1)),
        originX:
          typeof item.originX === "number"
            ? Math.min(1, Math.max(0, item.originX))
            : 0.5,
      }))
      .filter((item) => item.emoteId.length > 0);
  }

  const emoteId = body.emoteId?.trim();
  if (!emoteId) return [];

  return [
    {
      emoteId,
      quantity: Math.max(1, Math.floor(body.quantity ?? 1)),
      originX:
        typeof body.originX === "number"
          ? Math.min(1, Math.max(0, body.originX))
          : 0.5,
    },
  ];
}

function buildBroadcastPayloads(
  batches: EmoteBatchItem[],
  author: string,
): LiveEmoteBroadcastPayload[] {
  const payloads: LiveEmoteBroadcastPayload[] = [];

  for (const batch of batches) {
    const emote = getLiveEmote(batch.emoteId);
    if (!emote) continue;

    for (let index = 0; index < batch.quantity; index += 1) {
      payloads.push({
        emoteId: emote.id,
        emoji: emote.emoji,
        author,
        originX: batch.originX ?? 0.5,
      });
    }
  }

  return payloads;
}

async function broadcastLiveEmoteBatch(
  batchPayload: LiveEmoteBatchBroadcastPayload,
): Promise<void> {
  if (batchPayload.emotes.length === 0) return;

  const supabase = getSupabaseAdmin();
  const channel = supabase.channel(LIVE_ROOM_CHAT_CHANNEL);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabase.removeChannel(channel);
      reject(new Error("Emote broadcast timed out."));
    }, 5000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;

      const result = await channel.send({
        type: "broadcast",
        event: LIVE_EMOTE_BATCH_BROADCAST_EVENT,
        payload: batchPayload,
      });

      clearTimeout(timeout);
      await supabase.removeChannel(channel);

      if (result !== "ok") {
        reject(new Error(`Emote broadcast failed: ${result}`));
        return;
      }

      resolve();
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required to send emotes." },
        { status: 401 },
      );
    }

    const { buyer, withSessionCookies } = auth;
    const body = (await request.json()) as EmoteRequestBody;
    const batches = normalizeBatches(body);

    if (batches.length === 0) {
      return NextResponse.json({ error: "Emote is required." }, { status: 400 });
    }

    const totalQuantity = getTotalBatchQuantity(batches);
    if (totalQuantity > MAX_EMOTE_BATCH_TOTAL_QUANTITY) {
      return NextResponse.json(
        { error: "Emote batch exceeds maximum quantity." },
        { status: 400 },
      );
    }

    for (const batch of batches) {
      const emote = getLiveEmote(batch.emoteId);
      if (!emote) {
        return NextResponse.json({ error: "Invalid emote." }, { status: 400 });
      }
    }

    const supabase = getSupabaseAdmin();

    const { data: wallet, error: walletError } = await supabase
      .from("seed_wallets")
      .select("balance, used_free_taps")
      .eq("user_id", buyer.userId)
      .maybeSingle();

    if (walletError) {
      console.error("Failed to load seed wallet:", walletError.message);
      return NextResponse.json(
        { error: "Unable to process emote." },
        { status: 500 },
      );
    }

    const startingUsedFreeTaps = wallet?.used_free_taps ?? 0;
    const { totalSeedCost, freeTapsConsumed } = computeAuthoritativeEmoteBatchCost(
      batches,
      startingUsedFreeTaps,
    );

    const { data: transactionResult, error: transactionError } = await supabase.rpc(
      "process_emote_transaction",
      {
        p_user_id: buyer.userId,
        p_free_taps_consumed: freeTapsConsumed,
        p_seed_cost: totalSeedCost,
      },
    );

    if (transactionError) {
      const message = transactionError.message.toLowerCase();
      const isInsufficient =
        message.includes("insufficient") || transactionError.code === "P0001";
      const isFreeLimit = message.includes("free tap limit");

      if (isInsufficient) {
        return NextResponse.json(
          { error: "Insufficient seed balance.", code: "insufficient_seeds" },
          { status: 402 },
        );
      }

      if (isFreeLimit) {
        return NextResponse.json(
          { error: "Free tap limit reached.", code: "free_tap_limit" },
          { status: 402 },
        );
      }

      console.error("Emote transaction RPC failed:", transactionError.message);
      return NextResponse.json(
        { error: "Unable to process emote." },
        { status: 500 },
      );
    }

    const transactionPayload = transactionResult as {
      balance?: number;
      used_free_taps?: number;
    } | null;

    const author = displayAuthorFromEmail(buyer.email);
    const broadcastPayloads = buildBroadcastPayloads(batches, author);

    try {
      await broadcastLiveEmoteBatch({
        senderId: buyer.userId,
        emotes: broadcastPayloads,
      });
    } catch (broadcastError) {
      console.error("Emote broadcast failed:", broadcastError);

      const { error: reversalError } = await supabase.rpc(
        "reverse_emote_transaction",
        {
          p_user_id: buyer.userId,
          p_free_taps_consumed: freeTapsConsumed,
          p_seed_cost: totalSeedCost,
        },
      );

      if (reversalError) {
        console.error("Emote transaction reversal failed:", reversalError.message);
      }

      return NextResponse.json(
        { error: "Unable to broadcast emote." },
        { status: 500 },
      );
    }

    return withSessionCookies(
      NextResponse.json({
        ok: true,
        balance: transactionPayload?.balance ?? 0,
        usedFreeTaps: transactionPayload?.used_free_taps ?? startingUsedFreeTaps,
        quantity: broadcastPayloads.length,
      }),
    );
  } catch (error) {
    console.error("Live emote route error:", error);
    return NextResponse.json(
      { error: "Unable to send emote." },
      { status: 500 },
    );
  }
}
