"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import {
  findLivMicroBet,
  mapLiveMicroBetsSessionRow,
  toLiveMicroBetPayload,
  type LiveMicroBetsSession,
  type LivMicroBetLaunchPayload,
} from "@/lib/liv-micro-bets";
import { livGolfRoomIdsMatch } from "@/lib/live/liv-golf-room";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  registerPlatformListener,
  releasePlatformChannel,
  unregisterPlatformListener,
} from "@/lib/live/platform-channel";
import {
  LIV_GOLF_TOUR_MAIN_ROOM,
  LIV_MICRO_BET_LAUNCH_EVENT,
  STREAM_GRAPHICS_SYNC_EVENT,
  type LiveMicroBetPayload,
} from "@/lib/live/types";
import { getSupabase } from "@/lib/supabase/client";

const LISTENER_ID = "live-stream-subscriber";
const POLL_MS = 5_000;

type MicroBetsApiResponse = {
  activeBetId?: string | null;
  activeBet?: LiveMicroBetPayload | null;
  isActive?: boolean;
  clearOverlays?: boolean;
  launchedAt?: string | null;
  updatedAt?: string | null;
  phase?: LiveMicroBetsSession["phase"];
  endsAt?: string | null;
  resolvedWinner?: "Yes" | "No" | null;
  error?: string;
};

type SubscriberData = {
  activeBetId: string | null;
  activeBet: LiveMicroBetPayload | null;
  isActive: boolean;
  isPanelOpen: boolean;
  clearOverlays: boolean;
  launchedAt: string | null;
  updatedAt: string | null;
  resolvedWinner: "Yes" | "No" | null;
  sessionData: LiveMicroBetsSession | null;
  isLoading: boolean;
  error: string | null;
};

export type LiveStreamSubscriberState = SubscriberData & {
  roomId: string;
  refresh: () => Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLaunchPayload(raw: unknown, expectedRoomId: string): LivMicroBetLaunchPayload | null {
  if (!isRecord(raw)) return null;

  const at = raw.at;
  if (typeof at !== "string") return null;

  const roomId = typeof raw.roomId === "string" ? raw.roomId : LIV_GOLF_TOUR_MAIN_ROOM;
  if (!livGolfRoomIdsMatch(expectedRoomId, roomId)) return null;

  let activeBetId: string | null = null;
  if (raw.activeBetId === null) {
    activeBetId = null;
  } else if (typeof raw.activeBetId === "string") {
    activeBetId = raw.activeBetId;
  } else {
    return null;
  }

  const is_active =
    typeof raw.is_active === "boolean" ? raw.is_active : Boolean(activeBetId);

  const clearOverlays = typeof raw.clearOverlays === "boolean" ? raw.clearOverlays : false;

  let launchedAt: string | null = null;
  if (raw.launchedAt === null) {
    launchedAt = null;
  } else if (typeof raw.launchedAt === "string") {
    launchedAt = raw.launchedAt;
  }

  let resolved_winner: "Yes" | "No" | undefined;
  if (raw.resolved_winner === "Yes" || raw.resolved_winner === "No") {
    resolved_winner = raw.resolved_winner;
  }

  let phase: LivMicroBetLaunchPayload["phase"];
  if (
    raw.phase === "OPEN" ||
    raw.phase === "CLOSING_SOON" ||
    raw.phase === "LOCKED" ||
    raw.phase === "RESOLVED"
  ) {
    phase = raw.phase;
  }

  let ends_at: string | null | undefined;
  if (raw.ends_at === null) {
    ends_at = null;
  } else if (typeof raw.ends_at === "string") {
    ends_at = raw.ends_at;
  }

  return {
    roomId,
    activeBetId,
    is_active,
    clearOverlays,
    launchedAt,
    at,
    resolved_winner,
    phase,
    ends_at,
  };
}

function resolveActiveBetPayload(
  activeBetId: string | null,
  isActive: boolean,
): LiveMicroBetPayload | null {
  if (!isActive || !activeBetId) return null;
  const bet = findLivMicroBet(activeBetId);
  if (!bet) return null;
  return toLiveMicroBetPayload(bet, true);
}

function buildSessionData(data: MicroBetsApiResponse): LiveMicroBetsSession | null {
  if (!data.updatedAt) return null;

  return mapLiveMicroBetsSessionRow({
    id: "current",
    active_bet_id: data.activeBetId ?? null,
    clear_overlays: data.clearOverlays ?? false,
    launched_at: data.launchedAt ?? null,
    updated_at: data.updatedAt,
    updated_by: null,
    phase: data.phase ?? "OPEN",
    ends_at: data.endsAt ?? null,
    resolved_winner: data.resolvedWinner ?? null,
  });
}

function mapApiResponse(data: MicroBetsApiResponse): SubscriberData {
  const activeBetId = data.activeBetId ?? null;
  const isActive = data.isActive ?? Boolean(activeBetId);
  const activeBet =
    data.activeBet ?? resolveActiveBetPayload(activeBetId, isActive);

  return {
    activeBetId,
    activeBet,
    isActive,
    isPanelOpen: Boolean(activeBet?.is_active),
    clearOverlays: data.clearOverlays ?? false,
    launchedAt: data.launchedAt ?? null,
    updatedAt: data.updatedAt ?? null,
    resolvedWinner: data.resolvedWinner ?? null,
    sessionData: buildSessionData(data),
    isLoading: false,
    error: null,
  };
}

const INITIAL_DATA: SubscriberData = {
  activeBetId: null,
  activeBet: null,
  isActive: false,
  isPanelOpen: false,
  clearOverlays: false,
  launchedAt: null,
  updatedAt: null,
  resolvedWinner: null,
  sessionData: null,
  isLoading: true,
  error: null,
};

/**
 * Subscribes to the production live-room Supabase channel for micro-bet launches
 * and hydrates session state from PostgreSQL via the micro-bets API.
 */
export function useLiveStreamSubscriber(roomId: string): LiveStreamSubscriberState {
  const [data, setData] = useState<SubscriberData>(INITIAL_DATA);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as MicroBetsApiResponse;
        setData({
          ...mapApiResponse({}),
          isLoading: false,
          error: payload.error ?? `Unable to load micro-bet session (${response.status}).`,
        });
        return;
      }

      const apiData = (await response.json()) as MicroBetsApiResponse;
      setData({
        ...mapApiResponse(apiData),
        isLoading: false,
        error: null,
      });
    } catch (refreshError) {
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error:
          refreshError instanceof Error
            ? refreshError.message
            : "Live stream subscriber refresh failed.",
      }));
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      setData({
        ...INITIAL_DATA,
        isLoading: false,
        error: "Live room id is required.",
      });
      return;
    }

    setData(INITIAL_DATA);
    void refresh();

    const poll = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch (initError) {
      setData({
        ...INITIAL_DATA,
        isLoading: false,
        error:
          initError instanceof Error
            ? initError.message
            : "Unable to initialize live stream subscriber.",
      });
      return () => window.clearInterval(poll);
    }

    acquirePlatformChannel(supabase);
    registerPlatformListener(LISTENER_ID, (channel) =>
      channel
        .on("broadcast", { event: LIV_MICRO_BET_LAUNCH_EVENT }, ({ payload }) => {
          if (cancelled) return;

          const launch = parseLaunchPayload(payload, roomId);
          if (!launch) return;

          const activeBet = resolveActiveBetPayload(launch.activeBetId, launch.is_active);

          setData((prev) => ({
            ...prev,
            activeBetId: launch.activeBetId,
            activeBet,
            isActive: launch.is_active,
            isPanelOpen: Boolean(activeBet?.is_active),
            clearOverlays: launch.clearOverlays,
            launchedAt: launch.launchedAt,
            updatedAt: launch.at,
            resolvedWinner: launch.is_active
              ? null
              : launch.resolved_winner ?? prev.resolvedWinner,
            sessionData: prev.sessionData
              ? {
                  ...prev.sessionData,
                  activeBetId: launch.activeBetId,
                  clearOverlays: launch.clearOverlays,
                  launchedAt: launch.launchedAt,
                  updatedAt: launch.at,
                  phase: launch.phase ?? prev.sessionData.phase,
                  endsAt: launch.ends_at ?? prev.sessionData.endsAt,
                  resolvedWinner: launch.is_active
                    ? null
                    : launch.resolved_winner ?? prev.sessionData.resolvedWinner,
                }
              : {
                  id: "current",
                  activeBetId: launch.activeBetId,
                  clearOverlays: launch.clearOverlays,
                  launchedAt: launch.launchedAt,
                  updatedAt: launch.at,
                  updatedBy: null,
                  phase: launch.phase ?? "OPEN",
                  endsAt: launch.ends_at ?? null,
                  resolvedWinner: launch.resolved_winner ?? null,
                },
            isLoading: false,
            error:
              launch.is_active && !activeBet
                ? "Active bet is not in the production catalog."
                : null,
          }));

          void refresh();
        })
        .on("broadcast", { event: STREAM_GRAPHICS_SYNC_EVENT }, () => {
          if (!cancelled) void refresh();
        }),
    );
    commitPlatformChannelSubscribe();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      unregisterPlatformListener(LISTENER_ID);
      releasePlatformChannel(supabase);
    };
  }, [roomId, refresh]);

  return {
    roomId,
    ...data,
    refresh,
  };
}
