"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Eye,
  Layers,
  Lock,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Square,
  Trophy,
  Tv,
} from "lucide-react";
import { getClientAppUrl } from "@/lib/client-api";
import { useLivStreamStatus } from "@/app/enterprise/liv-golf/hooks/useLivStreamStatus";
import { useRiskTelemetry } from "@/app/enterprise/liv-golf/hooks/useRiskTelemetry";
import {
  LEGENDARY_SHOWCASE_SCENARIOS,
  isShowcaseBetId,
} from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { LIV_MICRO_BETS } from "@/lib/liv-micro-bets";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";
import { useLiveProductionBroadcast } from "@/lib/useLiveProductionBroadcast";
import type { OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";
import { StudioSimulationDeck } from "./StudioSimulationDeck";

export default function StudioBetControllerPage() {
  const {
    currentSession,
    isDispatching,
    isLoading,
    error,
    vmix,
    launchMicroBet,
    terminateMicroBet,
    lockMicroBet,
    resolveMicroBetYes,
    refresh,
  } = useLiveProductionBroadcast();

  const { status: streamStatus, isLoading: streamStatusLoading } = useLivStreamStatus();
  const { riskMetrics, riskWarning } = useRiskTelemetry(
    LIV_GOLF_TOUR_MAIN_ROOM,
    currentSession?.active_bet_id,
  );

  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [graphicsError, setGraphicsError] = useState<string | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [terminateInFlight, setTerminateInFlight] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const terminateInFlightRef = useRef(false);

  const vmixStatus = vmix?.connection === "reachable" ? "ONLINE" : "STANDBY";
  const streamLabel = streamStatusLoading
    ? "..."
    : streamStatus?.isLive
      ? "LIVE"
      : streamStatus?.encoderConfigured
        ? "STANDBY"
        : "OFFLINE";

  const loadPresets = useCallback(async () => {
    try {
      const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/graphics/presets`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setPresets([]);
        setActivePresetId(null);
        return;
      }

      if (!response.ok) {
        setGraphicsError("Unable to load production graphics presets.");
        return;
      }

      const data = (await response.json()) as { presets?: OwnerGraphicsPreset[] };
      const loaded = data.presets ?? [];
      setPresets(loaded);
      setActivePresetId(loaded.find((preset) => preset.is_active_on_stream)?.id ?? null);
      setGraphicsError(null);
    } catch {
      setGraphicsError("Unable to load production graphics presets.");
    } finally {
      setPresetsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const toggleGraphicPreset = async (id: string) => {
    setGraphicsError(null);
    const isActive = activePresetId === id;

    const response = await fetch(`${getClientAppUrl()}/api/enterprise/liv-golf/graphics/presets`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActiveOnStream: !isActive }),
    });

    const data = (await response.json()) as { success?: boolean; error?: string };

    if (!response.ok || !data.success) {
      setGraphicsError(data.error ?? "Unable to update stream graphic.");
      return;
    }

    setActivePresetId(!isActive ? id : null);
    await loadPresets();
  };

  const simulationLaunch = useCallback(
    async (betId: string) => {
      setTerminateError(null);
      const ok = await launchMicroBet(betId);
      if (ok) await refresh();
      return ok;
    },
    [launchMicroBet, refresh],
  );

  const simulationLock = useCallback(async () => {
    const ok = await lockMicroBet();
    if (ok) await refresh();
    return ok;
  }, [lockMicroBet, refresh]);

  const simulationResolve = useCallback(async () => {
    const ok = await resolveMicroBetYes();
    if (ok) await refresh();
    return ok;
  }, [resolveMicroBetYes, refresh]);

  const simulationReset = useCallback(async () => {
    const ok = await terminateMicroBet();
    if (ok) await refresh();
    return ok;
  }, [terminateMicroBet, refresh]);

  const handleLaunch = simulationLaunch;

  const handleTerminate = useCallback(async () => {
    if (terminateInFlightRef.current) return;

    terminateInFlightRef.current = true;
    setTerminateInFlight(true);
    setActionMessage(null);
    setTerminateError(null);

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/micro-bets/session`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeBetId: null, phase: "RESOLVED" }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        activeBetId?: string | null;
      };

      if (!response.ok || !payload.success) {
        const message =
          payload.error ??
          (response.status === 401 || response.status === 403
            ? "Owner sign-in required to end bets from the studio console."
            : `Unable to end bet (HTTP ${response.status}).`);
        setTerminateError(message);
        return;
      }

      await refresh();
      setActionMessage("Micro-bet session ended. Fan overlay will clear on the live viewer.");
    } catch (terminateError) {
      const message =
        terminateError instanceof Error ? terminateError.message : "Unable to end bet.";
      setTerminateError(message);
    } finally {
      terminateInFlightRef.current = false;
      setTerminateInFlight(false);
    }
  }, [refresh]);

  const handleResolveYes = async () => {
    const ok = await resolveMicroBetYes();
    if (ok) await refresh();
  };

  const handleLock = async () => {
    const ok = await lockMicroBet();
    if (ok) await refresh();
  };

  const activePhase = currentSession?.phase ?? "OPEN";
  const activeIsShowcase = isShowcaseBetId(currentSession?.active_bet_id);

  const renderBetCard = (
    prop: (typeof LIV_MICRO_BETS)[number] | (typeof LEGENDARY_SHOWCASE_SCENARIOS)[number],
    isShowcase = false,
  ) => {
    const isThisBetActive = currentSession?.active_bet_id === prop.id;
    const anotherBetLive = Boolean(currentSession?.active_bet_id && !isThisBetActive);
    const showcase = isShowcase && "resolutionHint" in prop ? prop : null;

    return (
      <div
        key={prop.id}
        className={`relative flex flex-col justify-between rounded-2xl border bg-black/40 p-4 transition-all duration-300 ${
          isThisBetActive
            ? "border-[#CCFF00] bg-neutral-900/60 shadow-[0_0_20px_rgba(204,255,0,0.1)]"
            : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                isShowcase
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border-neutral-700 bg-neutral-800 text-neutral-300"
              }`}
            >
              {prop.category}
            </span>
            <span className="font-mono text-[10px] font-bold text-neutral-500">ID: {prop.id}</span>
          </div>
          <h3 className="mb-3 text-xs font-bold leading-snug tracking-tight text-white">
            {prop.question}
          </h3>
          {showcase ? (
            <p className="mb-2 text-[10px] leading-relaxed text-neutral-500">
              {showcase.resolutionHint}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-800 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div>
                <span className="block font-sans text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                  Stake
                </span>
                <span className="font-bold text-white">{prop.stake} Token</span>
              </div>
              <div className="border-l border-neutral-800 pl-3">
                <span className="block font-sans text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                  Payout
                </span>
                <span className="font-black text-[#CCFF00]">{prop.payout} Token</span>
              </div>
            </div>

            {isThisBetActive ? (
              <button
                type="button"
                data-testid="studio-end-bet"
                onClick={() => void handleTerminate()}
                disabled={terminateInFlight}
                aria-busy={terminateInFlight}
                className={`flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-rose-500 active:scale-95 ${
                  terminateInFlight
                    ? "cursor-wait opacity-70"
                    : "cursor-pointer opacity-100"
                }`}
              >
                <Square className="h-3 w-3 fill-current" aria-hidden />
                {terminateInFlight ? "Ending..." : "End Bet"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleLaunch(prop.id)}
                disabled={isDispatching || anotherBetLive}
                className="flex items-center gap-1.5 rounded-xl bg-[#CCFF00] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow-md transition-all hover:bg-[#b5e000] active:scale-95 disabled:cursor-not-allowed disabled:opacity-20"
              >
                <Play className="h-3 w-3 fill-current" aria-hidden />
                Launch Live
              </button>
            )}
          </div>

          {isThisBetActive ? (
            <div className="flex flex-wrap items-center gap-2">
              {terminateError ? (
                <p
                  role="alert"
                  className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-200"
                >
                  {terminateError}
                </p>
              ) : null}
              <span className="rounded border border-neutral-700 bg-black/40 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                Phase: {activePhase}
              </span>
              {activePhase === "OPEN" || activePhase === "CLOSING_SOON" ? (
                <button
                  type="button"
                  onClick={() => void handleLock()}
                  disabled={isDispatching}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Lock className="h-3 w-3" aria-hidden />
                  Lock Market
                </button>
              ) : null}
              {activePhase === "LOCKED" || activeIsShowcase ? (
                <button
                  type="button"
                  onClick={() => void handleResolveYes()}
                  disabled={isDispatching || activePhase === "RESOLVED"}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#CCFF00]/40 bg-[#CCFF00]/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] transition hover:bg-[#CCFF00]/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trophy className="h-3 w-3" aria-hidden />
                  Resolve YES
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const graphicsPresets = presets.filter(
    (preset) =>
      preset.type === "LOWER_THIRD" || preset.type === "SLATE" || preset.type === "TICKER",
  );

  return (
    <div className="min-h-screen select-none bg-neutral-950 p-6 font-sans text-white selection:bg-[#CCFF00] selection:text-black">
      {/* SECTION 1: GLOBAL TELEMETRY BAR HEADER */}
      <header className="mb-6 flex w-full flex-col items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-xl md:flex-row">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#CCFF00]/20 bg-[#CCFF00]/10 p-2">
            <Sliders className="h-5 w-5 text-[#CCFF00]" aria-hidden />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-md font-black uppercase tracking-tight">
              LIV Production Control Center
            </h1>
            <p className="text-[10px] font-medium tracking-wide text-neutral-400">
              PostgreSQL session · Supabase realtime · vMix broadcast lane
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
            <Radio
              className={`h-3.5 w-3.5 ${streamStatus?.isLive ? "animate-pulse text-[#CCFF00]" : "text-neutral-500"}`}
              aria-hidden
            />
            <span>
              STREAM:{" "}
              <span className={streamStatus?.isLive ? "text-[#CCFF00]" : "text-amber-500"}>
                {streamLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
            <Tv className="h-3.5 w-3.5 text-[#CCFF00]" aria-hidden />
            <span>
              VMIX:{" "}
              <span className={vmixStatus === "ONLINE" ? "text-[#CCFF00]" : "text-amber-500"}>
                {vmixStatus}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-black/40 px-3 py-1.5 text-[11px] font-bold">
            <Layers className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
            <span>
              DISPATCHER:{" "}
              <span className={isDispatching ? "font-bold text-amber-500" : "text-[#CCFF00]"}>
                {isDispatching ? "SYNCING" : "READY"}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-black/40 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition hover:text-white"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Sync
          </button>
        </div>

        <nav className="flex items-center gap-2 border-neutral-800 md:border-l md:pl-4">
          <Link
            href="/enterprise/liv-golf/streaming/setup"
            className="px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:text-white"
          >
            Stream Setup
          </Link>
          <span className="font-mono text-neutral-700">|</span>
          <Link
            href="/enterprise/liv-golf/live"
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold text-neutral-400 transition-colors hover:text-white"
          >
            <Eye className="h-3 w-3" aria-hidden />
            Fan Viewer
          </Link>
          <span className="font-mono text-neutral-700">|</span>
          <div className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-mono text-[10px] text-neutral-300">
            <ShieldCheck className="h-3 w-3 text-[#CCFF00]" aria-hidden />
            Studio-Operator Session
          </div>
        </nav>
      </header>

      {(error || graphicsError) && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? graphicsError}
        </p>
      )}

      {actionMessage ? (
        <p className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {actionMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* SECTION 2: IN-STREAM MICRO-BETS DISPATCH PANEL */}
        <main className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200">
                In-Stream Micro-Bets Dispatch Hub
              </h2>
              <p className="text-[11px] text-neutral-400">
                Select a catalog prop to open an immediate live fan wagering window.
              </p>
            </div>
            {currentSession?.active_bet_id ? (
              <span className="animate-pulse rounded-md border border-rose-500 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-500">
                PROP LIVE ON STREAM
              </span>
            ) : null}
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading production session state...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  Production Catalog
                </h3>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {LIV_MICRO_BETS.map((prop) => renderBetCard(prop))}
                </div>
              </div>

              <div>
                <h3 className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                  <Trophy className="h-3.5 w-3.5" aria-hidden />
                  Legendary Showcase Moments
                </h3>
                <p className="mb-3 text-[11px] text-neutral-500">
                  Scripted iconic golf scenarios with operator-timed LOCK → Resolve YES choreography.
                </p>
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {LEGENDARY_SHOWCASE_SCENARIOS.map((prop) => renderBetCard(prop, true))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* SECTION 3: SIMULATOR + RISK + GRAPHICS */}
        <aside className="space-y-6">
          <StudioSimulationDeck
            roomId={LIV_GOLF_TOUR_MAIN_ROOM}
            currentSession={currentSession}
            isDispatching={isDispatching}
            onLaunch={simulationLaunch}
            onLock={simulationLock}
            onResolveYes={simulationResolve}
            onReset={simulationReset}
          />

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-neutral-200">
                <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                Live Risk Telemetry
              </h2>
              <span className="rounded border border-neutral-800 bg-black px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-neutral-400">
                PASSTHROUGH
              </span>
            </div>

            {riskWarning ? (
              <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
                <p className="font-black uppercase tracking-wider text-amber-300">
                  Risk Exposure Warning
                </p>
                <p className="mt-1">
                  Asymmetric wagering handle detected across selection targets. Monitor liability
                  before extending the active wagering window.
                </p>
              </div>
            ) : null}

            {riskMetrics ? (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-3 py-2">
                  <span className="text-neutral-500">Wager Handle Split</span>
                  <span className="font-bold text-white">
                    {riskMetrics.yes_ticket_count}Y : {riskMetrics.no_ticket_count}N
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-3 py-2">
                  <span className="text-neutral-500">Gross Exposure Risk</span>
                  <span className="font-bold text-amber-300">
                    {riskMetrics.total_token_risk.toLocaleString()} Tokens
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-black/30 px-3 py-2">
                  <span className="text-neutral-500">Maximum Liability Return</span>
                  <span className="font-bold text-rose-300">
                    {riskMetrics.max_liability_payout.toLocaleString()} Tokens
                  </span>
                </div>
                <p className="text-center text-[10px] text-neutral-500">
                  Last telemetry update:{" "}
                  {new Date(riskMetrics.updated_at).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-neutral-500">
                No active token pool exposures currently recorded on the current session node.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-4 border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-neutral-200">
                Broadcast Graphics Deck
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                Toggle auxiliary stream graphics. Launching a live micro-bet automatically clears
                active lower-thirds to secure overlay spatial priority.
              </p>
            </div>

            {presetsLoading ? (
              <p className="text-sm text-neutral-500">Loading production graphics...</p>
            ) : graphicsPresets.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No LIV graphics presets loaded yet. Presets seed automatically on first studio
                load.
              </p>
            ) : (
              <div className="space-y-2">
                {graphicsPresets.map((preset) => {
                  const isActive = activePresetId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => void toggleGraphicPreset(preset.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? "border-[#CCFF00] bg-neutral-800 text-white shadow-md"
                          : "border-neutral-800 bg-black/20 text-neutral-400 hover:bg-black/40"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isActive ? "animate-ping bg-[#CCFF00]" : "bg-neutral-700"
                          }`}
                        />
                        <span className="truncate">{preset.content_primary}</span>
                      </div>
                      <span className="ml-2 shrink-0 font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                        {preset.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
