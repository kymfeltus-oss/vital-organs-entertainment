import type { ScheduleTimezone } from "@/lib/live/schedule-timezone";
import { DEFAULT_SCHEDULE_TIMEZONE } from "@/lib/live/schedule-timezone";

export type PreShowSetupState = {
  eventTitle: string;
  eventDate: string;
  countdownStartTime: string;
  liveStartTime: string;
  timezone: ScheduleTimezone;
  rtmpIngestServer: string;
  streamKey: string;
  hlsPreviewUrl: string;
  primaryCameraLabel: string;
  backupCameraLabel: string;
  masterAudioSource: string;
  outputDestinations: string[];
  givingEnabled: boolean;
  vitalSeedsEnabled: boolean;
  monetizationEnabled: boolean;
  chatModerationEnabled: boolean;
  emergencyBackupStreamUrl: string;
  finalConfirmed: boolean;
};

export type PreShowStepId =
  | "eventTitle"
  | "eventDate"
  | "countdownStartTime"
  | "liveStartTime"
  | "timezone"
  | "rtmpIngestServer"
  | "streamKey"
  | "hlsPreviewUrl"
  | "primaryCameraLabel"
  | "backupCameraLabel"
  | "masterAudioSource"
  | "outputDestinations"
  | "givingEnabled"
  | "vitalSeedsEnabled"
  | "monetizationEnabled"
  | "chatModerationEnabled"
  | "emergencyBackupStreamUrl"
  | "finalConfirmation";

export type PreShowStepDefinition = {
  id: PreShowStepId;
  title: string;
  prompt: string;
  required: boolean;
  kind: "text" | "date" | "time" | "timezone" | "url" | "destinations" | "toggle" | "confirm";
};

export const PRESHOW_WIZARD_STEPS: readonly PreShowStepDefinition[] = [
  { id: "eventTitle", title: "Event Title", prompt: "What is the show title attendees will see?", required: true, kind: "text" },
  { id: "eventDate", title: "Event Date", prompt: "Which calendar date is this production?", required: true, kind: "date" },
  { id: "countdownStartTime", title: "Countdown Start Time", prompt: "When should the public countdown begin?", required: false, kind: "time" },
  { id: "liveStartTime", title: "Live Start Time", prompt: "When does the live broadcast go to air?", required: true, kind: "time" },
  { id: "timezone", title: "Timezone", prompt: "Select the event wall-clock timezone.", required: true, kind: "timezone" },
  { id: "rtmpIngestServer", title: "RTMP Ingest Server", prompt: "Enter the RTMP server URL (no stream key).", required: true, kind: "url" },
  { id: "streamKey", title: "Stream Key", prompt: "Enter the encoder stream key.", required: true, kind: "text" },
  { id: "hlsPreviewUrl", title: "HLS Preview URL", prompt: "Paste the preview .m3u8 playback URL.", required: true, kind: "url" },
  { id: "primaryCameraLabel", title: "Primary Camera Label", prompt: "Name the primary camera input.", required: false, kind: "text" },
  { id: "backupCameraLabel", title: "Backup Camera Label", prompt: "Name the backup camera input.", required: false, kind: "text" },
  { id: "masterAudioSource", title: "Master Audio Source", prompt: "Which bus or source feeds master audio?", required: false, kind: "text" },
  { id: "outputDestinations", title: "Output Destinations", prompt: "List at least one distribution destination.", required: true, kind: "destinations" },
  { id: "givingEnabled", title: "Giving Enabled", prompt: "Enable in-show giving for this production?", required: false, kind: "toggle" },
  { id: "vitalSeedsEnabled", title: "Vital Seeds Enabled", prompt: "Enable Vital Seeds for this show?", required: false, kind: "toggle" },
  { id: "monetizationEnabled", title: "Monetization Enabled", prompt: "Enable monetization features?", required: false, kind: "toggle" },
  { id: "chatModerationEnabled", title: "Chat Moderation Enabled", prompt: "Enable chat moderation tooling?", required: false, kind: "toggle" },
  { id: "emergencyBackupStreamUrl", title: "Emergency Backup Stream URL", prompt: "Optional backup HLS/RTMP failover URL.", required: false, kind: "url" },
  { id: "finalConfirmation", title: "Final Confirmation", prompt: "Confirm all settings are reviewed before showtime.", required: false, kind: "confirm" },
] as const;

export type SummaryCardStatus = "configured" | "missing" | "needs_review";

export type PreShowSummaryCard = {
  id: string;
  label: string;
  status: SummaryCardStatus;
  detail: string;
};

export type PreShowReadiness = {
  score: number;
  message: string;
  breakdown: {
    schedule: number;
    streamIngest: number;
    previewPlayback: number;
    cameraSetup: number;
    soundSetup: number;
    audienceFeatures: number;
    backupSafety: number;
  };
};

export type SaveEndpointStatus = "idle" | "saving" | "connected" | "disconnected" | "partial";

export function createDefaultPreShowState(
  overrides: Partial<PreShowSetupState> = {},
): PreShowSetupState {
  return {
    eventTitle: "",
    eventDate: "",
    countdownStartTime: "",
    liveStartTime: "",
    timezone: DEFAULT_SCHEDULE_TIMEZONE,
    rtmpIngestServer: "",
    streamKey: "",
    hlsPreviewUrl: "",
    primaryCameraLabel: "",
    backupCameraLabel: "",
    masterAudioSource: "",
    outputDestinations: [],
    givingEnabled: false,
    vitalSeedsEnabled: false,
    monetizationEnabled: false,
    chatModerationEnabled: true,
    emergencyBackupStreamUrl: "",
    finalConfirmed: false,
    ...overrides,
  };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function validatePreShowStep(
  stepId: PreShowStepId,
  state: PreShowSetupState,
): string | null {
  switch (stepId) {
    case "eventTitle":
      return hasText(state.eventTitle) ? null : "Event title is required.";
    case "eventDate":
      return hasText(state.eventDate) ? null : "Event date is required.";
    case "liveStartTime":
      return hasText(state.liveStartTime) ? null : "Live start time is required.";
    case "timezone":
      return hasText(state.timezone) ? null : "Timezone is required.";
    case "rtmpIngestServer":
      return hasText(state.rtmpIngestServer) ? null : "RTMP ingest server is required.";
    case "streamKey":
      return hasText(state.streamKey) ? null : "Stream key is required.";
    case "hlsPreviewUrl":
      return hasText(state.hlsPreviewUrl) ? null : "HLS preview URL is required.";
    case "outputDestinations":
      return state.outputDestinations.length > 0
        ? null
        : "Add at least one output destination.";
    case "finalConfirmation":
      return state.finalConfirmed ? null : "Confirm settings before continuing.";
    default:
      return null;
  }
}

export function computePreShowReadiness(state: PreShowSetupState): PreShowReadiness {
  const scheduleComplete =
    hasText(state.eventTitle) &&
    hasText(state.eventDate) &&
    hasText(state.liveStartTime) &&
    hasText(state.timezone);

  const streamIngestComplete =
    hasText(state.rtmpIngestServer) && hasText(state.streamKey);

  const previewComplete = hasText(state.hlsPreviewUrl);
  const cameraComplete = hasText(state.primaryCameraLabel);
  const soundComplete = hasText(state.masterAudioSource);

  const audienceComplete =
    state.givingEnabled ||
    state.vitalSeedsEnabled ||
    state.monetizationEnabled ||
    state.chatModerationEnabled;

  const backupComplete =
    hasText(state.emergencyBackupStreamUrl) || hasText(state.backupCameraLabel);

  const breakdown = {
    schedule: scheduleComplete ? 20 : 0,
    streamIngest: streamIngestComplete ? 25 : 0,
    previewPlayback: previewComplete ? 15 : 0,
    cameraSetup: cameraComplete ? 10 : 0,
    soundSetup: soundComplete ? 10 : 0,
    audienceFeatures: audienceComplete ? 10 : 0,
    backupSafety: backupComplete ? 10 : 0,
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  let message = "Not ready for live launch.";
  if (score === 100) message = "Show ready.";
  else if (score >= 80) message = "Ready for producer review.";

  return { score, message, breakdown };
}

export function buildPreShowSummaryCards(state: PreShowSetupState): PreShowSummaryCard[] {
  const readiness = computePreShowReadiness(state);

  function statusFrom(score: number, requiredFieldsMet: boolean): SummaryCardStatus {
    if (score === 0 || !requiredFieldsMet) return "missing";
    if (score < 10) return "needs_review";
    return "configured";
  }

  return [
    {
      id: "schedule",
      label: "Event Schedule",
      status: statusFrom(
        readiness.breakdown.schedule,
        hasText(state.eventDate) && hasText(state.liveStartTime),
      ),
      detail: hasText(state.eventDate)
        ? `${formatScheduleDate(state.eventDate)} · ${formatScheduleTime(state.liveStartTime)} ${timezoneAbbrev(state.timezone)}`
        : "Date and live time not set",
    },
    {
      id: "ingest",
      label: "Stream Ingest",
      status: statusFrom(
        readiness.breakdown.streamIngest,
        hasText(state.rtmpIngestServer) && hasText(state.streamKey),
      ),
      detail: hasText(state.rtmpIngestServer)
        ? `RTMP Ingest · ${hasText(state.streamKey) ? "Stream Key Set" : "Stream Key Missing"}`
        : "RTMP not configured",
    },
    {
      id: "preview",
      label: "Preview Playback",
      status: statusFrom(readiness.breakdown.previewPlayback, hasText(state.hlsPreviewUrl)),
      detail: hasText(state.hlsPreviewUrl) ? "HLS Preview URL Set" : "No preview URL",
    },
    {
      id: "camera",
      label: "Camera Setup",
      status: statusFrom(readiness.breakdown.cameraSetup, hasText(state.primaryCameraLabel)),
      detail: hasText(state.primaryCameraLabel)
        ? `${state.primaryCameraLabel}${hasText(state.backupCameraLabel) ? " · Backup Set" : ""}`
        : "Camera labels not set",
    },
    {
      id: "sound",
      label: "Sound Setup",
      status: statusFrom(readiness.breakdown.soundSetup, hasText(state.masterAudioSource)),
      detail: hasText(state.masterAudioSource)
        ? `${state.masterAudioSource} · Inputs Set`
        : "Master audio not set",
    },
    {
      id: "audience",
      label: "Audience Features",
      status: statusFrom(readiness.breakdown.audienceFeatures, true),
      detail:
        [
          state.chatModerationEnabled && "Chat",
          state.chatModerationEnabled && "Moderation",
          state.givingEnabled && "Giving",
        ]
          .filter(Boolean)
          .join(" · ") || "No audience features enabled",
    },
    {
      id: "monetization",
      label: "Giving & Monetization",
      status:
        state.givingEnabled || state.vitalSeedsEnabled || state.monetizationEnabled
          ? "configured"
          : "missing",
      detail:
        state.givingEnabled || state.vitalSeedsEnabled
          ? `Giving · Vital Seeds ${state.vitalSeedsEnabled ? "Enabled" : "Off"}`
          : "Giving and seeds not enabled",
    },
    {
      id: "safety",
      label: "Safety & Backup",
      status: statusFrom(
        readiness.breakdown.backupSafety,
        hasText(state.emergencyBackupStreamUrl) || hasText(state.backupCameraLabel),
      ),
      detail: hasText(state.emergencyBackupStreamUrl)
        ? "Backup URL set"
        : "Backup Stream URL Missing",
    },
  ];
}

export function maskStreamKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 4) return "••••";
  return `${"•".repeat(Math.min(trimmed.length - 4, 16))}${trimmed.slice(-4)}`;
}

/** Seven display phases matching the production pre-show mockup step counter. */
export const PRESHOW_WIZARD_PHASE_COUNT = 7;

const PHASE_STEP_RANGES: readonly { start: number; end: number }[] = [
  { start: 0, end: 4 },
  { start: 5, end: 6 },
  { start: 7, end: 7 },
  { start: 8, end: 9 },
  { start: 10, end: 11 },
  { start: 12, end: 15 },
  { start: 16, end: 17 },
];

export function getWizardPhaseIndex(stepIndex: number): number {
  const index = PHASE_STEP_RANGES.findIndex(
    (range) => stepIndex >= range.start && stepIndex <= range.end,
  );
  return index >= 0 ? index + 1 : 1;
}

export const PRESHOW_CARD_STEP_INDEX: Record<string, number> = {
  schedule: 0,
  ingest: 5,
  preview: 7,
  camera: 8,
  sound: 10,
  audience: 15,
  monetization: 12,
  safety: 16,
};

function formatScheduleDate(isoDate: string): string {
  if (!isoDate) return "—";
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatScheduleTime(time: string): string {
  if (!time) return "—";
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function timezoneAbbrev(timezone: ScheduleTimezone): string {
  const match = timezone.split("/").pop() ?? timezone;
  return match.replace("_", " ");
}

export function formatStepAnswerForChat(
  stepId: PreShowStepId,
  state: PreShowSetupState,
  options: { revealStreamKey?: boolean } = {},
): string {
  switch (stepId) {
    case "eventTitle":
      return state.eventTitle.trim() || "—";
    case "eventDate":
      return formatScheduleDate(state.eventDate);
    case "countdownStartTime":
      return formatScheduleTime(state.countdownStartTime);
    case "liveStartTime":
      return formatScheduleTime(state.liveStartTime);
    case "timezone":
      return timezoneAbbrev(state.timezone);
    case "rtmpIngestServer":
      return state.rtmpIngestServer.trim() || "—";
    case "streamKey":
      return options.revealStreamKey
        ? state.streamKey.trim() || "—"
        : maskStreamKey(state.streamKey) || "—";
    case "hlsPreviewUrl":
      return state.hlsPreviewUrl.trim() || "—";
    case "primaryCameraLabel":
      return state.primaryCameraLabel.trim() || "—";
    case "backupCameraLabel":
      return state.backupCameraLabel.trim() || "—";
    case "masterAudioSource":
      return state.masterAudioSource.trim() || "—";
    case "outputDestinations":
      return state.outputDestinations.length > 0
        ? state.outputDestinations.join(", ")
        : "—";
    case "givingEnabled":
      return state.givingEnabled ? "Enabled" : "Disabled";
    case "vitalSeedsEnabled":
      return state.vitalSeedsEnabled ? "Enabled" : "Disabled";
    case "monetizationEnabled":
      return state.monetizationEnabled ? "Enabled" : "Disabled";
    case "chatModerationEnabled":
      return state.chatModerationEnabled ? "Enabled" : "Disabled";
    case "emergencyBackupStreamUrl":
      return state.emergencyBackupStreamUrl.trim() || "—";
    case "finalConfirmation":
      return state.finalConfirmed ? "Confirmed" : "Pending";
    default:
      return "—";
  }
}

export function readinessShortLabel(score: number): string {
  if (score >= 100) return "Show Ready";
  if (score >= 80) return "Good";
  return "Not Ready";
}
