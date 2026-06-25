export const OPS_MODULE_ROUTES = {
  productionDashboard: "/ops/production-dashboard",
  sound: "/ops/sound",
  camera: "/ops/camera",
  countdown: "/ops/countdown",
} as const;

export type OpsProductionDashboardView = "summary" | "alerts" | "chat" | "logs";
export type OpsSoundView = "mixer" | "routing";
export type OpsCameraView = "ingest" | "matrix" | "mobile-desk";
export type OpsCountdownView = "console" | "incident" | "prayer";

export const OPS_PRODUCTION_DASHBOARD_VIEWS: readonly OpsProductionDashboardView[] = [
  "summary",
  "alerts",
  "chat",
  "logs",
];

export const OPS_SOUND_VIEWS: readonly OpsSoundView[] = ["mixer", "routing"];

export const OPS_CAMERA_VIEWS: readonly OpsCameraView[] = ["ingest", "matrix", "mobile-desk"];

export const OPS_COUNTDOWN_VIEWS: readonly OpsCountdownView[] = ["console", "incident", "prayer"];

export type OpsShellModule = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export const OPS_SHELL_MODULES: readonly OpsShellModule[] = [
  {
    id: "production_dashboard",
    label: "Dashboard",
    href: `${OPS_MODULE_ROUTES.productionDashboard}?view=summary`,
    description: "Read-only production summary",
  },
  {
    id: "sound",
    label: "Sound",
    href: `${OPS_MODULE_ROUTES.sound}?view=mixer`,
    description: "Audio meters and routing",
  },
  {
    id: "camera",
    label: "Camera",
    href: `${OPS_MODULE_ROUTES.camera}?view=ingest`,
    description: "Ingest credentials and camera matrix",
  },
  {
    id: "countdown",
    label: "Countdown",
    href: `${OPS_MODULE_ROUTES.countdown}?view=console`,
    description: "Schedule, go-live, incident, and prayer",
  },
];

export function normalizeOpsView<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

export function buildOpsModuleHref(base: string, view: string): string {
  return `${base}?view=${view}`;
}
