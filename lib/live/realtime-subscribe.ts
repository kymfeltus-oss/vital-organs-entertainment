import type {
  RealtimeChannel,
  SupabaseClient,
} from "@supabase/supabase-js";

let channelSequence = 0;

type PostgresChangePayload = {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export type PostgresBinding = {
  event: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema: string;
  table: string;
  callback: (payload: PostgresChangePayload) => void;
};

export type BroadcastBinding = {
  event: string;
  callback: (payload: { payload: unknown }) => void;
};

export type RealtimeBindings = {
  postgres?: PostgresBinding[];
  broadcast?: BroadcastBinding[];
};

function channelTopic(channelName: string): string {
  return `realtime:${channelName}`;
}

/** Namespaced channel id safe for React Strict Mode remounts. */
export function buildChannelName(base: string, instanceId: string): string {
  channelSequence += 1;
  return `${base}--${instanceId}--${channelSequence}`;
}

/** Remove any existing client channels that share the target topic. */
export async function removeChannelsByName(
  supabase: SupabaseClient,
  channelName: string,
): Promise<void> {
  const topic = channelTopic(channelName);
  const stale = supabase.getChannels().filter((channel) => channel.topic === topic);

  await Promise.all(stale.map((channel) => supabase.removeChannel(channel)));
}

/** Awaitable teardown for effect cleanup paths. */
export async function teardownRealtimeChannel(
  supabase: SupabaseClient,
  channel: RealtimeChannel | null,
): Promise<void> {
  if (!channel) return;
  await supabase.removeChannel(channel);
}

/**
 * Create a realtime channel with all listeners bound before subscribe().
 * Clears stale channels first to avoid Strict Mode subscribe races.
 */
export async function createRealtimeChannel(
  supabase: SupabaseClient,
  channelName: string,
  bindings: RealtimeBindings,
  onSubscribe?: (status: string) => void,
): Promise<RealtimeChannel> {
  await removeChannelsByName(supabase, channelName);

  let channel = supabase.channel(channelName);

  for (const binding of bindings.postgres ?? []) {
    channel = channel.on(
      "postgres_changes",
      {
        event: binding.event,
        schema: binding.schema,
        table: binding.table,
      },
      binding.callback,
    );
  }

  for (const binding of bindings.broadcast ?? []) {
    channel = channel.on("broadcast", { event: binding.event }, binding.callback);
  }

  channel.subscribe((status) => {
    onSubscribe?.(status);
  });

  return channel;
}
