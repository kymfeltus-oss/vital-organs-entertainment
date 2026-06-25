import type {
  LiveReadinessState,
  ReadinessStatus,
  SectionReadiness,
  TodaysServicePayload,
  UploadStrength,
} from "@/lib/todays-service/types";

export const WELCOME_STORAGE_KEY = "parable_todays_service_setup_complete";

export type SetupStep = {
  id: string;
  label: string;
  sectionId: string;
  isComplete: boolean;
  /** Optional steps are shown in setup UI but do not block Begin Service / go live. */
  optional?: boolean;
};

export type ChecklistItem = {
  label: string;
  sectionId: string;
};

const SECTION_CHECKLIST: Record<
  keyof SectionReadiness,
  { label: string; sectionId: string }
> = {
  sound: { label: "Connect Sound", sectionId: "sound" },
  cameras: { label: "Add Cameras", sectionId: "cameras" },
  internet: { label: "Check Internet", sectionId: "internet" },
  livestream: { label: "Connect Streaming", sectionId: "streaming" },
  recording: { label: "Setup Recording", sectionId: "recording" },
  presentation: { label: "Connect Presentation", sectionId: "presentation" },
};

export function volunteerStatusLabel(status: ReadinessStatus | UploadStrength | "connected" | "error"): string {
  switch (status) {
    case "ready":
    case "excellent":
      return "Ready to Go";
    case "good":
      return "Looking Good";
    case "connected":
      return "Connected";
    case "needs_attention":
    case "error":
      return "Let's Finish Setup";
    case "not_connected":
      return "Not Connected Yet";
    default:
      return "Setup Needed";
  }
}

export function volunteerReadinessHeadline(percent: number): string {
  if (percent >= 100) return "Great news!";
  if (percent >= 80) return "Almost there!";
  if (percent >= 50) return "Let's Finish Setup";
  return "Needs Attention";
}

export function volunteerReadinessSubtext(percent: number): string {
  if (percent >= 100) return "Everything is ready for today's service.";
  if (percent >= 80) return "Just a few more steps and you're ready to go.";
  return "Complete the steps below to get ready.";
}

export function buildRemainingChecklist(
  readiness: LiveReadinessState,
  data: TodaysServicePayload,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const [key, status] of Object.entries(readiness.sections) as [
    keyof SectionReadiness,
    ReadinessStatus,
  ][]) {
    if (status === "ready") continue;

    const base = SECTION_CHECKLIST[key];
    if (key === "livestream") {
      const hasYoutube = data.streamingDestinations.some(
        (d) => d.platform === "youtube" && !d.connected,
      );
      const none = data.streamingDestinations.length === 0;
      items.push({
        label: none ? "Connect Streaming" : hasYoutube ? "Connect YouTube" : base.label,
        sectionId: base.sectionId,
      });
      continue;
    }

    items.push({ label: base.label, sectionId: base.sectionId });
  }

  return items;
}

export const BROADCAST_PROFILE_FEATURES = [
  "Sound",
  "Cameras",
  "Recording",
  "Monitoring",
  "Livestream",
] as const;

/** Required before Begin Service / go live. */
export const SETUP_REQUIRED_WORKFLOW_SECTIONS = [
  "sound",
  "cameras",
  "internet",
  "streaming",
  "recording",
  "presentation",
] as const;

/** Optional — available on the dashboard but not required to go live. */
export const SETUP_OPTIONAL_WORKFLOW_SECTIONS = ["team", "timeline"] as const;

export const SETUP_WORKFLOW_SECTIONS = [
  ...SETUP_REQUIRED_WORKFLOW_SECTIONS,
  ...SETUP_OPTIONAL_WORKFLOW_SECTIONS,
] as const;

export type SetupWorkflowSection = (typeof SETUP_WORKFLOW_SECTIONS)[number];

export type SetupWorkflowAction = {
  sectionId: SetupWorkflowSection;
  openSoundWizard: boolean;
  openCameraSetup: boolean;
};

export function isSoundSetupComplete(data: TodaysServicePayload): boolean {
  const devices = data.soundItems.filter(
    (item) => item.deviceType !== "mixer" && (item.deviceId || item.mixerIp),
  );
  if (devices.length === 0) return false;
  return devices.some(
    (item) =>
      item.status === "ready" &&
      item.liveStatus === "connected" &&
      Boolean(item.lastTestedAt ?? item.lastSuccessfulTestAt) &&
      !item.lastErrorMessage,
  );
}

export function isCamerasSetupComplete(data: TodaysServicePayload): boolean {
  return data.cameras.length > 0;
}

export function isInternetSetupComplete(data: TodaysServicePayload): boolean {
  return data.internetConnections.length > 0;
}

export function isStreamingSetupComplete(data: TodaysServicePayload): boolean {
  const connected = data.streamingDestinations.filter(
    (d) => d.connectionStatus === "ready" || d.connectionStatus === "connected" || d.connected,
  );
  const selectedReady = connected.filter((d) => d.selectedForToday !== false && d.connectionStatus === "ready");
  return selectedReady.length > 0;
}

export function isRecordingSetupComplete(data: TodaysServicePayload): boolean {
  return Boolean(data.recordingSettings[0]?.saveLocation);
}

export function isPresentationSetupComplete(data: TodaysServicePayload): boolean {
  return data.presentationSources.some(
    (source) => source.softwareName !== "None" && source.connectionStatus === "connected",
  );
}

export function isTeamSetupComplete(data: TodaysServicePayload): boolean {
  return data.teamMembers.length > 0;
}

export function isTimelineSetupComplete(data: TodaysServicePayload): boolean {
  return data.timelineItems.length > 0;
}

const SETUP_COMPLETE_CHECKS: Record<SetupWorkflowSection, (data: TodaysServicePayload) => boolean> = {
  sound: isSoundSetupComplete,
  cameras: isCamerasSetupComplete,
  internet: isInternetSetupComplete,
  streaming: isStreamingSetupComplete,
  recording: isRecordingSetupComplete,
  presentation: isPresentationSetupComplete,
  team: isTeamSetupComplete,
  timeline: isTimelineSetupComplete,
};

export function isVolunteerSetupComplete(data: TodaysServicePayload): boolean {
  return SETUP_REQUIRED_WORKFLOW_SECTIONS.every((section) => SETUP_COMPLETE_CHECKS[section](data));
}

export function nextIncompleteSetupAction(data: TodaysServicePayload): SetupWorkflowAction | null {
  for (const sectionId of SETUP_REQUIRED_WORKFLOW_SECTIONS) {
    if (SETUP_COMPLETE_CHECKS[sectionId](data)) continue;
    return {
      sectionId,
      openSoundWizard: sectionId === "sound",
      openCameraSetup: sectionId === "cameras",
    };
  }
  return null;
}

export function nextIncompleteSection(data: TodaysServicePayload): string {
  return nextIncompleteSetupAction(data)?.sectionId ?? "sound";
}

export function buildSetupSteps(data: TodaysServicePayload): SetupStep[] {
  return [
    {
      id: "sound",
      label: "Connect Sound",
      sectionId: "sound",
      isComplete: isSoundSetupComplete(data),
    },
    {
      id: "cameras",
      label: "Add Cameras",
      sectionId: "cameras",
      isComplete: isCamerasSetupComplete(data),
    },
    {
      id: "internet",
      label: "Setup Internet",
      sectionId: "internet",
      isComplete: isInternetSetupComplete(data),
    },
    {
      id: "streaming",
      label: "Connect Streaming",
      sectionId: "streaming",
      isComplete: isStreamingSetupComplete(data),
    },
    {
      id: "recording",
      label: "Setup Recording",
      sectionId: "recording",
      isComplete: isRecordingSetupComplete(data),
    },
    {
      id: "presentation",
      label: "Connect Presentation",
      sectionId: "presentation",
      isComplete: isPresentationSetupComplete(data),
    },
    {
      id: "team",
      label: "Add Team Members",
      sectionId: "team",
      isComplete: isTeamSetupComplete(data),
      optional: true,
    },
    {
      id: "timeline",
      label: "Review Timeline",
      sectionId: "timeline",
      isComplete: isTimelineSetupComplete(data),
      optional: true,
    },
  ];
}

export function computeSetupProgress(data: TodaysServicePayload): {
  completed: number;
  total: number;
  remaining: number;
  steps: SetupStep[];
  optionalSteps: SetupStep[];
} {
  const steps = buildSetupSteps(data);
  const requiredSteps = steps.filter((step) => !step.optional);
  const optionalSteps = steps.filter((step) => step.optional);
  const completed = requiredSteps.filter((step) => step.isComplete).length;
  return {
    completed,
    total: requiredSteps.length,
    remaining: requiredSteps.length - completed,
    steps: requiredSteps,
    optionalSteps,
  };
}

export function isFirstTimeSetup(data: TodaysServicePayload): boolean {
  return (
    data.soundItems.length === 0 &&
    data.mixers.length === 0 &&
    data.cameras.length === 0 &&
    data.internetConnections.length === 0 &&
    data.streamingDestinations.length === 0 &&
    !data.recordingSettings[0]?.saveLocation &&
    data.presentationSources.length === 0 &&
    data.teamMembers.length === 0
  );
}

export function isSetupComplete(data: TodaysServicePayload): boolean {
  return isVolunteerSetupComplete(data);
}

export function hasOpenIssues(data: TodaysServicePayload): boolean {
  return (
    data.alerts.some((a) => a.status === "open") ||
    data.readiness.readinessPercent < 100
  );
}

export function markWelcomeComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WELCOME_STORAGE_KEY, "1");
}

export function isWelcomeDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WELCOME_STORAGE_KEY) === "1";
}

export function shouldShowWelcomeBanner(data: TodaysServicePayload): boolean {
  if (isWelcomeDismissed() || isSetupComplete(data)) return false;
  return isFirstTimeSetup(data);
}
