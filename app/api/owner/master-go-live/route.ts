import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { parseGoLiveBody, runOwnerMasterGoLive } from "@/lib/owner/broadcast-mutations";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

/** Flat alias — avoids Turbopack dev cache missing nested /broadcast/* routes. */
export async function POST(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("owner-master-go-live", ip, { limit: 6, windowMs: 60_000 });
  if (!limit.allowed) {
    return ownerJsonResponse({ error: "Too many master go-live attempts." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = parseGoLiveBody(await request.json());
    if (!body) {
      return ownerJsonResponse(
        { error: "Invalid body. Expected { mode: external_hls, confirm: true }." },
        400,
      );
    }

    if (!body.confirm) {
      return ownerJsonResponse(
        { error: "Master go-live requires confirm: true after operator acknowledgement." },
        400,
      );
    }

    const admin = getSupabaseAdmin();
    const result = await runOwnerMasterGoLive(admin, body, auth.email);
    return ownerJsonResponse(
      {
        ok: result.ok,
        snapshot: result.snapshot,
        state: result.showSetup,
        previousTargetDateTime: result.previousTargetDateTime,
        message: result.message,
      },
      result.ok ? 200 : 409,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    console.error("[owner/master-go-live] POST failed:", detail);
    return ownerJsonResponse({ error: detail || "Master go-live failed." }, 500);
  }
}
