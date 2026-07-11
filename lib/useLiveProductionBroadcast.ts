"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type { LivMicroBet, LiveMicroBetsSession } from "@/lib/liv-micro-bets";
import type { VmixSnapshot } from "@/lib/owner/vmix/client";

type SessionApiResponse = {
  success?: boolean;
  error?: string;
  activeBetId?: string | null;
  activeBet?: LivMicroBet | null;
  clearOverlays?: boolean;
  launchedAt?: string | null;
  updatedAt?: string | null;
};

type MicroBetsApiResponse = {
  activeBetId?: string | null;
  activeBet?: LivMicroBet | null;
  clearOverlays?: boolean;
  launchedAt?: string | null;
  updatedAt?: string | null;
  error?: string;
};

type VmixStatusApiResponse = {
  vmix?: VmixSnapshot;
  error?: string;
};

export type LiveProductionBroadcastState = {
  session: LiveMicroBetsSession | null;
  activeBet: LivMicroBet | null;
  vmix: VmixSnapshot | null;
  isLoading: boolean;
  isDispatching: boolean;
  error: string | null;
};

function mapSessionResponse(data: SessionApiResponse | MicroBetsApiResponse): LiveMicroBetsSession | null {
  if (!data.updatedAt) return null;

  return {
    id: "current",
    activeBetId: data.activeBetId ?? null,
    clearOverlays: data.clearOverlays ?? false,
    launchedAt: data.launchedAt ?? null,
    updatedAt: data.updatedAt,
    updatedBy: null,
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
        activeBet: payload.activeBet ?? null,
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

  const dispatchSession = useCallback(async (activeBetId: string | null) => {
    setState((prev) => ({ ...prev, isDispatching: true, error: null }));

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/session`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeBetId }),
        },
      );

      const payload = (await response.json()) as SessionApiResponse;

      if (!response.ok || !payload.success) {
        setState((prev) => ({
          ...prev,
          isDispatching: false,
          error: payload.error ?? `Micro-bet dispatch failed (${response.status}).`,
        }));
        return false;
      }

      const session = mapSessionResponse(payload);
      setState((prev) => ({
        ...prev,
        session,
        activeBet: payload.activeBet ?? null,
        isDispatching: false,
        error: null,
      }));

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDispatching: false,
        error: error instanceof Error ? error.message : "Micro-bet dispatch failed.",
      }));
      return false;
    }
  }, []);

  const launchMicroBet = useCallback(
    async (betId: string) => dispatchSession(betId),
    [dispatchSession],
  );

  const terminateMicroBet = useCallback(async () => dispatchSession(null), [dispatchSession]);

  return {
    ...state,
    activeBetId: state.session?.activeBetId ?? null,
    refresh,
    launchMicroBet,
    terminateMicroBet,
  };
}
