import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { saveShowSetupState } from "@/lib/owner/show-setup-state";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, limit = 120): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/<[^>]*>/g, "").slice(0, limit);
}

function parseTargetDateTime(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function handleCountdownUpdate(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("owner-countdown-update", ip, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!limit.allowed) {
    return ownerJsonResponse({ error: "Too many countdown update attempts." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as {
      title?: unknown;
      eventTitle?: unknown;
      presenterName?: unknown;
      pastor?: unknown;
      targetDateTime?: unknown;
      datetime?: unknown;
    };

    const showTitle = cleanText(body.title ?? body.eventTitle);
    const presenterName = cleanText(body.presenterName ?? body.pastor);
    const targetDateTime = parseTargetDateTime(body.targetDateTime ?? body.datetime);

    if (!showTitle || !presenterName || !targetDateTime) {
      return ownerJsonResponse(
        { error: "Invalid body. Expected title, presenterName, and targetDateTime." },
        400,
      );
    }

    const state = await saveShowSetupState(
      {
        showTitle,
        presenterName,
        targetDateTime,
      },
      auth.email,
    );

    await emitStreamStateSync();

    return ownerJsonResponse({
      ok: true,
      state,
      message: "Event countdown schedule updated.",
    });
  } catch (error) {
    console.error("[owner/countdown/update] failed:", error);
    return ownerJsonResponse(
      { error: error instanceof Error ? error.message : "Countdown update failed." },
      500,
    );
  }
}

export async function POST(request: Request) {
  return handleCountdownUpdate(request);
}

export async function PATCH(request: Request) {
  return handleCountdownUpdate(request);
}
