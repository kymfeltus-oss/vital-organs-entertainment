import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { parseGoLiveBody, runOwnerGoLive } from "@/lib/owner/broadcast-mutations";
import { ownerAuthFailureResponse, ownerJsonResponse, isOwnerAuthed } from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("owner-go-live", ip, { limit: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    return ownerJsonResponse({ error: "Too many go-live attempts." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = parseGoLiveBody(await request.json());
    if (!body) {
      return ownerJsonResponse(
        { error: "Invalid body. Expected { mode: external_hls | rtmp_encoder | browser_camera }." },
        400,
      );
    }

    const admin = getSupabaseAdmin();
    const result = await runOwnerGoLive(admin, body, auth.email);
    return ownerJsonResponse(
      { ok: result.ok, snapshot: result.snapshot, message: result.message },
      result.ok ? 200 : 409,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    console.error("[owner/broadcast/go-live] POST failed:", detail);
    return ownerJsonResponse({ error: "Go-live failed." }, 500);
  }
}
