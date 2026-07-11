"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import { LIV_MICRO_BETS } from "@/lib/liv-micro-bets";
import { useLivStreamStatus } from "@/lib/enterprise/liv-golf/useLivStreamStatus";
import { useLiveProductionBroadcast } from "@/lib/useLiveProductionBroadcast";
import type { OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";

export default function StudioBetController() {
  const {
    activeBetId,
    vmix,
    isLoading,
    isDispatching,
    error,
    launchMicroBet,
    terminateMicroBet,
    refresh,
  } = useLiveProductionBroadcast();

  const { status: streamStatus, isLoading: streamStatusLoading } = useLivStreamStatus();

  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [graphicsError, setGraphicsError] = useState<string | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(true);

  const loadPresets = useCallback(async () => {
    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/graphics/presets`, {
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

  const toggleGraphic = async (presetId: string) => {
    setGraphicsError(null);
    const isActive = activePresetId === presetId;

    const response = await fetch(`${getClientAppUrl()}/api/owner/graphics/presets`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: presetId, isActiveOnStream: !isActive }),
    });

    const data = (await response.json()) as { success?: boolean; error?: string };

    if (!response.ok || !data.success) {
      setGraphicsError(data.error ?? "Unable to update stream graphic.");
      return;
    }

    setActivePresetId(!isActive ? presetId : null);
    await loadPresets();
  };

  const sponsorPresets = presets.filter((preset) => preset.type === "LOWER_THIRD");
  const commercialPresets = presets.filter(
    (preset) => preset.type === "SLATE" || preset.type === "TICKER",
  );

  return (
    <div className="min-h-dvh w-full bg-[#111111] p-8 font-sans text-white antialiased selection:bg-[#CCFF00] selection:text-black">
      <header className="mx-auto mb-8 flex max-w-6xl flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded bg-[#CCFF00] px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-black">
              Production Studio
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Real-Time In-Stream Micro-Bets Dispatcher
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            PostgreSQL session · Supabase realtime · vMix broadcast lane
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <Link
              href="/enterprise/liv-golf/streaming/setup"
              className="text-[#CCFF00] hover:underline"
            >
              Stream Setup →
            </Link>
            <Link href="/enterprise/liv-golf/live" className="text-white/50 hover:text-white">
              Fan Viewer →
            </Link>
            <Link href="/enterprise/liv-golf/command-center" className="text-white/50 hover:text-white">
              Command Center →
            </Link>
            <Link href="/owner/graphics" className="text-white/50 hover:text-white">
              Graphics Suite →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 font-mono text-right text-xs sm:grid-cols-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Platform Stream</span>
            <span
              className={`text-sm font-bold ${
                streamStatus?.isLive ? "text-[#CCFF00]" : "text-zinc-400"
              }`}
            >
              {streamStatusLoading
                ? "..."
                : streamStatus?.isLive
                  ? "LIVE"
                  : streamStatus?.encoderConfigured
                    ? "STANDBY"
                    : "UNCONFIGURED"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">HLS Manifest</span>
            <span
              className={`text-sm font-bold ${
                streamStatus?.manifestReachable ? "text-emerald-400" : "text-amber-300"
              }`}
            >
              {streamStatusLoading
                ? "..."
                : streamStatus?.manifestReachable
                  ? "READY"
                  : streamStatus?.hlsUrl
                    ? "PENDING"
                    : "—"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">vMix Lane</span>
            <span className="text-sm font-bold text-[#CCFF00]">
              {vmix?.connection === "reachable" ? "ONLINE" : "STANDBY"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Dispatcher</span>
            <span className="text-sm font-bold text-white">
              {isDispatching ? "SYNCING" : "READY"}
            </span>
          </div>
        </div>
      </header>

      {(error || graphicsError) && (
        <p className="mx-auto mb-6 max-w-6xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? graphicsError}
        </p>
      )}

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          <div className="border-b border-white/5 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#CCFF00]">
              In-Stream Micro-Bets Hub
            </h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading production session state...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {LIV_MICRO_BETS.map((bet) => {
                const isActive = activeBetId === bet.id;

                return (
                  <div
                    key={bet.id}
                    className={`rounded-xl border p-5 transition-all duration-200 ${
                      isActive
                        ? "border-[#CCFF00] bg-[#CCFF00]/5 shadow-[0_0_18px_rgba(204,255,0,0.08)]"
                        : "border-white/5 bg-[#141414] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold tracking-wide text-zinc-100">
                          {bet.question}
                        </h3>
                        <div className="mt-2 flex gap-3 font-mono text-[11px] text-zinc-500">
                          <span>Stake: {bet.stake} Tokens</span>
                          <span>•</span>
                          <span className={isActive ? "text-[#CCFF00]" : ""}>
                            Payout: {bet.payout} Tokens
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isDispatching}
                        onClick={() =>
                          void (isActive ? terminateMicroBet() : launchMicroBet(bet.id)).then(
                            (ok) => {
                              if (ok) void refresh();
                            },
                          )
                        }
                        className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
                          isActive
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-[#CCFF00] text-black hover:bg-[#bce600]"
                        }`}
                      >
                        {isActive ? "End Bet" : "Launch Live"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6 lg:col-span-5">
          <div className="space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                Sponsor Lower-Third Deck
              </h2>
            </div>
            {presetsLoading ? (
              <p className="text-sm text-zinc-500">Loading production graphics...</p>
            ) : sponsorPresets.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No lower-third presets found. Create sponsor graphics in{" "}
                <Link href="/owner/graphics" className="text-[#CCFF00] hover:underline">
                  Graphics Suite
                </Link>
                .
              </p>
            ) : (
              sponsorPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => void toggleGraphic(preset.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-bold tracking-wide transition-all ${
                    activePresetId === preset.id
                      ? "border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00]"
                      : "border-white/5 bg-[#141414] text-zinc-300 hover:border-white/10"
                  }`}
                >
                  <span>{preset.content_primary}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activePresetId === preset.id ? "liv-live-dot bg-[#CCFF00]" : "bg-zinc-600"
                    }`}
                  />
                </button>
              ))
            )}
          </div>

          <div className="space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                Commercial Break System
              </h2>
            </div>
            {presetsLoading ? (
              <p className="text-sm text-zinc-500">Loading commercial presets...</p>
            ) : commercialPresets.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No slate/ticker presets found. Add a commercial slate in Graphics Suite.
              </p>
            ) : (
              commercialPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => void toggleGraphic(preset.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-bold tracking-wide transition-all ${
                    activePresetId === preset.id
                      ? "border-red-500 bg-red-500/10 text-red-400"
                      : "border-white/5 bg-[#141414] text-zinc-300 hover:border-white/10"
                  }`}
                >
                  <span>{preset.content_primary}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activePresetId === preset.id ? "liv-live-dot bg-red-500" : "bg-zinc-600"
                    }`}
                  />
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
