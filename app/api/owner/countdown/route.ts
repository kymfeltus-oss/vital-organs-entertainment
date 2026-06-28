import { requireOwnerUser } from "@/lib/owner/auth";
import { adjustCountdownStartBySeconds } from "@/lib/owner/adjust-countdown-start";
import { buildOwnerBroadcastSnapshot } from "@/lib/owner/build-broadcast-snapshot";
import {
  ownerAuthFailureResponse,
  ownerJsonResponse,
  isOwnerAuthed,
} from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

function parseOffsetSeconds(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as { offsetSeconds?: unknown }).offsetSeconds;
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) return null;
  return Math.trunc(value);
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const offsetSeconds = parseOffsetSeconds(await request.json());
    if (offsetSeconds === null) {
      return ownerJsonResponse(
        { error: "Invalid body. Expected { offsetSeconds: number } (non-zero)." },
        400,
      );
    }

    const { message } = await adjustCountdownStartBySeconds(offsetSeconds);
    const { snapshot } = await buildOwnerBroadcastSnapshot();

    return ownerJsonResponse({ ok: true, message, snapshot });
  } catch (error) {
    console.error("[owner/countdown] PATCH failed:", error);
    return ownerJsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Unable to adjust countdown schedule.",
      },
      500,
    );
  }
}
