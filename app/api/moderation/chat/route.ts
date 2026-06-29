import { NextResponse } from "next/server";
import { isOwnerAuthed, ownerAuthFailureResponse } from "@/lib/owner/api-response";
import { requireOwnerUser } from "@/lib/owner/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ModerationRequestBody = {
  messageId?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as ModerationRequestBody;
    const messageId = body.messageId?.trim();

    if (!messageId || !UUID_PATTERN.test(messageId)) {
      return json({ success: false, error: "Invalid chat message id." }, 400);
    }

    const admin = getSupabaseAdmin();
    const moderatedAt = new Date().toISOString();
    const { data, error } = await admin
      .from("chat_messages")
      .update({
        deleted_at: moderatedAt,
        deleted_by: auth.userId,
      })
      .eq("id", messageId)
      .is("deleted_at", null)
      .select("id, deleted_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return json({ success: false, error: "Chat message was not found or already moderated." }, 404);
    }

    return json({
      success: true,
      messageId,
      moderatedAt,
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to moderate chat message.",
      },
      500,
    );
  }
}
