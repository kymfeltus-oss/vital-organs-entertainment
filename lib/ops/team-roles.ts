export const OPS_TEAM_ROLE_STORAGE_KEY = "ops_team_role_mock";

export type OpsTeamRole =
  | "admin"
  | "producer"
  | "broadcast_operator"
  | "prayer_team";

export type OpsHubModuleId =
  | "crew_console"
  | "readiness"
  | "broadcast_console"
  | "prayer_queue"
  | "incident"
  | "ops_home";

export type OpsHubModule = {
  id: OpsHubModuleId;
  title: string;
  description: string;
  href: string;
  badge?: string;
};

export const OPS_HUB_MODULES: readonly OpsHubModule[] = [
  {
    id: "crew_console",
    title: "Crew Console",
    description: "Centralized production console — preview, readiness, and go-live review.",
    href: "/ops/live-hub/console",
    badge: "Live Hub",
  },
  {
    id: "readiness",
    title: "Show Readiness",
    description: "Pre-show checklist matrix and interlock status for producers.",
    href: "/ops/live-hub/readiness",
    badge: "Matrix",
  },
  {
    id: "broadcast_console",
    title: "Broadcast Desk",
    description: "Sacred stream path — PARABLE broadcast console and stream health.",
    href: "/dashboard/broadcast",
    badge: "Stream",
  },
  {
    id: "prayer_queue",
    title: "Prayer Queue",
    description: "Filtered prayer team view for live moderation and response flow.",
    href: "/ops/live-hub/prayer-queue",
    badge: "Prayer",
  },
  {
    id: "incident",
    title: "Incident Log",
    description: "Live system errors, audits, and PARABLE safety event history.",
    href: "/ops/live-hub/incident",
    badge: "Audit",
  },
  {
    id: "ops_home",
    title: "Ops Command",
    description: "Show-day metrics snapshot and platform-wide ops overview.",
    href: "/ops",
    badge: "Overview",
  },
] as const;

const ROLE_MODULE_ACCESS: Record<OpsTeamRole, readonly OpsHubModuleId[]> = {
  admin: OPS_HUB_MODULES.map((module) => module.id),
  producer: ["crew_console", "readiness"],
  broadcast_operator: ["broadcast_console"],
  prayer_team: ["prayer_queue"],
};

export function canAccessModule(
  role: OpsTeamRole,
  moduleId: OpsHubModuleId,
): boolean {
  return ROLE_MODULE_ACCESS[role].includes(moduleId);
}

export function isOpsTeamRole(value: string | null | undefined): value is OpsTeamRole {
  return (
    value === "admin" ||
    value === "producer" ||
    value === "broadcast_operator" ||
    value === "prayer_team"
  );
}

export function modulesForRole(role: OpsTeamRole): OpsHubModule[] {
  const allowed = new Set(ROLE_MODULE_ACCESS[role]);
  return OPS_HUB_MODULES.filter((module) => allowed.has(module.id));
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
    default:
      return role;
  }
}
