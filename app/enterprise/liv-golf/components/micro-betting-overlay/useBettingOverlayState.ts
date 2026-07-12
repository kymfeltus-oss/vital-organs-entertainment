"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import { requestLiveSeedWalletRefresh } from "@/lib/live/seed-wallet-events";
import { activeBetToLiveMarket } from "./catalog-to-market";
import {
  findLegendaryShowcaseScenario,
  resolveShowcaseSelection,
} from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import {
  computeSecondsRemaining,
  computeSessionPhase,
  LIV_MICRO_BET_WINDOW_SECONDS,
} from "./session-utils";
import type {
  LiveMarket,
  OverlayPhase,
  OverlayServerSession,
  PlaceWagerPayload,
  PlaceWagerResponse,
  WagerStatus,
} from "./types";

type UseBettingOverlayStateProps = {
  roomId: string;
  serverSession: OverlayServerSession | null;
  userTokens: number;
  geoSample: { lat: number; lng: number } | null;
  geoAttestationToken: string | null;
  onWagerDeduct: (newBalance: number) => void;
  onWagerSuccess?: () => Promise<void>;
};

export function useBettingOverlayState({
  roomId,
  serverSession,
  userTokens,
  geoSample,
  geoAttestationToken,
  onWagerDeduct,
  onWagerSuccess,
}: UseBettingOverlayStateProps) {
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  const [wagerStatus, setWagerStatus] = useState<WagerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());

  const activeBetId = serverSession?.active_bet_id ?? null;

  useEffect(() => {
    setSelectedSelection(null);
    setWagerStatus("idle");
    setErrorMessage(null);
  }, [activeBetId]);

  useEffect(() => {
    if (!serverSession?.ends_at || serverSession.phase === "RESOLVED") {
      return undefined;
    }

    const tick = () => setClockMs(Date.now());
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [serverSession?.ends_at, serverSession?.phase]);

  const timeLeft = useMemo(
    () => computeSecondsRemaining(serverSession?.ends_at ?? null, clockMs),
    [serverSession?.ends_at, clockMs],
  );

  const localPhase: OverlayPhase = useMemo(() => {
    if (wagerStatus === "confirmed") return "CONFIRMED";
    if (!serverSession) return "OPEN";

    if (serverSession.phase === "LOCKED" || serverSession.phase === "RESOLVED") {
      return serverSession.phase;
    }

    const sessionPhase = computeSessionPhase({
      isActive: serverSession.is_active,
      clearOverlays: serverSession.clear_overlays,
      resolvedWinner: serverSession.resolved_winner,
      secondsRemaining: timeLeft,
      launchedAt: serverSession.launched_at,
      serverPhase: serverSession.phase,
    });

    if (sessionPhase === "RESOLVED") return "RESOLVED";
    if (sessionPhase === "LOCKED" || timeLeft <= 0) return "LOCKED";
    if (sessionPhase === "CLOSING_SOON" || timeLeft <= 5) return "CLOSING_SOON";
    return "OPEN";
  }, [serverSession, timeLeft, wagerStatus]);

  const currentMarket: LiveMarket | null = useMemo(() => {
    if (!serverSession?.activeBet || !serverSession.is_active) return null;
    return activeBetToLiveMarket(serverSession.activeBet, LIV_MICRO_BET_WINDOW_SECONDS);
  }, [serverSession?.activeBet, serverSession?.is_active]);

  const fixedStake = currentMarket?.stakeAmount ?? 0;

  const placeWager = useCallback(async () => {
    if (
      !serverSession?.activeBet ||
      !selectedSelection ||
      !activeBetId ||
      localPhase === "LOCKED" ||
      localPhase === "RESOLVED" ||
      wagerStatus === "submitting"
    ) {
      return;
    }

    const selectionName = currentMarket?.selections.find((entry) => entry.id === selectedSelection)?.name;
    const showcase = serverSession?.activeBet?.bet_id
      ? findLegendaryShowcaseScenario(serverSession.activeBet.bet_id)
      : null;

    let selection: "Yes" | "No" | null = null;
    if (showcase && selectedSelection) {
      selection = resolveShowcaseSelection(showcase, selectedSelection);
    } else if (selectionName === "YES" || selectionName?.startsWith("YES")) {
      selection = "Yes";
    } else if (selectionName === "NO" || selectionName?.startsWith("NO")) {
      selection = "No";
    }

    if (!selection) {
      setErrorMessage("Select Yes or No before submitting.");
      setWagerStatus("error");
      return;
    }

    if (userTokens < fixedStake) {
      setErrorMessage("Insufficient fan token balance for this entry.");
      setWagerStatus("error");
      return;
    }

    setWagerStatus("submitting");
    setErrorMessage(null);

    const payload: PlaceWagerPayload = {
      betId: activeBetId,
      selection,
      lat: geoSample?.lat,
      lng: geoSample?.lng,
      capturedAt: new Date().toISOString(),
      geoAttestationToken,
    };

    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/place`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as PlaceWagerResponse;

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setErrorMessage("Sign in to place a wager.");
        } else if (response.status === 403) {
          setErrorMessage(data.message ?? "Prop wagering is unavailable in your region.");
        } else if (response.status === 409) {
          setErrorMessage(data.message ?? "This bet is not currently live.");
        } else {
          setErrorMessage(data.message ?? "Unable to place wager.");
        }
        setWagerStatus("error");
        return;
      }

      if (typeof data.balance === "number") {
        onWagerDeduct(data.balance);
      }

      requestLiveSeedWalletRefresh();
      if (onWagerSuccess) {
        await onWagerSuccess();
      }

      setWagerStatus("confirmed");
    } catch (error) {
      console.error(`[LIV micro-bet overlay:${roomId}] place failed:`, error);
      setErrorMessage("Network loss detected. Connection timed out.");
      setWagerStatus("error");
    }
  }, [
    activeBetId,
    currentMarket?.selections,
    fixedStake,
    geoAttestationToken,
    geoSample?.lat,
    geoSample?.lng,
    localPhase,
    onWagerDeduct,
    onWagerSuccess,
    roomId,
    selectedSelection,
    serverSession?.activeBet,
    userTokens,
    wagerStatus,
  ]);

  return {
    currentMarket,
    selectedSelection,
    fixedStake,
    localPhase,
    wagerStatus,
    errorMessage,
    timeLeft,
    windowSeconds: LIV_MICRO_BET_WINDOW_SECONDS,
    setSelectedSelection,
    placeWager,
  };
}
