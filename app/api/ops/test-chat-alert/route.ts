import { NextRequest, NextResponse } from "next/server";
import { insertFellowshipChatMessage } from "@/lib/experience/fellowship-chat-server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { scanMessageForTrouble } from "@/lib/ops/chat-scanner";
import { resolveMockChatAlertComplaint } from "@/lib/ops/test-chat-alert-mocks";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type TestChatAlertBody = {
  index?: unknown;
};

/**
 * Dev-only: insert a mock fellowship chat row so ops trouble-alert realtime fires.
 * Uses the same `chat_messages` INSERT path as live attendee chat.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Chat alert simulator is only available in development." },
      { status: 403 },
    );
  }

  const gate = await requireOpsAdminApiUser();
  if (gate.response) return gate.response;

  const email = gate.user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { success: false, error: "Ops account must have an email to simulate chat." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as TestChatAlertBody;
    const parsedIndex = typeof body.index === "number" ? body.index : undefined;
    const simulatedText = resolveMockChatAlertComplaint(parsedIndex);
    const detectedIssue = scanMessageForTrouble(simulatedText);

    const admin = getSupabaseAdmin();
    const insertResult = await insertFellowshipChatMessage(admin, {
      user_id: gate.user.id,
      email: `simulator+${email}`,
      content: simulatedText,
    });

    if (insertResult.error || !insertResult.data) {
      return NextResponse.json(
        { success: false, error: insertResult.error ?? "Unable to insert mock chat message." },
        { status: 500 },
      );
    }

    const { broadcastAttendeeChatMessage } = await import(
      "@/lib/experience/broadcast-attendee-chat-message"
    );
    void broadcastAttendeeChatMessage({
      id: insertResult.data.id,
      user_id: insertResult.data.user_id,
      email: insertResult.data.email,
      content: insertResult.data.content,
      created_at: insertResult.data.created_at,
    }).catch((broadcastError) => {
      console.error("Attendee chat broadcast failed:", broadcastError);
    });

    return NextResponse.json({
      success: true,
      simulatedText,
      detectedIssue,
      messageId: insertResult.data.id,
      usedLegacySchema: insertResult.usedLegacy,
    });
  } catch (error) {
    console.error("[OPS_TEST_CHAT_ALERT_ERR]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to simulate chat alert.",
      },
      { status: 500 },
    );
  }
}
