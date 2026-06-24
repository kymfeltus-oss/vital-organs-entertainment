import type { OpsProductionSection } from "@/lib/ops/production-sections";
import {
  EXPERIENCE_LIVE_PATH,
  PUBLIC_COUNTDOWN_PATH,
} from "@/lib/experience/live-routes";

export const OPS_TEAM_ROLE_STORAGE_KEY = "ops_team_role_mock";

export type OpsTeamRole =
  | "admin"
  | "producer"
  | "broadcast_operator"
  | "prayer_team"
  | "camera_crew";

export type OpsHubModuleId =
  | "crew_console"
  | "readiness"
  | "broadcast_console"
  | "prayer_queue"
  | "incident"
  | "ops_home"
  | "camera_desk"
  | "countdown_editor"
  | "stream_control"
  | "public_countdown"
  | "attendee_live"
  | "obs_countdown";

export type OpsHubModule = {
  id: OpsHubModuleId;
  title: string;
  description: string;
  href: string;
  badge?: string;
  section: OpsProductionSection;
  /** Opens in a new tab — attendee-facing surfaces. */
  external?: boolean;
};

export const OPS_HUB_MODULES: readonly OpsHubModule[] = [
  {
    id: "countdown_editor",
    title: "Countdown Editor",
    description:
      "Hero copy, show schedule, holding-room restore, live chat monitor, and go-live launch.",
    href: "/ops/countdown",
    badge: "Pre-Show",
    section: "setup",
  },
  {
    id: "readiness",
    title: "Show Readiness",
    description: "Pre-show checklist matrix and interlock status for producers.",
    href: "/ops/live-hub/readiness",
    badge: "Matrix",
    section: "setup",
  },
  {
    id: "broadcast_console",
    title: "Broadcast Desk",
    description: "PARABLE broadcast console — sources, preview, Restream ingest, and stream health.",
    href: "/dashboard/broadcast",
    badge: "Stream",
    section: "setup",
  },
  {
    id: "stream_control",
    title: "Stream Control",
    description: "One-click go live, backup lane, and emergency offline for all attendees.",
    href: "/ops/control",
    badge: "Master",
    section: "live",
  },
  {
    id: "crew_console",
    title: "Crew Console",
    description: "Live Hub production console — preview, readiness review, and go-live workflow.",
    href: "/ops/live-hub/console",
    badge: "Live Hub",
    section: "live",
  },
  {
    id: "camera_desk",
    title: "Camera Mobile Desk",
    description:
      "Phone-optimized studio controller. Stream from your mobile lens and hot-swap local inputs.",
    href: "/ops/camera-desk",
    badge: "Mobile",
    section: "live",
  },
  {
    id: "prayer_queue",
    title: "Prayer Queue",
    description: "Filtered prayer team view for live moderation and response flow.",
    href: "/ops/live-hub/prayer-queue",
    badge: "Prayer",
    section: "live",
  },
  {
    id: "incident",
    title: "Incident Log",
    description: "Live system errors, audits, and PARABLE safety event history.",
    href: "/ops/live-hub/incident",
    badge: "Audit",
    section: "monitoring",
  },
  {
    id: "ops_home",
    title: "Production Metrics Dashboard",
    description: "Read-only monitoring — stream health, audio, alerts, and attendee signals.",
    href: "/ops",
    badge: "Home",
    section: "monitoring",
  },
  {
    id: "public_countdown",
    title: "Public Countdown",
    description: "Attendee-facing pre-show countdown — rings, schedule copy, and live chat.",
    href: PUBLIC_COUNTDOWN_PATH,
    badge: "Attendee",
    section: "preview",
    external: true,
  },
  {
    id: "attendee_live",
    title: "Attendee Live Room",
    description: "Viewer POV live experience — verify playback, chat, and go-live transition.",
    href: EXPERIENCE_LIVE_PATH,
    badge: "Attendee",
    section: "preview",
    external: true,
  },
  {
    id: "obs_countdown",
    title: "OBS Countdown Overlay",
    description: "Horizontal stream overlay for OBS, Restream, and vMix browser sources.",
    href: `${PUBLIC_COUNTDOWN_PATH}/obs`,
    badge: "Stream",
    section: "preview",
    external: true,
  },
] as const;

export const ROLE_MODULE_ACCESS: Record<OpsTeamRole, readonly OpsHubModuleId[]> = {
  admin: [
    "countdown_editor",
    "stream_control",
    "crew_console",
    "readiness",
    "broadcast_console",
    "prayer_queue",
    "incident",
    "ops_home",
    "camera_desk",
    "public_countdown",
    "attendee_live",
    "obs_countdown",
  ],
  producer: [
    "countdown_editor",
    "stream_control",
    "crew_console",
    "readiness",
    "broadcast_console",
    "ops_home",
    "public_countdown",
    "attendee_live",
    "obs_countdown",
  ],
  broadcast_operator: ["stream_control", "broadcast_console", "ops_home"],
  prayer_team: ["prayer_queue", "ops_home"],
  camera_crew: ["camera_desk", "ops_home"],
};

const ROLE_MODULE_ACCESS_LOOKUP = ROLE_MODULE_ACCESS;

export function canAccessModule(
  role: OpsTeamRole,
  moduleId: OpsHubModuleId,
): boolean {
  return ROLE_MODULE_ACCESS_LOOKUP[role].includes(moduleId);
}

export function isOpsTeamRole(value: string | null | undefined): value is OpsTeamRole {
  return (
    value === "admin" ||
    value === "producer" ||
    value === "broadcast_operator" ||
    value === "prayer_team" ||
    value === "camera_crew"
  );
}

export function modulesForRole(
  role: OpsTeamRole,
  options?: { excludeModuleIds?: readonly OpsHubModuleId[] },
): OpsHubModule[] {
  const allowed = new Set(ROLE_MODULE_ACCESS_LOOKUP[role]);
  const excluded = new Set(options?.excludeModuleIds ?? []);
  return OPS_HUB_MODULES.filter(
    (module) => allowed.has(module.id) && !excluded.has(module.id),
  );
}

export function modulesForRoleBySection(
  role: OpsTeamRole,
  options?: { excludeModuleIds?: readonly OpsHubModuleId[] },
): Map<OpsProductionSection, OpsHubModule[]> {
  const modules = modulesForRole(role, options);
  const grouped = new Map<OpsProductionSection, OpsHubModule[]>();

  for (const module of modules) {
    const list = grouped.get(module.section) ?? [];
    list.push(module);
    grouped.set(module.section, list);
  }

  return grouped;
}

export function roleLabel(role: OpsTeamRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "producer":
      return "Producer";
    case "broadcast_operator":
      return "Broadcast Operator";
    case "prayer_team":
      return "Prayer Team";
    case "camera_crew":
      return "Camera Crew";
    default:
      return role;
  }
}
