import { NextRequest } from "next/server";
import { consumeRateLimit, resolveClientIp } from "@/lib/auth/rate-limit";
import { LiveKitConfigError } from "@/lib/enterprise/liv-golf/livekit-config";
import { mintLivPublisherToken } from "@/lib/enterprise/liv-golf/livekit-server";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

type TokenBody = {
  roomName?: unknown;
  participantIdentity?: unknown;
  displayName?: unknown;
};

function parseTokenBody(body: unknown): {
  roomName?: string;
  participantIdentity?: string;
  displayName?: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const record = body as TokenBody;

  const roomName = typeof record.roomName === "string" ? record.roomName.trim() : undefined;
  const participantIdentity =
    typeof record.participantIdentity === "string"
      ? record.participantIdentity.trim()
      : undefined;
  const displayName =
    typeof record.displayName === "string" ? record.displayName.trim() : undefined;

  return { roomName, participantIdentity, displayName };
}

/** Mint a publisher-only LiveKit JWT for in-app browser camera ingest. */
export async function POST(request: Request) {
  const ip = resolveClientIp(request as NextRequest);
  const limit = await consumeRateLimit("liv-livekit-token", ip, { limit: 30, windowMs: 60_000 });
  if (!limit.allowed) {
    return ownerJsonResponse({ success: false, error: "Too many LiveKit token requests." }, 429);
  }

  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return ownerJsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = parseTokenBody(body);
  if (!parsed) {
    return ownerJsonResponse({ success: false, error: "Invalid token request body." }, 400);
  }

  try {
    const session = await mintLivPublisherToken({
      roomName: parsed.roomName,
      participantIdentity: parsed.participantIdentity,
      displayName: parsed.displayName || auth.email,
    });

    return ownerJsonResponse({
      success: true,
      token: session.token,
      url: session.url,
      roomName: session.roomName,
      participantIdentity: session.participantIdentity,
    });
  } catch (error) {
    if (error instanceof LiveKitConfigError) {
      return ownerJsonResponse({ success: false, error: error.message }, 503);
    }

    const detail = error instanceof Error ? error.message : "LiveKit token broker failed.";
    console.error("[enterprise/liv-golf/livekit/token] POST failed:", detail);
    return ownerJsonResponse({ success: false, error: detail }, 500);
  }
}
