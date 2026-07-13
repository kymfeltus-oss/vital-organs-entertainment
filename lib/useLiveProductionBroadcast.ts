"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { LivMicroBet, LiveMicroBetsSession, MicroBetSessionPhase } from "@/lib/liv-micro-bets";
import type { LiveMicroBetPayload } from "@/lib/live/types";
import type { VmixSnapshot } from "@/lib/owner/vmix/client";

type SessionApiResponse = {
  success?: boolean;
  error?: string;
  activeBetId?: string | null;
  activeBet?: LivMicroBet | LiveMicroBetPayload | null;
  clearOverlays?: boolean;
  launchedAt?: string | null;
  updatedAt?: string | null;
  phase?: MicroBetSessionPhase;
  endsAt?: string | null;
  resolvedWinner?: "Yes" | "No" | null;
  winningSelectionId?: string | null;
};

type MicroBetsApiResponse = {
  activeBetId?: string | null;
  activeBet?: LiveMicroBetPayload | null;
  clearOverlays?: boolean;
  launchedAt?: string | null;
  updatedAt?: string | null;
  phase?: MicroBetSessionPhase;
  endsAt?: string | null;
  resolvedWinner?: "Yes" | "No" | null;
  winningSelectionId?: string | null;
  error?: string;
};

type VmixStatusApiResponse = {
  vmix?: VmixSnapshot;
  error?: string;
};

/** Postgres `live_micro_bets_session` row mirror for studio dashboards. */
export type ProductionSessionRow = {
  id: string;
  active_bet_id: string | null;
  clear_overlays: boolean;
  launched_at: string | null;
  updated_at: string;
  updated_by: string | null;
  phase: MicroBetSessionPhase;
  ends_at: string | null;
  resolved_winner: "Yes" | "No" | null;
};

export type LiveProductionBroadcastState = {
  session: LiveMicroBetsSession | null;
  activeBet: LivMicroBet | null;
  vmix: VmixSnapshot | null;
  isLoading: boolean;
  isDispatching: boolean;
  error: string | null;
};

function toProductionSessionRow(session: LiveMicroBetsSession | null): ProductionSessionRow | null {
  if (!session) return null;

  return {
    id: session.id,
    active_bet_id: session.activeBetId,
    clear_overlays: session.clearOverlays,
    launched_at: session.launchedAt,
    updated_at: session.updatedAt,
    updated_by: session.updatedBy,
    phase: session.phase,
    ends_at: session.endsAt,
    resolved_winner: session.resolvedWinner,
  };
}

function mapSessionResponse(
  data: SessionApiResponse | MicroBetsApiResponse,
): LiveMicroBetsSession | null {
  if (!data.updatedAt) return null;

  return {
    id: "current",
    activeBetId: data.activeBetId ?? null,
    clearOverlays: data.clearOverlays ?? false,
    launchedAt: data.launchedAt ?? null,
    updatedAt: data.updatedAt,
    updatedBy: null,
    phase: data.phase ?? "OPEN",
    endsAt: data.endsAt ?? null,
    resolvedWinner: data.resolvedWinner ?? null,
    winningSelectionId: data.winningSelectionId ?? null,
  };
}

async function fetchProductionVmixSnapshot(): Promise<VmixSnapshot | null> {
  try {
    const response = await fetch(`${getClientAppUrl()}/api/owner/vmix/status`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as VmixStatusApiResponse;
    return payload.vmix ?? null;
  } catch {
    return null;
  }
}

export function useLiveProductionBroadcast() {
  const [state, setState] = useState<LiveProductionBroadcastState>({
    session: null,
    activeBet: null,
    vmix: null,
    isLoading: true,
    isDispatching: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      const [sessionResponse, vmixSnapshot] = await Promise.all([
        fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetchProductionVmixSnapshot(),
      ]);

      if (!sessionResponse.ok) {
        const payload = (await sessionResponse.json().catch(() => ({}))) as MicroBetsApiResponse;
        setState((prev) => ({
          ...prev,
          vmix: vmixSnapshot,
          isLoading: false,
          error: payload.error ?? `Unable to load micro-bet session (${sessionResponse.status}).`,
        }));
        return;
      }

      const payload = (await sessionResponse.json()) as MicroBetsApiResponse;
      const session = mapSessionResponse(payload);

      setState((prev) => ({
        ...prev,
        session,
        activeBet: null,
        vmix: vmixSnapshot,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Production broadcast refresh failed.",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patchSession = useCallback(async (body: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, isDispatching: true, error: null }));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/session`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      const payload = (await response.json()) as SessionApiResponse;

      if (!response.ok || !payload.success) {
        setState((prev) => ({
          ...prev,
          error: payload.error ?? `Micro-bet dispatch failed (${response.status}).`,
        }));
        return false;
      }

      const session = mapSessionResponse(payload);
      setState((prev) => ({
        ...prev,
        session,
        error: null,
      }));

      return true;
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Micro-bet dispatch timed out after 30 seconds."
          : error instanceof Error
            ? error.message
            : "Micro-bet dispatch failed.";

      setState((prev) => ({
        ...prev,
        error: message,
      }));
      return false;
    } finally {
      window.clearTimeout(timeoutId);
      setState((prev) => ({ ...prev, isDispatching: false }));
    }
  }, []);

  const dispatchSession = useCallback(
    async (activeBetId: string | null) => patchSession({ activeBetId }),
    [patchSession],
  );

  const launchMicroBet = useCallback(
    async (betId: string) => dispatchSession(betId),
    [dispatchSession],
  );

  const terminateMicroBet = useCallback(
    async () =>
      patchSession({
        activeBetId: null,
        phase: "OPEN",
      }),
    [patchSession],
  );

  const lockMicroBet = useCallback(async () => patchSession({ phase: "LOCKED" }), [patchSession]);

  const resolveMicroBetYes = useCallback(async () => {
    const betId = state.session?.activeBetId;
    if (!betId) return false;

    setState((prev) => ({ ...prev, isDispatching: true, error: null }));

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/resolve`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bet_id: betId,
            action: "RESOLVE",
            winning_option: "Yes",
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setState((prev) => ({
          ...prev,
          error: payload.error ?? "Unable to resolve micro-bet to YES.",
        }));
        return false;
      }

      await refresh();
      setState((prev) => ({ ...prev, error: null }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unable to resolve micro-bet.",
      }));
      return false;
    } finally {
      setState((prev) => ({ ...prev, isDispatching: false }));
    }
  }, [refresh, state.session?.activeBetId]);

  return {
    ...state,
    activeBetId: state.session?.activeBetId ?? null,
    currentSession: toProductionSessionRow(state.session),
    refresh,
    launchMicroBet,
    terminateMicroBet,
    lockMicroBet,
    resolveMicroBetYes,
  };
}
