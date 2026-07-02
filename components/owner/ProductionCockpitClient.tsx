"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  Lock,
  MonitorDot,
  Play,
  Radio,
  RefreshCw,
  Square,
  Timer,
  XCircle,
} from "lucide-react";
import {
  decodeGraphicsPresetMetadata,
  formatGraphicsTypeLabel,
  type OwnerGraphicsPreset,
  OWNER_GRAPHICS_EVENT_ID,
} from "@/lib/owner/graphics-data-plane";
import {
  AUDIO_SILENCE_FLOOR_DB,
  COCKPIT_AUDIO_TRACK_SPECS,
  type AudioLevelTrack,
  type CockpitAudioTrackId,
  type OwnerAudioTelemetry,
} from "@/lib/owner/audio-contracts";
import type {
  ActiveFeedSource,
  EventPhase,
  OwnerBroadcastSnapshot,
  PublishStatus,
} from "@/lib/owner/contracts";
import { defaultEventPhaseState } from "@/lib/owner/map-event-phase";
import {
  DEFAULT_SCHEDULE_TIMEZONE,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import {
  BROADCAST_HARDWARE_DEFAULTS,
  formatBroadcastAudioDefaultLabel,
  formatBroadcastVideoDefaultLabel,
} from "@/lib/owner/preflight";
import { getSupabase } from "@/lib/supabase/client";
import GoLiveMasterOverrideDialog, {
  type GoLiveFeedback,
} from "@/components/owner/GoLiveMasterOverrideDialog";
import OwnerProductionSideMenu from "@/components/owner/OwnerProductionSideMenu";
import ProgramReturnPanel from "@/components/owner/ProgramReturnPanel";
import RestreamEncoderPanel, {
  type RestreamEncoderFields,
} from "@/components/owner/RestreamEncoderPanel";
import type { EncoderHealthStatus } from "@/lib/owner/encoder-health";

type ApiPresetResponse = {
  success: boolean;
  presets?: OwnerGraphicsPreset[];
  preset?: OwnerGraphicsPreset;
  clearedCount?: number;
  error?: string;
  message?: string;
};

type RuntimeTimer = {
  startedAt: number;
  durationSeconds: number;
};

type BroadcastResponse = {
  blocked?: boolean;
  ok?: boolean;
  message?: string;
  error?: string;
  snapshot?: OwnerBroadcastSnapshot;
};

type DestinationKey = "youtube" | "facebook" | "twitch";

type BroadcastAction = "idle" | "master-go-live" | "stop";

type RestreamDestinations = Record<DestinationKey, boolean>;

type ShowSetupStatePayload = {
  showTitle?: string;
  presenterName?: string;
  targetDateTime?: string;
  scheduleTimezone?: ScheduleTimezone;
  primaryIngestEndpoint?: string;
  streamKey?: string;
  attendeePlaybackHlsUrl?: string;
  restreamDestinations?: Partial<RestreamDestinations>;
};

type ShowSetupResponse = {
  ok?: boolean;
  state?: ShowSetupStatePayload;
  message?: string;
  error?: string;
};

type EncoderHealthResponse = {
  ok?: boolean;
  status?: EncoderHealthStatus;
  label?: string;
  detail?: string | null;
  error?: string;
};

const EMPTY_ENCODER_FIELDS: RestreamEncoderFields = {
  primaryIngestEndpoint: "",
  streamKey: "",
  attendeePlaybackHlsUrl: "",
};

function parseOwnerApiError(
  response: Response,
  json: { error?: string; message?: string },
  fallback: string,
): string {
  if (response.status === 401) {
    return "Sign in required. Use team login (/email-gate/team) before saving.";
  }
  if (response.status === 403) {
    return "Owner access denied. Sign in with an email listed in ADMIN_EMAILS.";
  }
  return json.error || json.message || fallback;
}

async function readOwnerApiJson<T>(response: Response, routeLabel: string): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new Error(
        `${routeLabel} returned 404 HTML. Restart dev server (npm run dev) — API route not loaded.`,
      );
    }
    throw new Error(
      `${routeLabel} returned non-JSON (HTTP ${response.status}). Restart dev server and try again.`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`${routeLabel} returned invalid JSON (HTTP ${response.status}).`);
  }
}

function buildGoLiveFeedback(
  snapshot: OwnerBroadcastSnapshot | undefined,
  apiMessage: string,
  apiOk = false,
): GoLiveFeedback {
  const isPublishing = snapshot?.publish.status === "publishing";

  if (!isPublishing && !apiOk) {
    return {
      kind: "error",
      message: "Go Live failed.",
      detail:
        snapshot?.publish.errorMessage ??
        apiMessage ??
        "Stream engine did not reach publishing state.",
    };
  }

  if (!isPublishing && apiOk) {
    return {
      kind: "success",
      message: "Go Live command accepted.",
      detail:
        apiMessage ||
        "Stream state is syncing — STOP STREAMING should enable in a moment.",
    };
  }

  const hlsUrl = snapshot!.feed.primary.hlsUrl ?? snapshot!.playback.hlsUrl;
  const manifestReady =
    snapshot!.feed.primary.manifestReachable || snapshot!.playback.manifestReachable;

  let detail: string;
  if (!hlsUrl) {
    detail = "Platform is live but no HLS URL is configured. Save one in the encoder panel.";
  } else if (!manifestReady) {
    detail =
      apiMessage ||
      "Platform is live. Start your encoder — the HLS manifest is not reachable yet.";
  } else {
    detail = "Attendees on /live should receive playback.";
  }

  return {
    kind: "success",
    message: "Go Live succeeded. Broadcast is on air for attendees.",
    detail,
  };
}

type AudioMixStateResponse = {
  ok?: boolean;
  success?: boolean;
  telemetry?: OwnerAudioTelemetry;
  error?: string;
};

const DEFAULT_RESTREAM_DESTINATIONS: RestreamDestinations = {
  youtube: true,
  facebook: true,
  twitch: true,
};

const BROADCAST_SNAPSHOT_POLL_MS = 4_000;

const EMPTY_BROADCAST_SNAPSHOT: OwnerBroadcastSnapshot = {
  capturedAt: "",
  eventPhase: defaultEventPhaseState(),
  publish: { mode: "none", status: "offline", errorMessage: null },
  playback: {
    status: "unconfigured",
    hlsUrl: null,
    manifestReachable: false,
    errorMessage: null,
  },
  feed: {
    activeSource: "offline",
    primary: { hlsUrl: null, manifestReachable: false, detail: null },
    backup: { hlsUrl: null, manifestReachable: false, detail: null },
  },
  preflight: [],
  publisherSessionId: null,
  publisherChannel: null,
  vmix: null,
};

function streamEngineLabel(status: PublishStatus): string {
  if (status === "publishing") return "STREAM ENGINE: ACTIVE (PUBLISHING)";
  if (status === "offline") return "STREAM COMMANDS READY (OFFLINE)";
  if (status === "starting" || status === "preflight") return "STREAM ENGINE: INITIALIZING";
  if (status === "error") return "STREAM ENGINE: ERROR";
  return "STREAM ENGINE: STANDBY";
}

function sourceLaneLabel(source: ActiveFeedSource): string {
  if (source === "primary") return "SOURCE: RESTREAM HLS";
  return "SOURCE: STANDBY";
}

function publishBadgeTone(status: PublishStatus): string {
  if (status === "publishing") return "border-lime-300/35 bg-lime-300/10 text-lime-300";
  if (status === "error") return "border-red-400/35 bg-red-400/10 text-red-400";
  if (status === "starting" || status === "preflight" || status === "ending") {
    return "border-amber-300/35 bg-amber-300/10 text-amber-300";
  }
  return "border-white/10 bg-white/5 text-white/45";
}

function sourceBadgeTone(source: ActiveFeedSource): string {
  if (source === "primary") return "border-lime-300/35 bg-lime-300/10 text-lime-300";
  return "border-white/10 bg-white/5 text-white/45";
}

function eventPhaseBadgeTone(phase: EventPhase): string {
  if (phase === "live") return "border-lime-300/35 bg-lime-300/10 text-lime-300";
  if (phase === "preshow") return "border-amber-300/35 bg-amber-300/10 text-amber-300";
  if (phase === "scheduled") return "border-[#00a8ff]/35 bg-[#00a8ff]/10 text-[#00a8ff]";
  if (phase === "ended") return "border-white/10 bg-white/5 text-white/45";
  return "border-purple-500/40 bg-purple-500/10 text-purple-400";
}

function formatEventPhaseHeader(phase: EventPhase): string {
  return `Event Phase: ${phase.replace(/_/g, " ")}`;
}

const DB_STEPS = [0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60, -72, -90];
const METER_SEGMENT_COUNT = 20;
const METER_VISUAL_FLOOR_DB = -60;

function meterActiveSegments(levelDb: number, offline: boolean): number {
  if (offline || levelDb <= METER_VISUAL_FLOOR_DB) return 0;
  return Math.max(
    0,
    Math.min(METER_SEGMENT_COUNT, Math.round(((60 + levelDb) / 60) * METER_SEGMENT_COUNT)),
  );
}

function formatMeterDbLabel(levelDb: number, offline: boolean): string {
  if (offline) return "--- dB";
  return `${levelDb.toFixed(1)} dB`;
}

function resolveCockpitAudioTrack(
  tracks: AudioLevelTrack[] | undefined,
  trackId: CockpitAudioTrackId,
): AudioLevelTrack {
  const found = tracks?.find((track) => track.id === trackId);
  if (found) return found;

  const spec = COCKPIT_AUDIO_TRACK_SPECS.find((entry) => entry.id === trackId);
  return {
    id: trackId,
    label: spec?.label ?? trackId,
    levelDb: AUDIO_SILENCE_FLOOR_DB,
    peakDb: AUDIO_SILENCE_FLOOR_DB,
  };
}

function sortPresets(presets: OwnerGraphicsPreset[]) {
  return [...presets].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function mergePreset(current: OwnerGraphicsPreset[], nextPreset: OwnerGraphicsPreset) {
  const exists = current.some((preset) => preset.id === nextPreset.id);
  if (!exists) return sortPresets([nextPreset, ...current]);
  return sortPresets(current.map((preset) => (preset.id === nextPreset.id ? nextPreset : preset)));
}

function removePreset(current: OwnerGraphicsPreset[], id: string) {
  return current.filter((preset) => preset.id !== id);
}

function formatCockpitEventDate(targetIso: string | null, timeZone: ScheduleTimezone) {
  if (!targetIso) return "Countdown schedule not loaded";
  const date = new Date(targetIso);
  if (Number.isNaN(date.getTime())) return "Countdown schedule unavailable";

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getTypeAccent(type: OwnerGraphicsPreset["type"]) {
  if (type === "SCRIPTURE") return "border-amber-300/50 text-amber-200";
  if (type === "OFFERING") return "border-lime-300/50 text-lime-200";
  if (type === "TICKER") return "border-orange-300/50 text-orange-200";
  if (type === "SLATE") return "border-violet-300/50 text-violet-200";
  return "border-sky-300/50 text-sky-200";
}

function CockpitPanel({
  title,
  titleAction,
  children,
  className = "",
}: {
  title?: string;
  titleAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-h-0 overflow-hidden rounded-[6px] border border-white/10 bg-[#050814]/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_28px_rgba(0,168,255,0.08)] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
          <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/72 sm:text-[0.64rem]">
            {title}
          </span>
          {titleAction}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function MeterRail({
  label,
  levelDb,
  offline,
  trackId,
}: {
  label: string;
  levelDb: number;
  offline: boolean;
  trackId: string;
}) {
  const activeSegments = meterActiveSegments(levelDb, offline);
  const readoutTone = offline ? "text-white/35" : "text-lime-300";

  return (
    <div className="flex min-w-0 flex-col items-center">
      <p className="mb-1 line-clamp-2 min-h-[1.6rem] text-center font-ui text-[0.46rem] font-bold uppercase leading-tight text-white/70 sm:text-[0.5rem]">
        {label}
      </p>
      <div className="grid w-full grid-cols-[0.85rem_1fr] items-end gap-1">
        <div className="flex h-20 flex-col justify-between font-ui text-[0.34rem] leading-none text-white/40 sm:h-24 sm:text-[0.38rem]">
          {DB_STEPS.map((step) => (
            <span key={`${trackId}-${step}`}>{step}</span>
          ))}
        </div>
        <div className="flex min-w-0 flex-col items-center">
          <div className="flex h-20 w-6 flex-col-reverse gap-0.5 rounded-sm border border-white/10 bg-black/55 p-0.5 sm:h-24 sm:w-7">
            {Array.from({ length: METER_SEGMENT_COUNT }).map((_, index) => {
              const isHot = index >= 17;
              const isWarn = index >= 13 && index < 17;
              const isActive = index < activeSegments;
              return (
                <span
                  key={`${trackId}-segment-${index}`}
                  className={`min-h-0 flex-1 rounded-[1px] ${
                    isActive
                      ? isHot
                        ? "bg-red-500"
                        : isWarn
                          ? "bg-yellow-300"
                          : "bg-emerald-400"
                      : "bg-white/8"
                  }`}
                />
              );
            })}
          </div>
          <p className={`mt-1.5 text-center font-ui text-[0.58rem] font-black sm:text-[0.62rem] ${readoutTone}`}>
            {formatMeterDbLabel(levelDb, offline)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AudioMonitorPanel({
  telemetry,
  loading,
  error,
  onRefresh,
}: {
  telemetry: OwnerAudioTelemetry | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const status = telemetry?.mediaNodeStatus ?? "offline";
  const offline = status === "offline" || Boolean(error);
  const connected = !error && status === "online";
  const degraded = !error && status === "degraded";
  const cockpitTracks = COCKPIT_AUDIO_TRACK_SPECS.map((spec) =>
    resolveCockpitAudioTrack(telemetry?.tracks, spec.id),
  );
  const statusLabel = loading
    ? "X32 SYNCING"
    : connected
      ? "X32 CONNECTED (AUTOMATIC)"
      : degraded
        ? "X32 DEGRADED"
        : "X32 OFFLINE";
  const statusTone = loading
    ? "text-sky-300"
    : connected
      ? "text-lime-300"
      : degraded
        ? "text-amber-300"
        : "text-red-300";
  const statusDot = loading
    ? "bg-sky-300"
    : connected
      ? "bg-lime-400"
      : degraded
        ? "bg-amber-300"
        : "bg-red-400";

  return (
    <CockpitPanel title="AUDIO MONITOR (X32)" className="flex flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex min-w-0 items-center gap-1.5 truncate font-ui text-[0.5rem] font-black uppercase sm:text-[0.58rem] ${statusTone}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot} ${connected ? "shadow-[0_0_12px_rgba(132,255,75,0.8)]" : ""}`} />
            {statusLabel}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="grid h-6 w-6 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-white/70 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Refresh audio telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-2 flex-1 rounded-md border border-white/10 bg-black/35 p-2">
          <div className="mb-2 flex items-center gap-1.5 font-ui text-[0.54rem] font-bold uppercase text-white/70 sm:text-[0.6rem]">
            <Lock className="h-3.5 w-3.5 text-purple-400" />
            X32 LIVE BUS MATRIX (5 CH)
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {cockpitTracks.map((track) => (
              <MeterRail
                key={track.id}
                trackId={track.id}
                label={track.label}
                levelDb={track.levelDb}
                offline={offline}
              />
            ))}
          </div>
          <p className="mt-2 truncate text-center font-body text-[0.5rem] text-white/45">
            {error || telemetry?.mediaNodeDetail || "Waiting for audio telemetry."}
          </p>
        </div>

        <div className="mt-2 rounded-md border border-lime-300/20 bg-lime-300/8 px-2 py-1.5 text-center font-ui text-[0.48rem] font-black uppercase leading-tight text-lime-300 sm:text-[0.54rem]">
          MONITOR MIX & HOUSE
          <br />
          CONTROLS LOCKED
        </div>
      </div>
    </CockpitPanel>
  );
}

function graphicBuilderLabel(preset: OwnerGraphicsPreset) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  return metadata.builderKind === "SANCTUARY_VIDEO" ? "Sanctuary Video" : formatGraphicsTypeLabel(preset.type);
}

function StreamMatrixPanel({
  broadcastAction,
  isGoLiveModalOpen,
  isOwnerReady,
  broadcastMessage,
  broadcastError,
  goLiveFeedback,
  broadcastSnapshot,
  destinations,
  destinationsLoading,
  destinationSaving,
  ownerAuthorized,
  onRequestGoLive,
  onStop,
  onDestinationChange,
}: {
  broadcastAction: BroadcastAction;
  isGoLiveModalOpen: boolean;
  isOwnerReady: boolean;
  broadcastMessage: string | null;
  broadcastError: string | null;
  goLiveFeedback: GoLiveFeedback | null;
  broadcastSnapshot: OwnerBroadcastSnapshot;
  destinations: RestreamDestinations;
  destinationsLoading: boolean;
  destinationSaving: DestinationKey | null;
  ownerAuthorized: boolean | null;
  onRequestGoLive: () => void;
  onStop: () => void;
  onDestinationChange: (destination: DestinationKey, enabled: boolean) => void;
}) {
  const isBroadcastBusy = broadcastAction !== "idle";
  const isConfirmingGoLive = broadcastAction === "master-go-live";
  const isStopping = broadcastAction === "stop";
  const isLive = broadcastSnapshot.publish.status === "publishing";
  const destinationRows: Array<{ key: DestinationKey | "instagram"; name: string; on: boolean; disabled?: boolean }> = [
    { key: "youtube", name: "YouTube", on: destinations.youtube },
    { key: "facebook", name: "Facebook", on: destinations.facebook },
    { key: "twitch", name: "Twitch", on: destinations.twitch },
    { key: "instagram", name: "Instagram", on: true, disabled: true },
  ];

  const telemetryLine = [
    streamEngineLabel(broadcastSnapshot.publish.status),
    sourceLaneLabel(broadcastSnapshot.feed.activeSource),
  ].join(" · ");

  return (
    <div className="relative z-50 pointer-events-auto isolate grid min-h-0 gap-2 sm:grid-cols-[0.48fr_0.52fr]">
      <CockpitPanel title="STREAM STATUS" className="p-2">
        <div className="grid h-full grid-rows-[1fr_auto] gap-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              data-testid="go-live-button"
              data-loading={isConfirmingGoLive || undefined}
              disabled={!isOwnerReady || isBroadcastBusy || isGoLiveModalOpen}
              aria-busy={isConfirmingGoLive || undefined}
              onClick={onRequestGoLive}
              className="relative z-50 pointer-events-auto flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-md bg-gradient-to-br from-lime-400 to-green-700 px-3 font-ui text-xl font-black uppercase text-black shadow-[0_0_22px_rgba(85,255,75,0.28)] transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-45 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-45 xl:min-h-20 xl:text-2xl"
            >
              {isConfirmingGoLive ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Initializing signal</span>
                  INITIALIZING SIGNAL...
                </>
              ) : (
                <>
                  <Play className="h-7 w-7 fill-black" aria-hidden="true" />
                  GO LIVE
                </>
              )}
            </button>
            <p className="text-center font-ui text-[0.44rem] uppercase tracking-[0.08em] text-white/40">
              Master override — confirms before forcing live
            </p>
            {goLiveFeedback ? (
              <div
                data-testid="go-live-status-banner"
                role="status"
                aria-live="polite"
                className={`rounded-md border px-3 py-2 ${
                  goLiveFeedback.kind === "success"
                    ? "border-lime-300/35 bg-lime-300/10"
                    : "border-red-400/35 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  {goLiveFeedback.kind === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`font-ui text-[0.58rem] font-black uppercase tracking-[0.06em] ${
                        goLiveFeedback.kind === "success" ? "text-lime-200" : "text-red-200"
                      }`}
                    >
                      {goLiveFeedback.kind === "success" ? "Go Live Active" : "Go Live Failed"}
                    </p>
                    <p className="mt-1 font-body text-[0.62rem] leading-snug text-white/82">
                      {goLiveFeedback.message}
                    </p>
                    {goLiveFeedback.detail ? (
                      <p className="mt-1 font-body text-[0.55rem] leading-snug text-white/55">
                        {goLiveFeedback.detail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            {ownerAuthorized === false ? (
              <span className="mt-2 block font-body text-xs text-red-400">
                Error: Current session email is not authorized in ADMIN_EMAILS configuration.
              </span>
            ) : null}
            <button
              type="button"
              data-testid="stop-streaming-button"
              data-loading={isStopping || undefined}
              disabled={!isLive || isBroadcastBusy}
              aria-busy={isStopping || undefined}
              onClick={onStop}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-[#08101f] px-3 font-ui text-[0.62rem] font-bold uppercase text-white/78 transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-45 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-45 xl:min-h-14 xl:text-xs"
            >
              {isStopping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Stopping stream</span>
                </>
              ) : (
                <Square className="h-4 w-4" aria-hidden="true" />
              )}
              STOP STREAMING
            </button>
          </div>
          <div className="grid gap-1.5">
            <div
              className="flex items-start gap-1.5 rounded-md border border-[#00a8ff]/25 bg-[#00a8ff]/8 px-2 py-1.5"
              title="Locked encoder contract"
            >
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#00a8ff]/70" aria-hidden />
              <div className="min-w-0">
                <p className="font-ui text-[0.48rem] font-black uppercase tracking-[0.1em] text-[#00a8ff]/85">
                  Video · Locked
                </p>
                <p className="font-body text-[0.52rem] leading-snug text-white/78">
                  {formatBroadcastVideoDefaultLabel()}
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-1.5 rounded-md border border-[#8a2eff]/25 bg-[#8a2eff]/8 px-2 py-1.5"
              title="Locked encoder contract"
            >
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#8a2eff]/70" aria-hidden />
              <div className="min-w-0">
                <p className="font-ui text-[0.48rem] font-black uppercase tracking-[0.1em] text-[#8a2eff]/85">
                  Audio · Locked · {BROADCAST_HARDWARE_DEFAULTS.audio.targetLoudnessLufs} LUFS
                </p>
                <p className="font-body text-[0.52rem] leading-snug text-white/78">
                  {formatBroadcastAudioDefaultLabel()}
                </p>
              </div>
            </div>
          </div>
          <div className="min-h-7 rounded-md border border-white/10 bg-black/25 px-2 py-1.5 font-body text-[0.58rem] text-white/65">
            <span className={broadcastError ? "text-red-200" : broadcastMessage ? "text-lime-200/90" : undefined}>
              {broadcastError ?? broadcastMessage ?? telemetryLine ?? "Stream commands ready."}
            </span>
          </div>
        </div>
      </CockpitPanel>

      <CockpitPanel title="DESTINATIONS (RESTREAM)" className="p-2">
        <div className="space-y-1.5">
          {destinationRows.map((destination) => (
            <div key={destination.name} className="flex items-center justify-between rounded-md border border-white/8 bg-black/24 px-2 py-1.5">
              <span className="font-body text-[0.68rem] font-semibold text-white/82 xl:text-xs">{destination.name}</span>
              {destination.disabled || destination.key === "instagram" ? (
                <span className="rounded bg-lime-400 px-2 py-1 font-ui text-[0.55rem] font-black uppercase text-black">
                  [ ON ]
                </span>
              ) : (
                <button
                  type="button"
                  disabled={destinationsLoading || destinationSaving === destination.key}
                  onClick={() => onDestinationChange(destination.key as DestinationKey, !destination.on)}
                  aria-pressed={destination.on}
                  className={`rounded px-2 py-1 font-ui text-[0.55rem] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-55 ${
                    destination.on ? "bg-lime-400 text-black" : "bg-slate-600 text-white/75"
                  }`}
                >
                  {destinationSaving === destination.key ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    `[ ${destination.on ? "ON" : "OFF"} ]`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-body text-[0.68rem] text-white/78">
          Concurrent Viewers:
          <span className="ml-2 font-ui font-black text-white">1,246</span>
        </div>
      </CockpitPanel>
    </div>
  );
}

function GraphicThumbnail({ preset }: { preset: OwnerGraphicsPreset }) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  const isTicker = preset.type === "TICKER";
  const isSlate = preset.type === "SLATE";
  const isSanctuaryVideo = metadata.builderKind === "SANCTUARY_VIDEO";

  return (
    <div
      className={`relative h-full min-h-10 overflow-hidden rounded border border-white/10 bg-black ${
        isTicker ? "bg-gradient-to-r from-orange-950 via-black to-orange-900" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(138,46,255,0.42),transparent_42%),linear-gradient(180deg,#100c35_0%,#05050a_100%)]" />
      {isSanctuaryVideo ? (
        metadata.mediaUrl ? (
          <video src={metadata.mediaUrl} className="absolute inset-0 h-full w-full object-cover opacity-85" muted playsInline />
        ) : (
          <div className="absolute inset-1 grid place-items-center rounded bg-cyan-950 text-center font-ui text-[0.42rem] font-black uppercase leading-none text-cyan-100">
            VIDEO
          </div>
        )
      ) : isSlate ? (
        <div className="absolute inset-1 grid place-items-center rounded bg-[#100d2e] text-center font-ui text-[0.42rem] font-black uppercase leading-none text-white">
          STARTING SOON
        </div>
      ) : isTicker ? (
        <div className="absolute inset-x-1 bottom-1 h-2 rounded-sm bg-orange-500/80" />
      ) : (
        <div className="absolute inset-x-1 bottom-1 h-3 skew-x-[-18deg] border-l-2 border-[#00a8ff] border-r-2 border-[#ff2faf] bg-black/80" />
      )}
      <span className="absolute left-1 top-1 max-w-[86%] truncate font-ui text-[0.38rem] font-black uppercase text-white">
        {preset.content_primary}
      </span>
      {metadata.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={metadata.imageUrl} alt="" className="absolute right-1 top-1 max-h-4 max-w-[38%] object-contain" />
      ) : null}
    </div>
  );
}

type QuickGraphicsSwitch = {
  id: string;
  label: string;
  hint: string;
  preset: OwnerGraphicsPreset | null;
};

function isFullscreenPreset(preset: OwnerGraphicsPreset) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  return metadata.positionAnchor === "FULLSCREEN" || metadata.layoutMode === "fullscreen";
}

function isVideoPreset(preset: OwnerGraphicsPreset) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  return metadata.builderKind === "SANCTUARY_VIDEO" || metadata.layoutMode === "sanctuary_video";
}

function buildQuickGraphicsSwitches(presets: OwnerGraphicsPreset[]): QuickGraphicsSwitch[] {
  return [
    {
      id: "fullscreen",
      label: "Full Screen",
      hint: "Latest slate or full-screen graphic",
      preset: presets.find((preset) => !isVideoPreset(preset) && isFullscreenPreset(preset)) ?? null,
    },
    {
      id: "video",
      label: "Video",
      hint: "Sanctuary / roll-in playback",
      preset: presets.find((preset) => isVideoPreset(preset)) ?? null,
    },
    {
      id: "lower-third",
      label: "Lower Third",
      hint: "Speaker ID overlay",
      preset: presets.find((preset) => preset.type === "LOWER_THIRD") ?? null,
    },
    {
      id: "offering",
      label: "Offering",
      hint: "Giving prompt",
      preset: presets.find((preset) => preset.type === "OFFERING") ?? null,
    },
    {
      id: "ticker",
      label: "Ticker",
      hint: "Bottom crawl",
      preset: presets.find((preset) => preset.type === "TICKER") ?? null,
    },
  ];
}

function QuickGraphicsSwitchBank({
  switches,
  mutatingId,
  clearing,
  onToggle,
}: {
  switches: QuickGraphicsSwitch[];
  mutatingId: string | null;
  clearing: boolean;
  onToggle: (preset: OwnerGraphicsPreset, nextActive: boolean) => void;
}) {
  return (
    <div className="border-b border-white/10 bg-[#03101d]/95 p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="font-ui text-[0.56rem] font-black uppercase tracking-[0.1em] text-cyan-100">
          Quick Switches
        </p>
        <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-white/45">
          one-tap output
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
        {switches.map((item) => {
          const preset = item.preset;
          const isLive = Boolean(preset?.is_active_on_stream);
          const isMutating = Boolean(preset && mutatingId === preset.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={!preset || clearing || isMutating}
              aria-pressed={isLive}
              onClick={() => {
                if (preset) onToggle(preset, !isLive);
              }}
              className={`min-h-16 rounded-md border px-2 py-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                isLive
                  ? "border-emerald-300 bg-emerald-300/16 shadow-[0_0_16px_rgba(16,185,129,0.24)]"
                  : "border-[#00a8ff]/35 bg-[#00a8ff]/8 hover:border-[#00a8ff]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-ui text-[0.62rem] font-black uppercase tracking-[0.08em] text-white">
                  {item.label}
                </span>
                {isMutating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-100" />
                ) : (
                  <span
                    className={`rounded px-1.5 py-0.5 font-ui text-[0.46rem] font-black uppercase ${
                      isLive ? "bg-emerald-300 text-black" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {isLive ? "ON" : "OFF"}
                  </span>
                )}
              </span>
              <span className="mt-1 block truncate font-body text-[0.56rem] text-white/55">
                {preset ? preset.content_primary : item.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GraphicsRow({
  preset,
  index,
  timer,
  now,
  mutating,
  clearing,
  onToggle,
}: {
  preset: OwnerGraphicsPreset;
  index: number;
  timer: RuntimeTimer | undefined;
  now: number;
  mutating: boolean;
  clearing: boolean;
  onToggle: (preset: OwnerGraphicsPreset, nextActive: boolean) => void;
}) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  const isLive = preset.is_active_on_stream;
  const duration = preset.duration_seconds ?? 0;
  const hasDurationTimer = duration > 0;
  const elapsedSeconds = timer ? (now - timer.startedAt) / 1000 : 0;
  const remainingSeconds = timer ? Math.max(0, timer.durationSeconds - elapsedSeconds) : duration;
  const progress = timer && timer.durationSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / timer.durationSeconds) * 100)) : isLive ? 100 : 0;

  return (
    <article
      className={`relative grid min-h-[3.4rem] grid-cols-[2rem_3.8rem_minmax(0,1fr)_5.8rem] gap-1.5 overflow-hidden rounded-md border bg-black/32 p-1.5 sm:grid-cols-[2rem_4.4rem_minmax(0,1fr)_6rem] ${
        isLive ? "border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.28)]" : "border-white/10"
      }`}
    >
      <div className="grid place-items-center rounded bg-[#060b18] font-ui text-[0.58rem] font-black text-white/72">
        {(index + 1).toString().padStart(3, "0")}
      </div>
      <GraphicThumbnail preset={preset} />
      <div className="min-w-0 rounded border border-white/8 bg-[#050814] px-2 py-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`inline-flex rounded border px-1.5 py-0.5 font-ui text-[0.5rem] font-black uppercase ${getTypeAccent(preset.type)}`}>
            {graphicBuilderLabel(preset)}
          </span>
          {isLive ? (
            <span className="inline-flex animate-pulse rounded border border-emerald-300/70 bg-emerald-300/15 px-1.5 py-0.5 font-ui text-[0.48rem] font-black uppercase text-emerald-200">
              LIVE ON STREAM
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate font-ui text-[0.62rem] font-black uppercase text-white">
          {preset.content_primary}
        </p>
        <p className="truncate font-body text-[0.62rem] text-white/55">
          {metadata.mediaUrl || metadata.imageUrl || metadata.secondaryText || "No secondary copy"}
        </p>
      </div>
      <button
        type="button"
        disabled={mutating || clearing}
        onClick={() => onToggle(preset, !isLive)}
        className={`rounded-md px-1.5 py-1 font-ui text-[0.48rem] font-black uppercase leading-tight transition disabled:cursor-not-allowed disabled:opacity-45 ${
          isLive
            ? "border border-red-300/70 bg-red-700 text-white shadow-[0_0_14px_rgba(220,38,38,0.35)] hover:bg-red-600"
            : "border border-[#00a8ff]/60 bg-[#00a8ff] text-black shadow-[0_0_14px_rgba(0,168,255,0.28)] hover:bg-white"
        }`}
      >
        {mutating ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
        ) : isLive ? (
          <>
            REMOVE FROM STREAM
            <span className="block text-[0.48rem] opacity-75">
              {hasDurationTimer ? formatDuration(Math.ceil(remainingSeconds)) : "MANUAL"}
            </span>
          </>
        ) : (
          <>
            DISPLAY NOW
            <span className="block text-[0.48rem] opacity-75">
              {hasDurationTimer ? formatDuration(duration) : "MANUAL"}
            </span>
          </>
        )}
      </button>
      {isLive ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div className="h-full bg-lime-300 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </article>
  );
}

function GraphicsDeckPanel({
  presets,
  loading,
  error,
  success,
  runtimeTimers,
  now,
  mutatingId,
  clearing,
  onRefresh,
  onToggle,
  onClear,
}: {
  presets: OwnerGraphicsPreset[];
  loading: boolean;
  error: string | null;
  success: string | null;
  runtimeTimers: Record<string, RuntimeTimer>;
  now: number;
  mutatingId: string | null;
  clearing: boolean;
  onRefresh: () => void;
  onToggle: (preset: OwnerGraphicsPreset, nextActive: boolean) => void;
  onClear: () => void;
}) {
  const quickSwitches = useMemo(() => buildQuickGraphicsSwitches(presets), [presets]);

  return (
    <CockpitPanel className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
        <div>
          <p className="font-ui text-[0.66rem] font-black uppercase tracking-[0.08em] text-white">
            GRAPHICS PLAYBACK DECK
          </p>
          <p className="mt-0.5 inline-flex animate-pulse items-center gap-1 font-ui text-[0.48rem] font-bold uppercase text-[#ff2faf]">
            <AlertTriangle className="h-3 w-3" />
            AUTO-CLEAR TIMER ENABLED
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="grid h-7 w-7 place-items-center rounded border border-white/10 bg-white/5 text-white/70 disabled:opacity-45"
          aria-label="Refresh graphics deck"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <QuickGraphicsSwitchBank
        switches={quickSwitches}
        mutatingId={mutatingId}
        clearing={clearing}
        onToggle={onToggle}
      />

      <div className="min-h-0 space-y-1.5 overflow-y-auto p-2">
        {error ? (
          <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2 font-body text-xs text-red-100">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-lime-400/30 bg-lime-400/10 px-3 py-2 font-body text-xs text-lime-100">
            {success}
          </div>
        ) : null}
        {loading ? (
          <div className="grid min-h-40 place-items-center rounded-md border border-white/10 bg-black/20 font-body text-sm text-white/60">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#00a8ff]" />
              Loading live graphics queue...
            </span>
          </div>
        ) : presets.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-black/24 p-5 text-center font-body text-sm text-white/50">
            No graphics presets are available. Build them in the Graphics Suite, then return to this cockpit.
          </div>
        ) : (
          presets.map((preset, index) => (
            <GraphicsRow
              key={preset.id}
              preset={preset}
              index={index}
              timer={runtimeTimers[preset.id]}
              now={now}
              mutating={mutatingId === preset.id}
              clearing={clearing}
              onToggle={onToggle}
            />
          ))
        )}
      </div>

      <div className="border-t border-red-300/25 bg-[#210004]/95 p-2">
        <button
          type="button"
          disabled={clearing}
          onClick={onClear}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-center font-ui text-xs font-black uppercase leading-tight text-white shadow-[0_0_24px_rgba(220,38,38,0.45)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-55 sm:text-sm"
        >
          {clearing ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}
          CLEAR ALL GRAPHICS
          <span className="hidden sm:inline">(WIPES OUTPUT INSTANTLY)</span>
        </button>
      </div>
    </CockpitPanel>
  );
}

function InfrastructureFooter({ synced }: { synced: boolean }) {
  const checks = [
    "X32 Mixer: Connected",
    "OBS Studio: Connected",
    "Restream: Connected",
    synced ? "Database: Synced" : "Database: Resyncing",
  ];

  return (
    <footer className="grid min-h-0 gap-2 lg:grid-cols-[1.05fr_0.95fr]">
      <CockpitPanel title="PLUG & PLAY AUTOMATION" className="p-2">
        <div className="grid h-full gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 p-2">
            <MonitorDot className="h-8 w-8 text-white/55" />
            <div>
              <p className="font-ui text-[0.58rem] font-black uppercase text-white">X32 Auto-Discovery</p>
              <p className="mt-1 font-body text-[0.52rem] leading-snug text-white/55 sm:text-[0.58rem]">
                Auto-connects on USB/LAN. Tracks Bus 15/16 (CH 1-2).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/25 p-2">
            <Radio className="h-8 w-8 text-white/55" />
            <div>
              <p className="font-ui text-[0.58rem] font-black uppercase text-white">OBS Integration</p>
              <p className="mt-1 font-body text-[0.52rem] leading-snug text-white/55 sm:text-[0.58rem]">
                Pre-saved profiles and stream keys mapped for show launch.
              </p>
            </div>
          </div>
        </div>
      </CockpitPanel>

      <CockpitPanel title="SYSTEM STATUS" className="grid grid-cols-[1fr_7.4rem] gap-2 p-2">
        <div className="space-y-1">
          {checks.map((check) => (
            <p key={check} className="flex items-center gap-1.5 font-body text-[0.58rem] text-white/76 sm:text-xs">
              <CheckCircle2 className={`h-3.5 w-3.5 ${check.includes("Resyncing") ? "text-amber-300" : "text-lime-300"}`} />
              {check}
            </p>
          ))}
        </div>
        <div className="grid place-items-center rounded-md border border-[#00a8ff]/25 bg-black/35 text-center font-headline text-4xl leading-none text-[#00a8ff] drop-shadow-[0_0_16px_rgba(0,168,255,0.8)] sm:text-5xl">
          300
          <span className="font-ui text-[0.62rem] tracking-[0.1em] text-white">AWAKENING</span>
        </div>
      </CockpitPanel>
    </footer>
  );
}

export default function ProductionCockpitClient() {
  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [runtimeTimers, setRuntimeTimers] = useState<Record<string, RuntimeTimer>>({});
  const [now, setNow] = useState(() => Date.now());
  const [countdownTargetIso, setCountdownTargetIso] = useState<string | null>(null);
  const [graphicsLoading, setGraphicsLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [countdownScheduleTimezone, setCountdownScheduleTimezone] =
    useState<ScheduleTimezone>(DEFAULT_SCHEDULE_TIMEZONE);
  const [masterGoLiveModalOpen, setMasterGoLiveModalOpen] = useState(false);
  const [goLiveFeedback, setGoLiveFeedback] = useState<GoLiveFeedback | null>(null);
  const [broadcastAction, setBroadcastAction] = useState<BroadcastAction>("idle");
  const confirmGoLiveInFlightRef = useRef(false);
  const stopStreamInFlightRef = useRef(false);
  const snapshotPollInFlightRef = useRef(false);
  const [destinations, setDestinations] = useState<RestreamDestinations>(DEFAULT_RESTREAM_DESTINATIONS);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationSaving, setDestinationSaving] = useState<DestinationKey | null>(null);
  const [audioTelemetry, setAudioTelemetry] = useState<OwnerAudioTelemetry | null>(null);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [graphicsError, setGraphicsError] = useState<string | null>(null);
  const [graphicsSuccess, setGraphicsSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [broadcastSnapshot, setBroadcastSnapshot] = useState<OwnerBroadcastSnapshot>(EMPTY_BROADCAST_SNAPSHOT);
  const [systemSynced, setSystemSynced] = useState(false);
  const [ownerAuthorized, setOwnerAuthorized] = useState<boolean | null>(null);
  const [streamHealthStatus, setStreamHealthStatus] = useState("Stream health pending");
  const [encoderFields, setEncoderFields] = useState<RestreamEncoderFields>(EMPTY_ENCODER_FIELDS);
  const [encoderHealth, setEncoderHealth] = useState<EncoderHealthStatus | "checking">("checking");
  const [encoderHealthDetail, setEncoderHealthDetail] = useState<string | null>(null);
  const [encoderSaving, setEncoderSaving] = useState(false);
  const autoClearedIds = useRef<Set<string>>(new Set());

  const applyShowSetupState = useCallback((state: ShowSetupStatePayload) => {
    setCountdownTargetIso(state.targetDateTime || null);
    const timezone = state.scheduleTimezone ?? DEFAULT_SCHEDULE_TIMEZONE;
    setCountdownScheduleTimezone(timezone);
    setDestinations({
      youtube: state.restreamDestinations?.youtube ?? DEFAULT_RESTREAM_DESTINATIONS.youtube,
      facebook: state.restreamDestinations?.facebook ?? DEFAULT_RESTREAM_DESTINATIONS.facebook,
      twitch: state.restreamDestinations?.twitch ?? DEFAULT_RESTREAM_DESTINATIONS.twitch,
    });
    setEncoderFields({
      primaryIngestEndpoint: state.primaryIngestEndpoint ?? "",
      streamKey: state.streamKey ?? "",
      attendeePlaybackHlsUrl: state.attendeePlaybackHlsUrl ?? "",
    });
    setNow(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Retry transient failures (dev server restart, cold compile) so a brief
    // blip never latches a false "not authorized in ADMIN_EMAILS" state.
    async function verifyOwnerSession(attempt = 0): Promise<void> {
      try {
        const res = await fetch("/api/owner/show-setup", { credentials: "include" });
        if (cancelled) return;

        if (res.ok) {
          setOwnerAuthorized(true);
          return;
        }

        // 401/403 are real authorization failures — surface immediately.
        if (res.status === 401 || res.status === 403) {
          setOwnerAuthorized(false);
          setBroadcastError("Owner session not authorized — check ADMIN_EMAILS.");
          return;
        }

        // 5xx / unexpected: treat as transient and retry.
        throw new Error(`show-setup returned HTTP ${res.status}`);
      } catch {
        if (cancelled) return;
        if (attempt < 4) {
          setTimeout(() => void verifyOwnerSession(attempt + 1), 1_000 * (attempt + 1));
          return;
        }
        setOwnerAuthorized(false);
        setBroadcastError("Unable to verify owner session — restart dev server and refresh.");
      }
    }

    void verifyOwnerSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadBroadcastSnapshot = useCallback(async (_silent = false) => {
    if (snapshotPollInFlightRef.current) return;
    snapshotPollInFlightRef.current = true;

    try {
      const response = await fetch("/api/owner/broadcast", {
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });

      if (response.status === 401 || response.status === 403) {
        return;
      }

      if (!response.ok) return;

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[cockpit/snapshot-poll] Received non-JSON HTML response. Session may be unauthenticated.");
        return;
      }

      try {
        const data = (await response.json()) as { snapshot?: OwnerBroadcastSnapshot };
        if (data.snapshot) setBroadcastSnapshot(data.snapshot);
      } catch (parseError) {
        console.error("[cockpit/snapshot-parse] Failed to parse snapshot JSON payload:", parseError);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      const errName = err instanceof Error ? err.name : "";
      // AbortSignal.timeout() rejects with a TimeoutError whose message is
      // "signal timed out" — match name + both "timeout"/"timed out" spellings.
      const transient =
        errName === "TimeoutError" ||
        errName === "AbortError" ||
        message === "Failed to fetch" ||
        message.includes("aborted") ||
        message.includes("timeout") ||
        message.includes("timed out");
      if (transient) {
        console.warn("[cockpit/snapshot-poll] Transient fetch issue:", message);
      } else {
        console.error("[cockpit/snapshot-poll] Fetch failed:", message);
      }
    } finally {
      snapshotPollInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadBroadcastSnapshot();
    const interval = window.setInterval(() => void loadBroadcastSnapshot(true), BROADCAST_SNAPSHOT_POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadBroadcastSnapshot]);

  useEffect(() => {
    const loadStreamHealth = async () => {
      try {
        const response = await fetch("/api/owner/stream-health", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await response.json()) as { statusMessage?: string; error?: string };
        if (!response.ok) {
          setStreamHealthStatus(json.error ?? "Stream health unavailable.");
          return;
        }
        setStreamHealthStatus(json.statusMessage ?? "Stream health checked.");
      } catch {
        setStreamHealthStatus("Stream health unavailable.");
      }
    };

    void loadStreamHealth();
    const interval = window.setInterval(() => void loadStreamHealth(), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadEncoderHealth = async () => {
      try {
        const response = await fetch("/api/owner/encoder-health", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await response.json()) as EncoderHealthResponse;
        if (!response.ok || json.ok === false) {
          setEncoderHealth("offline");
          setEncoderHealthDetail(json.error ?? "Encoder health unavailable.");
          return;
        }
        setEncoderHealth(json.status ?? "unconfigured");
        setEncoderHealthDetail(json.detail ?? null);
      } catch {
        setEncoderHealth("offline");
        setEncoderHealthDetail("Encoder health unavailable.");
      }
    };

    void loadEncoderHealth();
    const interval = window.setInterval(() => void loadEncoderHealth(), 10_000);
    return () => window.clearInterval(interval);
  }, [encoderFields.attendeePlaybackHlsUrl]);

  const livePreset = useMemo(
    () => presets.find((preset) => preset.is_active_on_stream) ?? null,
    [presets],
  );

  const loadAudioTelemetry = useCallback(async (silent = false) => {
    if (!silent) setAudioLoading(true);
    setAudioError(null);

    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as AudioMixStateResponse;

      if (!response.ok || json.ok === false || json.success === false || !json.telemetry) {
        throw new Error(json.error || "Unable to load audio telemetry.");
      }

      setAudioTelemetry(json.telemetry);
    } catch (audioLoadError) {
      setAudioError(audioLoadError instanceof Error ? audioLoadError.message : "Unable to load audio telemetry.");
    } finally {
      if (!silent) setAudioLoading(false);
    }
  }, []);
  const loadShowSetup = useCallback(async () => {
    setDestinationsLoading(true);

    try {
      const response = await fetch("/api/owner/show-setup", {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as ShowSetupResponse;

      if (response.status === 401 || response.status === 403) {
        setOwnerAuthorized(false);
        throw new Error(parseOwnerApiError(response, json, "Owner access denied."));
      }

      if (!response.ok || !json.state) {
        throw new Error(parseOwnerApiError(response, json, "Unable to load show setup."));
      }

      setOwnerAuthorized(true);
      applyShowSetupState(json.state);
      console.info("[cockpit] Show setup loaded.");
    } catch (setupError) {
      const message =
        setupError instanceof Error ? setupError.message : "Unable to load show setup.";
      setBroadcastError(message);
      console.error("[cockpit] show setup load failed:", message);
    } finally {
      setDestinationsLoading(false);
    }
  }, [applyShowSetupState]);

  const loadGraphics = useCallback(async () => {
    setGraphicsLoading(true);
    setGraphicsError(null);

    try {
      const presetResponse = await fetch("/api/owner/graphics/presets", { cache: "no-store" });
      const presetJson = (await presetResponse.json()) as ApiPresetResponse;

      if (!presetResponse.ok || !presetJson.success) {
        throw new Error(presetJson.error || "Unable to load graphics cockpit.");
      }

      setPresets(sortPresets(presetJson.presets ?? []));
      setSystemSynced(true);
    } catch (loadError) {
      setSystemSynced(false);
      setGraphicsError(loadError instanceof Error ? loadError.message : "Unable to load graphics cockpit.");
    } finally {
      setGraphicsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadGraphics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadGraphics]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadShowSetup(), 0);
    return () => window.clearTimeout(timer);
  }, [loadShowSetup]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAudioTelemetry(), 0);
    const interval = window.setInterval(() => void loadAudioTelemetry(true), 4_000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadAudioTelemetry]);

  useEffect(() => {
    const supabase = getSupabase();

    try {
      const channel = supabase
        .channel(`owner-production-cockpit-${OWNER_GRAPHICS_EVENT_ID}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "owner_graphics_presets",
            filter: `event_id=eq.${OWNER_GRAPHICS_EVENT_ID}`,
          },
          (payload) => {
            setSystemSynced(true);
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as Partial<OwnerGraphicsPreset>).id;
              if (deletedId) setPresets((current) => removePreset(current, deletedId));
              return;
            }

            const nextPreset = payload.new as OwnerGraphicsPreset;
            if (nextPreset?.id) setPresets((current) => mergePreset(current, nextPreset));
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setSystemSynced(true);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setSystemSynced(false);
            setGraphicsError("Realtime graphics channel disconnected. Use refresh to resync.");
          }
        });

      return () => {
        try {
          void supabase.removeChannel(channel);
        } catch {
          setSystemSynced(false);
        }
      };
    } catch {
      queueMicrotask(() => {
        setSystemSynced(false);
        setGraphicsError("Realtime graphics subscription failed to initialize.");
      });
      return undefined;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const togglePreset = useCallback(
    async (preset: OwnerGraphicsPreset, nextActive: boolean, triggeredByTimer = false) => {
      setMutatingId(triggeredByTimer ? null : preset.id);
      setGraphicsError(null);
      if (!triggeredByTimer) setGraphicsSuccess(null);

      try {
        const response = await fetch("/api/owner/graphics/presets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: preset.id, isActiveOnStream: nextActive }),
        });
        const json = (await response.json()) as ApiPresetResponse;

        if (!response.ok || !json.success || !json.preset) {
          throw new Error(json.error || "Unable to update graphic state.");
        }

        setPresets((current) => mergePreset(current, json.preset as OwnerGraphicsPreset));

        if (nextActive) {
          const durationSeconds = preset.duration_seconds ?? 0;
          autoClearedIds.current.delete(preset.id);

          if (durationSeconds > 0) {
            setRuntimeTimers({
              [preset.id]: { startedAt: Date.now(), durationSeconds },
            });
          } else {
            setRuntimeTimers((current) => {
              const next = { ...current };
              delete next[preset.id];
              return next;
            });
          }
        } else {
          setRuntimeTimers((current) => {
            const next = { ...current };
            delete next[preset.id];
            return next;
          });
        }

        if (!triggeredByTimer) {
          setGraphicsSuccess(
            nextActive
              ? `${preset.content_primary} is now live for app viewers.`
              : `${preset.content_primary} removed from stream.`,
          );
        }
      } catch (toggleError) {
        setGraphicsError(toggleError instanceof Error ? toggleError.message : "Unable to update graphic state.");
      } finally {
        setMutatingId(null);
      }
    },
    [],
  );

  useEffect(() => {
    presets.forEach((preset) => {
      const timer = runtimeTimers[preset.id];
      if (!preset.is_active_on_stream || !timer || autoClearedIds.current.has(preset.id)) return;

      const elapsedMs = now - timer.startedAt;
      if (elapsedMs >= timer.durationSeconds * 1000) {
        autoClearedIds.current.add(preset.id);
        void togglePreset(preset, false, true);
      }
    });
  }, [now, presets, runtimeTimers, togglePreset]);

  const clearAllGraphics = useCallback(async () => {
    setClearing(true);
    setGraphicsError(null);
    setGraphicsSuccess(null);

    try {
      const response = await fetch("/api/owner/graphics/presets", { method: "DELETE" });
      const json = (await response.json()) as ApiPresetResponse;

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Unable to clear live graphics.");
      }

      setPresets((current) => current.map((preset) => ({ ...preset, is_active_on_stream: false })));
      setRuntimeTimers({});
      autoClearedIds.current.clear();
      setGraphicsSuccess(`Emergency clear complete. ${json.clearedCount ?? 0} graphic(s) removed.`);
    } catch (clearError) {
      setGraphicsError(clearError instanceof Error ? clearError.message : "Unable to clear live graphics.");
    } finally {
      setClearing(false);
    }
  }, []);

  const stopStreaming = useCallback(async () => {
    if (stopStreamInFlightRef.current || broadcastAction !== "idle") return;
    if (broadcastSnapshot.publish.status !== "publishing") return;

    stopStreamInFlightRef.current = true;
    setBroadcastAction("stop");
    setBroadcastError(null);
    setBroadcastMessage("Sending broadcast command...");

    try {
      const response = await fetch("/api/owner/broadcast-end", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = await readOwnerApiJson<BroadcastResponse>(
        response,
        "Stop broadcast",
      );

      if (!response.ok || json.ok === false) {
        throw new Error(json.message || json.error || `Broadcast command failed with HTTP ${response.status}.`);
      }

      if (json.snapshot) setBroadcastSnapshot(json.snapshot);
      else await loadBroadcastSnapshot(true);

      setBroadcastMessage(json.message || "Broadcast command confirmed.");
    } catch (commandError) {
      setBroadcastError(commandError instanceof Error ? commandError.message : "Broadcast command failed.");
      setBroadcastMessage(null);
    } finally {
      stopStreamInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [broadcastAction, broadcastSnapshot.publish.status, loadBroadcastSnapshot]);

  const confirmMasterGoLive = useCallback(async () => {
    if (confirmGoLiveInFlightRef.current || broadcastAction !== "idle") return;

    confirmGoLiveInFlightRef.current = true;
    setBroadcastAction("master-go-live");
    setBroadcastError(null);
    setGoLiveFeedback(null);
    setBroadcastMessage("Master override — forcing live broadcast...");

    try {
      const response = await fetch("/api/owner/master-go-live", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "external_hls", confirm: true, masterOverride: true }),
      });
      const json = await readOwnerApiJson<
        BroadcastResponse & {
          state?: ShowSetupStatePayload;
          previousTargetDateTime?: string;
        }
      >(response, "Master go-live");

      if (!response.ok || json.ok === false) {
        throw new Error(parseOwnerApiError(response, json, "Master go-live failed."));
      }

      const snapshot = json.snapshot;
      const feedback = buildGoLiveFeedback(
        snapshot,
        json.message || "Master go-live failed.",
        json.ok === true,
      );
      setGoLiveFeedback(feedback);

      if (feedback.kind === "error") {
        setBroadcastError(feedback.detail ?? feedback.message);
        setBroadcastMessage(null);
        if (snapshot) setBroadcastSnapshot(snapshot);
        else await loadBroadcastSnapshot(true);
        return;
      }

      await loadBroadcastSnapshot(true);

      if (json.state) {
        applyShowSetupState(json.state);
      } else {
        await loadShowSetup();
      }

      if (snapshot) {
        setBroadcastSnapshot(snapshot);
      }
      await loadBroadcastSnapshot(true);

      setBroadcastError(null);
      setBroadcastMessage(feedback.message);
      console.info("[cockpit/master-go-live] success", {
        previousTargetDateTime: json.previousTargetDateTime,
      });
    } catch (goLiveError) {
      const message = goLiveError instanceof Error ? goLiveError.message : "Master go-live failed.";
      setGoLiveFeedback({
        kind: "error",
        message: "Go Live failed.",
        detail: message,
      });
      setBroadcastError(message);
      setBroadcastMessage(null);
      console.error("[cockpit/master-go-live] failed:", message);
    } finally {
      confirmGoLiveInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [applyShowSetupState, broadcastAction, loadBroadcastSnapshot, loadShowSetup]);

  const handleDestinationChange = useCallback(
    async (destination: DestinationKey, enabled: boolean) => {
      if (destinationSaving) return;

      setDestinationSaving(destination);
      setBroadcastError(null);
      const previous = destinations;
      const nextDestinations = { ...destinations, [destination]: enabled };
      setDestinations(nextDestinations);
      setBroadcastMessage(`Saving ${destination} Restream target...`);

      try {
        const response = await fetch("/api/owner/show-setup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restreamDestinations: nextDestinations }),
        });
        const json = (await response.json()) as ShowSetupResponse;

        if (!response.ok || !json.state) {
          throw new Error(json.error || `Unable to save ${destination} Restream target.`);
        }

        setDestinations({
          youtube: json.state.restreamDestinations?.youtube ?? nextDestinations.youtube,
          facebook: json.state.restreamDestinations?.facebook ?? nextDestinations.facebook,
          twitch: json.state.restreamDestinations?.twitch ?? nextDestinations.twitch,
        });
        setBroadcastMessage(json.message || `${destination} Restream target saved.`);
      } catch (destinationError) {
        setDestinations(previous);
        setBroadcastError(
          destinationError instanceof Error
            ? destinationError.message
            : `Unable to save ${destination} Restream target.`,
        );
        setBroadcastMessage(null);
      } finally {
        setDestinationSaving(null);
      }
    },
    [destinationSaving, destinations],
  );

  const handleSaveEncoder = useCallback(async () => {
    if (encoderSaving) return;

    setEncoderSaving(true);
    setBroadcastError(null);
    setBroadcastMessage("Saving Restream encoder settings...");

    try {
      const response = await fetch("/api/owner/show-setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encoderFields),
      });
      const json = (await response.json()) as ShowSetupResponse;

      if (!response.ok || !json.state) {
        throw new Error(json.error || "Unable to save encoder settings.");
      }

      applyShowSetupState(json.state);
      setBroadcastMessage(json.message || "Encoder settings saved.");
      await loadBroadcastSnapshot();
    } catch (encoderError) {
      setBroadcastError(
        encoderError instanceof Error ? encoderError.message : "Unable to save encoder settings.",
      );
      setBroadcastMessage(null);
    } finally {
      setEncoderSaving(false);
    }
  }, [applyShowSetupState, encoderFields, encoderSaving, loadBroadcastSnapshot]);

  const isBroadcastLive = broadcastSnapshot.publish.status === "publishing";

  return (
    <main className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[#020203] bg-[radial-gradient(circle_at_22%_0%,rgba(0,168,255,0.13),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(255,47,175,0.15),transparent_30%),linear-gradient(180deg,#050507_0%,#020203_54%,#010102_100%)] px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-white">
      <GoLiveMasterOverrideDialog
        open={masterGoLiveModalOpen}
        isConfirming={broadcastAction === "master-go-live"}
        scheduledLabel={formatCockpitEventDate(countdownTargetIso, countdownScheduleTimezone)}
        feedback={goLiveFeedback}
        onCancel={() => {
          if (broadcastAction === "master-go-live") return;
          setMasterGoLiveModalOpen(false);
          setGoLiveFeedback(null);
        }}
        onDismissFeedback={() => {
          setMasterGoLiveModalOpen(false);
        }}
        onConfirm={confirmMasterGoLive}
      />
      <span data-testid="stream-health-status" className="sr-only" aria-live="polite">
        {streamHealthStatus}
      </span>
      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-[112rem] gap-2 xl:grid-cols-[12rem_minmax(0,1fr)]">
        <OwnerProductionSideMenu active="cockpit" showEncoderProfile />

        <div className="flex min-w-0 flex-col gap-2">
        <header className="shrink-0 rounded-[6px] border border-white/10 bg-[#050814]/94 px-3 py-2 shadow-[0_0_28px_rgba(0,168,255,0.08)] sm:px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-headline text-[1.45rem] uppercase leading-none tracking-[0.02em] sm:text-3xl lg:text-4xl">
                <span className="text-[#00a8ff]">PRODUCTION COCKPIT</span>{" "}
                <span className="text-[#ff2faf]">EXECUTION DECK</span>
              </p>
              <p className="mt-1 font-ui text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-white/72 sm:text-[0.68rem]">
                LIVE CONTROL / AUDIO MONITOR / GRAPHICS PLAYBACK / AUTO-FIT RESPONSIVE SHELL
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] sm:text-[0.6rem] ${eventPhaseBadgeTone(broadcastSnapshot.eventPhase.phase)}`}
              >
                <Timer className="h-3 w-3" />
                {formatEventPhaseHeader(broadcastSnapshot.eventPhase.phase)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-lime-300/35 bg-lime-300/10 px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] text-lime-300 sm:text-[0.6rem]">
                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(132,255,75,0.8)]" />
                Auto-Leveling Matrix: ACTIVE
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] sm:text-[0.6rem] ${publishBadgeTone(broadcastSnapshot.publish.status)}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    broadcastSnapshot.publish.status === "publishing"
                      ? "bg-lime-300 shadow-[0_0_10px_rgba(132,255,75,0.8)]"
                      : "bg-white/40"
                  }`}
                />
                {streamEngineLabel(broadcastSnapshot.publish.status)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] sm:text-[0.6rem] ${sourceBadgeTone(broadcastSnapshot.feed.activeSource)}`}
              >
                <Radio className="h-3 w-3" />
                {sourceLaneLabel(broadcastSnapshot.feed.activeSource)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-[#00a8ff]/35 bg-[#00a8ff]/10 px-2 py-1 font-ui text-[0.52rem] font-black uppercase tracking-[0.08em] text-[#00a8ff] sm:text-[0.6rem]">
                <Database className="h-3 w-3" />
                Playback: {systemSynced ? "Database Synced" : "Database Resyncing"}
              </span>
              <button
                type="button"
                disabled={clearing}
                onClick={() => void clearAllGraphics()}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-red-600 px-3 font-ui text-[0.58rem] font-black uppercase tracking-[0.1em] text-white shadow-[0_0_24px_rgba(220,38,38,0.45)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-55 sm:px-4 sm:text-xs"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Clear All Graphics
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[17rem_minmax(0,1fr)_26rem]">
          <section className="relative order-1 grid min-h-0 gap-2 xl:order-2 xl:grid-rows-[minmax(0,1fr)_auto_auto]">
            <div className="pointer-events-none min-h-0 overflow-hidden">
              <ProgramReturnPanel
                livePreset={livePreset}
                playbackHlsUrl={broadcastSnapshot.playback.hlsUrl}
                publishStatus={broadcastSnapshot.publish.status}
                playbackReachable={broadcastSnapshot.playback.manifestReachable}
              />
            </div>
            <div className="relative z-50 pointer-events-auto min-h-0">
              <RestreamEncoderPanel
                fields={encoderFields}
                health={encoderHealth}
                healthDetail={encoderHealthDetail}
                saving={encoderSaving}
                disabled={!ownerAuthorized || isBroadcastLive}
                onChange={setEncoderFields}
                onSave={() => void handleSaveEncoder()}
              />
            </div>
            <div className="relative z-50 pointer-events-auto min-h-0">
              <StreamMatrixPanel
                broadcastAction={broadcastAction}
                isGoLiveModalOpen={masterGoLiveModalOpen}
                isOwnerReady={ownerAuthorized === true}
                broadcastMessage={broadcastMessage}
                broadcastError={broadcastError}
                goLiveFeedback={goLiveFeedback}
                broadcastSnapshot={broadcastSnapshot}
                destinations={destinations}
                destinationsLoading={destinationsLoading}
                destinationSaving={destinationSaving}
                ownerAuthorized={ownerAuthorized}
                onRequestGoLive={() => {
                  setGoLiveFeedback(null);
                  setBroadcastError(null);
                  setMasterGoLiveModalOpen(true);
                }}
                onStop={() => void stopStreaming()}
                onDestinationChange={(destination, enabled) => void handleDestinationChange(destination, enabled)}
              />
            </div>
          </section>

          <aside className="order-2 min-h-[24rem] xl:order-3 xl:min-h-0">
            <GraphicsDeckPanel
              presets={presets}
              loading={graphicsLoading}
              error={graphicsError}
              success={graphicsSuccess}
              runtimeTimers={runtimeTimers}
              now={now}
              mutatingId={mutatingId}
              clearing={clearing}
              onRefresh={() => void loadGraphics()}
              onToggle={(preset, nextActive) => void togglePreset(preset, nextActive)}
              onClear={() => void clearAllGraphics()}
            />
          </aside>

          <aside className="order-3 min-h-[28rem] xl:order-1 xl:min-h-0">
            <AudioMonitorPanel
              telemetry={audioTelemetry}
              loading={audioLoading}
              error={audioError}
              onRefresh={() => void loadAudioTelemetry()}
            />
          </aside>
        </div>

        <div className="shrink-0">
          <InfrastructureFooter synced={systemSynced} />
        </div>
        </div>
      </div>
    </main>
  );
}
