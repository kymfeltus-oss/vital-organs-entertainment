import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { resolveScheduleTimezone } from "@/lib/live/schedule-timezone";
import { requireOwnerUser } from "@/lib/owner/auth";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";
import { emitStreamStateSync } from "@/lib/owner/broadcast-stream-sync";
import { loadShowSetupState, saveShowSetupState } from "@/lib/owner/show-setup-state";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, limit = 120): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
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
      schedule_timezone?: unknown;
      scheduleTimezone?: unknown;
      eventLocation?: unknown;
      livestreamAvailability?: unknown;
      hostNames?: unknown;
    };

    const targetDateTime = parseTargetDateTime(body.targetDateTime ?? body.datetime);
    if (!targetDateTime) {
      return ownerJsonResponse(
        { error: "Show date and time are required." },
        400,
      );
    }

    const current = await loadShowSetupState();
    const showTitle = cleanText(body.title ?? body.eventTitle);
    const presenterName = cleanText(body.presenterName ?? body.pastor);
    const eventLocation = cleanText(body.eventLocation, 100);
    const livestreamAvailability = cleanText(body.livestreamAvailability, 100);
    const hostNames = Array.isArray(body.hostNames)
      ? body.hostNames
          .map((host) => cleanText(host, 80))
          .filter((host): host is string => Boolean(host))
          .slice(0, 8)
      : undefined;
    const scheduleTimezone = resolveScheduleTimezone(
      body.schedule_timezone ?? body.scheduleTimezone ?? current.scheduleTimezone,
    );

    const state = await saveShowSetupState(
      {
        ...(showTitle ? { showTitle } : {}),
        ...(presenterName ? { presenterName } : {}),
        ...(eventLocation ? { eventLocation } : {}),
        ...(livestreamAvailability ? { livestreamAvailability } : {}),
        ...(hostNames ? { hostNames } : {}),
        targetDateTime,
        schedule_timezone: scheduleTimezone,
      },
      auth.email,
    );

    await emitStreamStateSync();

    return ownerJsonResponse({
      ok: true,
      state,
      message: "Event countdown schedule saved.",
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
