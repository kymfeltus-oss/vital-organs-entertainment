"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIVE_STREAM_STATE_BROADCAST_EVENT } from "@/lib/live/types";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import type { AudioChannel } from "@/lib/broadcast/types";
import type { StreamTelemetry } from "@/lib/broadcast/types";
import {
  buildOpsStreamState,
  type OpsStreamState,
} from "@/lib/ops/ops-stream-state";
import type { OpsSnapshot } from "@/lib/ops/types";
import { getSupabase } from "@/lib/supabase/client";

const OPS_STREAM_STATE_LISTENER_ID = "ops-stream-state-realtime";
const STREAM_STATE_FALLBACK_MS = 30_000;
const TELEMETRY_TICK_MS = 1_000;

export type { OpsStreamState } from "@/lib/ops/ops-stream-state";

export type UseOpsStreamStateRealtimeOptions = {
  audioChannels?: AudioChannel[];
  streamTelemetry?: StreamTelemetry | null;
  localWebcamAudioLevel?: number;
};

export type UseOpsStreamStateRealtimeResult = {
  stream: OpsSnapshot["stream"] | null;
  opsState: OpsStreamState | null;
  refreshStream: () => Promise<void>;
};

type RealtimeArg =
  | UseOpsStreamStateRealtimeOptions
  | ((stream: OpsSnapshot["stream"]) => void)
  | undefined;

function resolveOptions(arg: RealtimeArg): {
  options: UseOpsStreamStateRealtimeOptions;
  onStreamUpdate?: (stream: OpsSnapshot["stream"]) => void;
} {
  if (typeof arg === "function") {
    return { options: {}, onStreamUpdate: arg };
  }
  return { options: arg ?? {}, onStreamUpdate: undefined };
}

/** Live ops stream + derived telemetry for RestreamStatusStrip and audio meters. */
export function useOpsStreamStateRealtime(
  arg?: RealtimeArg,
): UseOpsStreamStateRealtimeResult {
  const { options, onStreamUpdate } = resolveOptions(arg);
  const {
    audioChannels = [],
    streamTelemetry = null,
    localWebcamAudioLevel = 0,
  } = options;

  const [stream, setStream] = useState<OpsSnapshot["stream"] | null>(null);
  const [tick, setTick] = useState(0);
  const [liveSinceMs, setLiveSinceMs] = useState<number | null>(null);

  const onStreamUpdateRef = useRef(onStreamUpdate);
  useEffect(() => {
    onStreamUpdateRef.current = onStreamUpdate;
  }, [onStreamUpdate]);

  const fetchStreamState = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/stream-state", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as { stream?: OpsSnapshot["stream"] | null };
      const nextStream = data.stream ?? null;
      setStream(nextStream);
      setLiveSinceMs((previous) => {
        if (nextStream?.isLive) return previous ?? Date.now();
        return null;
      });
      onStreamUpdateRef.current?.(nextStream);
    } catch (error) {
      console.error("[OPS_STREAM_STATE_REALTIME_ERR]:", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let fallbackInterval: number | undefined;
    const telemetryInterval = window.setInterval(() => {
      if (!cancelled) setTick((value) => value + 1);
    }, TELEMETRY_TICK_MS);

    let supabase: ReturnType<typeof getSupabase> | null = null;

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("[OPS_STREAM_STATE_REALTIME_INIT_ERR]:", initError);
      fallbackInterval = window.setInterval(() => {
        void fetchStreamState();
      }, STREAM_STATE_FALLBACK_MS);
    }

    if (supabase) {
      queueMicrotask(() => {
        void fetchStreamState();
      });

      acquirePlatformChannel(supabase);

      registerPlatformListener(OPS_STREAM_STATE_LISTENER_ID, (channel) =>
        channel.on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
          if (!cancelled) void fetchStreamState();
        }),
      );

      commitPlatformChannelSubscribe();
    }

    return () => {
      cancelled = true;
      if (supabase) {
        unregisterPlatformListener(OPS_STREAM_STATE_LISTENER_ID);
        releasePlatformChannel(supabase);
      }
      if (fallbackInterval !== undefined) {
        window.clearInterval(fallbackInterval);
      }
      window.clearInterval(telemetryInterval);
    };
  }, [fetchStreamState]);

  const opsState = useMemo(
    () =>
      buildOpsStreamState({
        stream,
        audioChannels,
        streamTelemetry,
        liveSinceMs,
        localWebcamAudioLevel,
      }),
    // tick forces uptime refresh every second while live
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick drives uptime clock
    [stream, audioChannels, streamTelemetry, liveSinceMs, localWebcamAudioLevel, tick],
  );

  return { stream, opsState, refreshStream: fetchStreamState };
}
