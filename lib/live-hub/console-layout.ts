import type { ChecklistPhaseId } from "@/lib/live-hub/types";

export type HubNavSection =
  | "pre-live"
  | "stream-setup"
  | "content"
  | "team"
  | "advanced";

export const LIVE_HUB_NAV = [
  { id: "pre-live" as const, label: "Pre-Live Check" },
  { id: "stream-setup" as const, label: "Stream Setup" },
  { id: "content" as const, label: "Content & Media" },
  { id: "team" as const, label: "Team & Roles" },
  { id: "advanced" as const, label: "Network Settings" },
];

export const LIVE_TOOLS_NAV = [
  "Teleprompter",
  "Shed Rooms",
  "Music Player",
  "Stage Rehearsal",
] as const;

export const RESOURCES_NAV = [
  "Help Center",
  "Video Tutorials",
  "Support Chat",
] as const;

export const CHECKLIST_STEPS: {
  id: ChecklistPhaseId;
  label: string;
  description: string;
}[] = [
  {
    id: "system",
    label: "System Check",
    description: "Automated telemetry: network, encoder, audio, and stream lanes.",
  },
  {
    id: "content",
    label: "Content Check",
    description:
      "Confirm lower-third graphics and presentation files are synced. Required before Go Live.",
  },
  {
    id: "team",
    label: "Team Check",
    description:
      "Confirm choir, musicians, and stage managers are aligned. Required before Go Live.",
  },
  {
    id: "final_review",
    label: "Final Review",
    description: "Completes automatically once system, content, and team checks pass.",
  },
  {
    id: "go_live",
    label: "Go Live",
    description: "Final operator approval happens in the Go Live review modal.",
  },
];

export type ScheduleSegment = {
  id: string;
  time: string;
  label: string;
  detail: string;
};

export const DEFAULT_EVENT_SCHEDULE: ScheduleSegment[] = [
  {
    id: "seg-1",
    time: "T-60",
    label: "System Check",
    detail: "Encoder, audio, and destination lanes verified.",
  },
  {
    id: "seg-2",
    time: "T-30",
    label: "Content & Presentation",
    detail: "Lower thirds, bumper reels, and stage cues armed.",
  },
  {
    id: "seg-3",
    time: "T-15",
    label: "Team Standby",
    detail: "TD, audio, chat moderation, and prayer team on comms.",
  },
  {
    id: "seg-4",
    time: "T-5",
    label: "Final Review",
    detail: "Safety net, backup lane, and Go Live approval.",
  },
  {
    id: "seg-5",
    time: "LIVE",
    label: "Broadcast Open",
    detail: "Attendee lobby opens on primary HLS lane.",
  },
];

export function resolveCurrentScheduleIndex(input: {
  isLive: boolean;
  checklistCompleteCount: number;
}): number {
  if (input.isLive) return 4;
  if (input.checklistCompleteCount >= 4) return 3;
  if (input.checklistCompleteCount >= 3) return 2;
  if (input.checklistCompleteCount >= 2) return 1;
  return 0;
}
