import { NextResponse } from "next/server";
import {
  loadLivBroadcastAudioRouting,
  upsertLivBroadcastAudioRouting,
  validateLivAudioRoutingWrite,
} from "@/app/enterprise/liv-golf/lib/audio-store";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse, ownerJsonResponse } from "@/lib/owner/api-response";

export const dynamic = "force-dynamic";

/** Read persisted LIV Golf tournament audio routing matrix. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  try {
    const routing = await loadLivBroadcastAudioRouting(roomId);
    return NextResponse.json({ success: true, routing });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unable to load LIV audio routing state.";
    console.error("[enterprise/liv-golf/audio/routing] GET failed:", detail);
    return NextResponse.json({ success: false, error: detail }, { status: 500 });
  }
}

/** Persist on-course mic matrix and international commentary routing updates. */
export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ownerJsonResponse({ success: false, error: "Invalid JSON body." }, 400);
  }

  const validation = validateLivAudioRoutingWrite(body);
  if (validation.ok === false) {
    return ownerJsonResponse({ success: false, error: validation.error }, 400);
  }

  try {
    const routing = await upsertLivBroadcastAudioRouting({
      roomId: validation.value.roomId,
      masterOutputMode: validation.value.masterOutputMode,
      onCourseMatrix: validation.value.onCourseMatrix,
      commentaryTracks: validation.value.commentaryTracks,
      updatedBy: auth.userId,
    });

    return ownerJsonResponse({ success: true, routing });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unable to persist LIV audio routing state.";
    console.error("[enterprise/liv-golf/audio/routing] PATCH failed:", detail);
    return ownerJsonResponse({ success: false, error: detail }, 500);
  }
}
