import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type {
  FeedState,
  GoLiveRequestBody,
  PreflightCheck,
  PublishMode,
  EventPhaseState,
  SwitchFeedRequestBody,
} from "@/lib/owner/contracts";
import { isFatalHlsProbeFailure, type HlsProbeResult } from "@/lib/owner/hls-readiness";
import { isLivScheduleGateEnabled } from "@/lib/enterprise/liv-golf/liv-env-config";
import type { OwnerStreamStateRow } from "@/lib/owner/load-owner-state";

export const BROADCAST_HARDWARE_DEFAULTS = {
  video: {
    rateControl: "CBR",
    keyframeIntervalSeconds: 2.0,
    profile: "High",
    defaultResolutionWidth: 1920,
    defaultResolutionHeight: 1080,
    fps: 30,
  },
  audio: {
    codec: "AAC-LC",
    sampleRateHz: 48000,
    channels: "Stereo",
    targetLoudnessLufs: -16,
    brickwallPeakDbfs: -2.0,
  },
} as const;

export type BroadcastHardwareDefaults = typeof BROADCAST_HARDWARE_DEFAULTS;

export function formatBroadcastVideoDefaultLabel(): string {
  const video = BROADCAST_HARDWARE_DEFAULTS.video;
  return `${video.defaultResolutionWidth}x${video.defaultResolutionHeight} @ ${video.fps}fps · ${video.profile} · ${video.rateControl} · KF ${video.keyframeIntervalSeconds}s`;
}

export function formatBroadcastAudioDefaultLabel(): string {
  const audio = BROADCAST_HARDWARE_DEFAULTS.audio;
  return `${audio.codec} · ${audio.sampleRateHz / 1000}kHz · ${audio.channels} · ${audio.targetLoudnessLufs} LUFS · peak ${audio.brickwallPeakDbfs} dBFS`;
}

type BuildPreflightInput = {
  eventPhase: EventPhaseState;
  countdownConfig: EventCountdownConfig;
  streamState: OwnerStreamStateRow | null;
  hlsProbe: HlsProbeResult;
  requestedMode?: PublishMode;
  feed?: FeedState;
};

function restreamFeedCheck(feed: FeedState | undefined): PreflightCheck[] {
  if (!feed) {
    return [
      {
        id: "feed_restream",
        label: "Restream HLS configured",
        status: "skipped",
      },
    ];
  }

  return [
    {
      id: "feed_restream",
      label: "Restream HLS manifest",
      status: feed.primary.hlsUrl ? (feed.primary.manifestReachable ? "pass" : "warn") : "fail",
      detail:
        feed.primary.detail ??
        (feed.primary.hlsUrl
          ? feed.primary.manifestReachable
            ? "Restream manifest validated."
            : "HLS URL saved but manifest not reachable — start OBS streaming first."
          : "Save HLS playback URL in the Restream encoder panel."),
    },
  ];
}

function scheduleCheck(input: BuildPreflightInput): PreflightCheck {
  if (!isLivScheduleGateEnabled()) {
    return {
      id: "schedule_times",
      label: "Go-live and end times configured",
      status: "skipped",
      detail: "Schedule gate disabled — master go-live does not require a future targetDateTime.",
    };
  }

  const { eventPhase, countdownConfig } = input;

  if (!countdownConfig.is_active) {
    return {
      id: "schedule_active",
      label: "Countdown schedule active",
      status: "warn",
      detail: "No active countdown config — optional; master go-live does not require a scheduled air time.",
    };
  }

  if (!eventPhase.startTime || !eventPhase.endTime) {
    return {
      id: "schedule_times",
      label: "Go-live and end times configured",
      status: "warn",
      detail: "No scheduled air window — optional; set Target Air Time in Stream Setup for fan countdown headers.",
    };
  }

  if (new Date(eventPhase.endTime).getTime() <= new Date(eventPhase.startTime).getTime()) {
    return {
      id: "schedule_times",
      label: "Go-live and end times configured",
      status: "fail",
      detail: "Show end must be after go-live time.",
    };
  }

  return {
    id: "schedule_times",
    label: "Go-live and end times configured",
    status: "pass",
    detail: `${eventPhase.startTime} → ${eventPhase.endTime}`,
  };
}

function hlsChecks(hlsProbe: HlsProbeResult): PreflightCheck[] {
  if (
    hlsProbe.invalidReason === "ivs_arn_mismatch" ||
    hlsProbe.invalidReason === "ivs_channel_not_found"
  ) {
    console.warn("[owner/preflight] Continuing RTMP publish despite IVS playback diagnostic.", {
      invalidReason: hlsProbe.invalidReason,
      detail: hlsProbe.detail,
    });
  }

  const fatalHlsFailure = isFatalHlsProbeFailure(hlsProbe);

  return [
    {
      id: "hls_env",
      label: "Restream HLS URL configured",
      status: hlsProbe.hlsUrl ? "pass" : "fail",
      detail: hlsProbe.hlsUrl ?? "Save an HLS .m3u8 URL in the cockpit encoder panel.",
    },
    {
      id: "hls_manifest",
      label: "Restream HLS manifest reachable",
      status: hlsProbe.manifestReachable
        ? "pass"
        : fatalHlsFailure
          ? "fail"
          : hlsProbe.hlsUrl
            ? "warn"
            : "skipped",
      detail: hlsProbe.detail ?? (hlsProbe.manifestReachable ? "Manifest validated." : undefined),
    },
  ];
}

export function buildPreflightChecks(input: BuildPreflightInput): PreflightCheck[] {
  return [
    scheduleCheck(input),
    ...hlsChecks(input.hlsProbe),
    ...restreamFeedCheck(input.feed),
    {
      id: "stream_state_row",
      label: "Platform stream state row",
      status: input.streamState ? "pass" : "fail",
      detail: input.streamState ? `Row ${input.streamState.id}` : "live_stream_state missing.",
    },
  ];
}

export function preflightHasBlockers(checks: PreflightCheck[]): boolean {
  return checks.some((check) => check.status === "fail");
}

export function parseGoLiveBody(body: unknown): GoLiveRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;

  const mode = record.mode;
  if (mode && mode !== "external_hls") {
    return null;
  }

  return {
    mode: "external_hls",
    confirm: record.confirm === true,
    masterOverride: record.masterOverride === true,
  };
}

export function parseSwitchFeedBody(body: unknown): SwitchFeedRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const source = record.source;

  if (source !== "primary" && source !== "backup") {
    return null;
  }

  return {
    source,
    confirm: record.confirm === true,
  };
}
