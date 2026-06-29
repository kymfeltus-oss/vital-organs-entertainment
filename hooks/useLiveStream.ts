"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLiveAccessEvaluation } from "@/lib/access";
import {
  LIVE_STREAM_STATE_ID,
  LIVE_ROOM_PLATFORM_CHANNEL,
  LIVE_STREAM_STATE_BROADCAST_EVENT,
} from "@/lib/live/types";
import { getSupabase } from "@/lib/supabase/client";

export type LiveStreamState = {
  streamId: string;
  hostName: string;
  hostInitials: string;
  isLive: boolean;
  viewerCount: number;
  elapsedSeconds: number;
  seedBalance: number;
  topSupporter: { name: string; amount: number };
  videoUrl: string | null;
  posterUrl: string | null;
  loading: boolean;
  error: string | null;
  broadcastCurrentState: "offline" | "scheduled" | "imminent_live" | "live";
  activeSource: "primary" | "backup" | "offline";
  playbackStatus: "ready" | "missing" | "error";
  publishMode: "none" | "external_hls" | "rtmp_encoder" | "browser_camera" | null;
  currentState: "idle" | "imminent_live" | "live" | "ended";
  playbackPending: boolean;
  activeFeedUrls: string[] | null;
  manuallyTriggerRefresh: () => Promise<void>;
};

type ManifestPayload = {
  success?: boolean;
  playbackUrl?: string | null;
  activeSource?: "primary" | "backup" | "offline";
  isLive?: boolean;
  streamIsLive?: boolean;
  publishMode?: "none" | "external_hls" | "rtmp_encoder" | "browser_camera" | null;
  broadcastCurrentState?: "offline" | "scheduled" | "imminent_live" | "live";
  playbackPending?: boolean;
  error?: string;
};

type HarvestProgressRow = {
  total_cents: number | null;
};

type LiveAcknowledgmentRow = {
  display_name: string | null;
  amount_total: number | null;
  created_at: string | null;
};

type OwnerVideoRoutingRow = {
  active_program_channel_id: string | null;
  transition_type: "CUT" | "AUTO_FADE" | string | null;
  twitch_restream_active: boolean | null;
  youtube_restream_active: boolean | null;
  facebook_restream_active: boolean | null;
};

const DEFAULT_POSTER_URL = "/effects/hero-audience-banner.png";
const STREAM_VIEWER_CHANNEL_PREFIX = "attendee-live-viewers";
const EVENT_ID = "300-awakening";

async function noopRefresh(): Promise<void> {
  return Promise.resolve();
}

function createPresenceKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "LV";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function elapsedFromLiveAnchor(
  isLive: boolean,
  imminentLiveStartedAt: string | null,
): number {
  if (!isLive || !imminentLiveStartedAt) return 0;

  const startedAt = new Date(imminentLiveStartedAt).getTime();
  if (!Number.isFinite(startedAt)) return 0;

  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

function normalizeMoney(raw: number | null | undefined): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.round(raw));
}

function normalizeClientState(
  raw: LiveStreamState["broadcastCurrentState"],
): LiveStreamState["currentState"] {
  if (raw === "imminent_live" || raw === "live") return raw;
  if (raw === "offline") return "ended";
  return "idle";
}

function activeFeedUrlsFromRouting(row: OwnerVideoRoutingRow | null): string[] | null {
  const channel = row?.active_program_channel_id?.trim();
  if (!channel) return null;
  return [channel];
}

export function formatElapsedTime(totalSeconds: number): string {
  const safeTotal = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function useLiveStream(streamId: string): LiveStreamState {
  const [state, setState] = useState<LiveStreamState>({
    streamId,
    hostName: "300 Awakening",
    hostInitials: "3A",
    isLive: false,
    viewerCount: 0,
    elapsedSeconds: 0,
    seedBalance: 0,
    topSupporter: { name: "No supporter yet", amount: 0 },
    videoUrl: null,
    posterUrl: DEFAULT_POSTER_URL,
    loading: true,
    error: null,
    broadcastCurrentState: "offline",
    activeSource: "offline",
    playbackStatus: "missing",
    publishMode: null,
    currentState: "idle",
    playbackPending: false,
    activeFeedUrls: null,
    manuallyTriggerRefresh: noopRefresh,
  });
  const liveAnchorRef = useRef<string | null>(null);
  const isLiveRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [access, manifestResponse] = await Promise.all([
        fetchLiveAccessEvaluation(),
        fetch(`/api/stream/manifest?experience=${encodeURIComponent("main_stage")}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const manifest = (await manifestResponse.json().catch(() => ({}))) as ManifestPayload;
      const supabase = getSupabase();

      const [harvestResult, acknowledgmentResult, routingResult] = await Promise.all([
        supabase
          .from("harvest_progress")
          .select("total_cents")
          .eq("id", 1)
          .maybeSingle<HarvestProgressRow>(),
        supabase
          .from("live_acknowledgments")
          .select("display_name, amount_total, created_at")
          .gt("amount_total", 0)
          .order("amount_total", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<LiveAcknowledgmentRow>(),
        supabase
          .from("owner_video_routing")
          .select(
            "active_program_channel_id, transition_type, twitch_restream_active, youtube_restream_active, facebook_restream_active",
          )
          .eq("event_id", EVENT_ID)
          .maybeSingle<OwnerVideoRoutingRow>(),
      ]);

      if (harvestResult.error) {
        throw new Error(harvestResult.error.message);
      }

      if (routingResult.error) {
        throw new Error(routingResult.error.message);
      }

      const manifestIsUsable =
        manifestResponse.ok && manifest.success !== false && typeof manifest.playbackUrl === "string";
      const hostName = access.headlinerName?.trim() || access.concertTitle?.trim() || "300 Awakening";
      const topSupporterName =
        acknowledgmentResult.data?.display_name?.trim() || "No supporter yet";
      const topSupporterAmount = normalizeMoney(acknowledgmentResult.data?.amount_total);
      const currentIsLive = access.streamIsLive === true || manifest.streamIsLive === true || manifest.isLive === true;
      const activeFeedUrls = activeFeedUrlsFromRouting(routingResult.data);
      const currentState = normalizeClientState(access.broadcastCurrentState);
      const playbackPending =
        !currentIsLive &&
        (access.broadcastCurrentState === "imminent_live" ||
          Boolean(routingResult.data?.active_program_channel_id?.trim()));

      liveAnchorRef.current = access.imminentLiveStartedAt;
      isLiveRef.current = currentIsLive;

      setState((current) => ({
        ...current,
        streamId,
        hostName,
        hostInitials: initialsFromName(hostName),
        isLive: currentIsLive,
        elapsedSeconds: elapsedFromLiveAnchor(currentIsLive, access.imminentLiveStartedAt),
        seedBalance: Math.round((harvestResult.data?.total_cents ?? 0) / 100),
        topSupporter: {
          name: topSupporterName,
          amount: topSupporterAmount,
        },
        videoUrl: manifestIsUsable ? manifest.playbackUrl ?? null : null,
        posterUrl: DEFAULT_POSTER_URL,
        loading: false,
        error: manifestResponse.ok
          ? null
          : manifest.error ?? "Live playback is not configured.",
        broadcastCurrentState: access.broadcastCurrentState,
        activeSource: manifest.activeSource ?? (currentIsLive ? "primary" : "offline"),
        playbackStatus: manifestIsUsable ? "ready" : manifestResponse.ok ? "missing" : "error",
        publishMode: access.publishMode ?? manifest.publishMode ?? null,
        currentState,
        playbackPending,
        activeFeedUrls,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load live stream status.";
      setState((current) => ({
        ...current,
        loading: false,
        error: message,
        isLive: false,
        videoUrl: null,
        playbackStatus: "error",
      }));
    }
  }, [streamId]);

  useEffect(() => {
    window.queueMicrotask(() => {
      setState((current) => ({ ...current, streamId, loading: true, error: null }));
      void refresh();
    });
  }, [refresh, streamId]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setState((current) => ({
        ...current,
        elapsedSeconds: elapsedFromLiveAnchor(isLiveRef.current, liveAnchorRef.current),
      }));
      window.setTimeout(tick, 1_000);
    };

    const timeoutId = window.setTimeout(tick, 1_000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase.channel(LIVE_ROOM_PLATFORM_CHANNEL);

    channel
      .on("broadcast", { event: LIVE_STREAM_STATE_BROADCAST_EVENT }, () => {
        void refresh();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "harvest_progress" },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_acknowledgments" },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_stream_state",
          filter: `id=eq.${LIVE_STREAM_STATE_ID}`,
        },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owner_video_routing",
          filter: `event_id=eq.${EVENT_ID}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase.channel(`${STREAM_VIEWER_CHANNEL_PREFIX}:${streamId}`, {
      config: { presence: { key: createPresenceKey() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const count = Object.values(presenceState).reduce(
          (total, presences) => total + presences.length,
          0,
        );
        setState((current) => ({ ...current, viewerCount: count }));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({
            streamId,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [streamId]);

  return {
    ...state,
    manuallyTriggerRefresh: refresh,
  };
}
