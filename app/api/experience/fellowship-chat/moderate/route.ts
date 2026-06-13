import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdminApiUser } from "@/lib/ops/assert-ops-admin";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type ModerateBody =
  | { action: "delete"; messageId: string }
  | { action: "mute"; userId: string; durationMinutes?: number; reason?: string }
  | { action: "pin"; messageId: string }
  | { action: "unpin" };

const DEFAULT_MUTE_MINUTES = 30;

export async function POST(request: NextRequest) {
  const { user, response } = await requireOpsAdminApiUser();
  if (!user || response) return response;

  try {
    const body = (await request.json()) as ModerateBody;
    const admin = getSupabaseAdmin();

    if (body.action === "delete") {
      if (!body.messageId?.trim()) {
        return NextResponse.json({ error: "messageId required." }, { status: 400 });
      }

      const { error } = await admin
        .from("chat_messages")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          is_pinned: false,
          pinned_at: null,
          pinned_by: null,
        })
        .eq("id", body.messageId);

      if (error) {
        console.error("Fellowship chat delete failed:", error.message);
        return NextResponse.json({ error: "Unable to delete message." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "delete" });
    }

    if (body.action === "mute") {
      if (!body.userId?.trim()) {
        return NextResponse.json({ error: "userId required." }, { status: 400 });
      }

      const durationMinutes = Math.min(
        24 * 60,
        Math.max(5, body.durationMinutes ?? DEFAULT_MUTE_MINUTES),
      );
      const mutedUntil = new Date(Date.now() + durationMinutes * 60_000).toISOString();

      const { error } = await admin.from("chat_room_mutes").upsert(
        {
          user_id: body.userId,
          muted_until: mutedUntil,
          muted_by: user.id,
          reason: body.reason?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("Fellowship chat mute failed:", error.message);
        return NextResponse.json({ error: "Unable to mute user." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "mute", mutedUntil });
    }

    if (body.action === "pin") {
      if (!body.messageId?.trim()) {
        return NextResponse.json({ error: "messageId required." }, { status: 400 });
      }

      await admin
        .from("chat_messages")
        .update({
          is_pinned: false,
          pinned_at: null,
          pinned_by: null,
        })
        .eq("is_pinned", true);

      const { error } = await admin
        .from("chat_messages")
        .update({
          is_pinned: true,
          pinned_at: new Date().toISOString(),
          pinned_by: user.id,
        })
        .eq("id", body.messageId)
        .is("deleted_at", null);

      if (error) {
        console.error("Fellowship chat pin failed:", error.message);
        return NextResponse.json({ error: "Unable to pin message." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "pin" });
    }

    if (body.action === "unpin") {
      const { error } = await admin
        .from("chat_messages")
        .update({
          is_pinned: false,
          pinned_at: null,
          pinned_by: null,
        })
        .eq("is_pinned", true);

      if (error) {
        console.error("Fellowship chat unpin failed:", error.message);
        return NextResponse.json({ error: "Unable to unpin announcement." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, action: "unpin" });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("Fellowship chat moderation failed:", error);
    return NextResponse.json({ error: "Moderation action failed." }, { status: 500 });
  }
}
