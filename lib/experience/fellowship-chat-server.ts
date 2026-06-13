import { inspectOpsAdminAccess } from "@/lib/ops/admin-auth";
import {
  FELLOWSHIP_CHAT_HISTORY_LIMIT,
  FELLOWSHIP_SLOW_MODE_SECONDS,
  mapFellowshipChatRow,
  type FellowshipChatMessage,
  type FellowshipChatMessageRow,
  type FellowshipChatSession,
} from "@/lib/experience/fellowship-chat";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const FELLOWSHIP_MESSAGE_SELECT =
  "id, user_id, email, content, created_at, deleted_at, is_pinned, pinned_at";

export async function loadActiveMuteUntil(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("chat_room_mutes")
    .select("muted_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.muted_until) return null;

  const mutedUntilMs = new Date(data.muted_until).getTime();
  if (Number.isNaN(mutedUntilMs) || mutedUntilMs <= Date.now()) {
    await admin.from("chat_room_mutes").delete().eq("user_id", userId);
    return null;
  }

  return data.muted_until;
}

export async function buildFellowshipSession(
  admin: SupabaseClient,
  user: User | null,
): Promise<FellowshipChatSession> {
  if (!user) {
    return {
      authenticated: false,
      canSend: false,
      isModerator: false,
      mutedUntil: null,
      slowModeSeconds: FELLOWSHIP_SLOW_MODE_SECONDS,
    };
  }

  const mutedUntil = await loadActiveMuteUntil(admin, user.id);
  const isModerator = inspectOpsAdminAccess(user).allowed;

  return {
    authenticated: true,
    canSend: !mutedUntil,
    isModerator,
    mutedUntil,
    slowModeSeconds: FELLOWSHIP_SLOW_MODE_SECONDS,
  };
}

export async function loadFellowshipChatFeed(admin: SupabaseClient): Promise<{
  messages: FellowshipChatMessage[];
  pinned: FellowshipChatMessage | null;
}> {
  const [{ data: pinnedRow }, { data: messageRows }] = await Promise.all([
    admin
      .from("chat_messages")
      .select(FELLOWSHIP_MESSAGE_SELECT)
      .eq("is_pinned", true)
      .is("deleted_at", null)
      .order("pinned_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("chat_messages")
      .select(FELLOWSHIP_MESSAGE_SELECT)
      .is("deleted_at", null)
      .eq("is_pinned", false)
      .order("created_at", { ascending: false })
      .limit(FELLOWSHIP_CHAT_HISTORY_LIMIT),
  ]);

  const messages = [...(messageRows ?? [])]
    .reverse()
    .map((row) => mapFellowshipChatRow(row as FellowshipChatMessageRow));

  const pinned = pinnedRow
    ? mapFellowshipChatRow(pinnedRow as FellowshipChatMessageRow)
    : null;

  return { messages, pinned };
}

export async function assertFellowshipSlowMode(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await admin
    .from("chat_messages")
    .select("created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return { ok: true };

  const elapsedMs = Date.now() - new Date(data.created_at).getTime();
  const waitMs = FELLOWSHIP_SLOW_MODE_SECONDS * 1_000 - elapsedMs;

  if (waitMs > 0) {
    const waitSeconds = Math.ceil(waitMs / 1_000);
    return {
      ok: false,
      error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before sending again.`,
    };
  }

  return { ok: true };
}
