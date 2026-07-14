"use client";

import Link from "next/link";
import RestreamEncoderPanel from "@/components/owner/RestreamEncoderPanel";
import { LIV_OPS_CONTENT, LIV_OPS_PAGE } from "@/lib/enterprise/liv-golf/responsive";
import { useLivStreamSetup } from "@/lib/enterprise/liv-golf/useLivStreamSetup";
import LivBroadcastAudioPanel from "./LivBroadcastAudioPanel";
import LivGoLiveControls from "./LivGoLiveControls";
import LivInAppPublisher from "./LivInAppPublisher";
import LivStreamReadinessBanner from "./LivStreamReadinessBanner";

function publishLabel(status: string | undefined, isLive: boolean): string {
  if (isLive) return "LIVE ON PLATFORM";
  if (status === "starting" || status === "preflight") return "INITIALIZING";
  if (status === "error") return "ERROR";
  return "STANDBY";
}

export default function LivStreamSetup() {
  const {
    showTitle,
    setShowTitle,
    eventLocation,
    setEventLocation,
    targetDateTime,
    setTargetDateTime,
    setAirTimeOneHourFromNow,
    encoderFields,
    setEncoderFields,
    encoderLastSavedAt,
    encoderHealth,
    encoderHealthDetail,
    isLive,
    preflight,
    hlsUrl,
    manifestReachable,
    isLoading,
    encoderSaving,
    metadataSaving,
    saveMessage,
    saveError,
    actionMessage,
    saveEncoder,
    saveMetadata,
    applyBroadcastSnapshot,
    refreshPipeline,
    setActionMessage,
    snapshot,
    streamReadiness,
    canAttemptGoLive,
  } = useLivStreamSetup();

  const scheduledAirTimeLabel =
    targetDateTime.trim() ||
    (streamReadiness?.targetDateTime
      ? new Date(streamReadiness.targetDateTime).toLocaleString()
      : null);

  return (
    <div className={LIV_OPS_PAGE}>
      <header className={`${LIV_OPS_CONTENT} mb-6 flex flex-col gap-6 border-b border-white/10 pb-6 sm:mb-8 lg:flex-row lg:items-end lg:justify-between`}>
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="rounded bg-[#CCFF00] px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-black">
              Stream Setup
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              LIV Golf Live Production Pipeline
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Configure ingest → go live → feeds studio, command center, and fan viewer
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <Link href="/enterprise/liv-golf/studio" className="text-[#CCFF00] hover:underline">
              Production Studio →
            </Link>
            <Link href="/enterprise/liv-golf/live" className="text-white/50 hover:text-white">
              Fan Viewer →
            </Link>
            <Link href="/enterprise/liv-golf/command-center" className="text-white/50 hover:text-white">
              Command Center →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono text-left text-xs sm:gap-4 sm:text-right lg:grid-cols-4">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Platform</span>
            <span className={`text-sm font-bold ${isLive ? "text-[#CCFF00]" : "text-zinc-400"}`}>
              {publishLabel(snapshot?.publish.status, isLive)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">HLS Manifest</span>
            <span className={`text-sm font-bold ${manifestReachable ? "text-emerald-400" : "text-amber-300"}`}>
              {manifestReachable ? "REACHABLE" : hlsUrl ? "PENDING" : "UNSET"}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Encoder</span>
            <span className="text-sm font-bold text-white">
              {encoderHealth === "online"
                ? "ONLINE"
                : encoderHealth === "checking"
                  ? "..."
                  : encoderHealth.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Phase</span>
            <span className="text-sm font-bold text-white uppercase">
              {snapshot?.eventPhase.phase ?? "idle"}
            </span>
          </div>
        </div>
      </header>

      {(saveError) && (
        <p className={`${LIV_OPS_CONTENT} mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200`}>
          {saveError}
        </p>
      )}

      {(saveMessage || actionMessage) && (
        <p className={`${LIV_OPS_CONTENT} mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100`}>
          {saveMessage ?? actionMessage}
        </p>
      )}

      <LivStreamReadinessBanner
        className={`${LIV_OPS_CONTENT} mb-6`}
        status={streamReadiness}
        isLoading={isLoading}
      />

      <main className={`${LIV_OPS_CONTENT} grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12`}>
        <section className="lg:col-span-5">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#CCFF00]">
              Event Metadata
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Tournament identity flows to countdown, fan viewer, and command center
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Show Title
                </span>
                <input
                  type="text"
                  value={showTitle}
                  onChange={(event) => setShowTitle(event.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#CCFF00]/50"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Venue / Location
                </span>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                  disabled={isLoading}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#CCFF00]/50"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Target Air Time <span className="font-normal normal-case text-zinc-600">(optional)</span>
                </span>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="datetime-local"
                    value={targetDateTime}
                    onChange={(event) => setTargetDateTime(event.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#CCFF00]/50"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={setAirTimeOneHourFromNow}
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition hover:border-[#CCFF00]/40 disabled:opacity-50"
                  >
                    +1 Hour
                  </button>
                </div>
                <p className="mt-1 text-xs liv-text-secondary">
                  Optional fan countdown anchor. Not required for master go-live.
                </p>
              </label>

              <button
                type="button"
                disabled={isLoading || metadataSaving}
                onClick={() => void saveMetadata()}
                className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                {metadataSaving ? "Saving..." : "Save Event Metadata"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <LivGoLiveControls
              isLoading={isLoading}
              isLive={isLive}
              canAttemptGoLive={canAttemptGoLive}
              preflight={preflight}
              hlsUrl={hlsUrl}
              publishStatus={snapshot?.publish.status}
              publishMode={snapshot?.publish.mode}
              eventPhase={snapshot?.eventPhase.phase}
              scheduledAirTimeLabel={scheduledAirTimeLabel}
              streamReadiness={streamReadiness}
              onSnapshotUpdate={applyBroadcastSnapshot}
              onPipelineRefresh={refreshPipeline}
              onActionSuccess={setActionMessage}
            />
          </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <LivInAppPublisher
            disabled={isLoading}
            platformLive={isLive}
            onBroadcastLive={() => void refreshPipeline()}
            onBroadcastEnded={() => void refreshPipeline()}
          />

          <LivBroadcastAudioPanel disabled={isLoading} />

          <details className="rounded-xl border border-white/10 bg-[#141414] p-4">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Advanced: External RTMP Encoder (optional)
            </summary>
            <div className="mt-4">
              <RestreamEncoderPanel
                fields={encoderFields}
                health={encoderHealth}
                healthDetail={encoderHealthDetail}
                saving={encoderSaving}
                disabled={isLoading}
                saveMessage={saveMessage}
                saveError={saveError}
                lastSavedLabel={
                  encoderLastSavedAt
                    ? `Saved ${new Date(encoderLastSavedAt).toLocaleString()}`
                    : null
                }
                onChange={setEncoderFields}
                onSave={() => void saveEncoder()}
              />
            </div>
          </details>

          <div className="rounded-xl border border-dashed border-[#CCFF00]/25 bg-[#CCFF00]/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#CCFF00]">
              Production Pipeline
            </p>
            <ol className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>1. Start Camera in the in-app LiveKit publisher</li>
              <li>2. Configure tournament audio routing matrix</li>
              <li>3. Click Open to Fans to start HLS egress</li>
              <li>
                4. Open{" "}
                <Link href="/enterprise/liv-golf/studio" className="text-[#CCFF00] hover:underline">
                  Production Studio
                </Link>{" "}
                to launch micro-bets
              </li>
              <li>
                5. Fans watch at{" "}
                <Link href="/enterprise/liv-golf/live" className="text-[#CCFF00] hover:underline">
                  /enterprise/liv-golf/live
                </Link>
              </li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
