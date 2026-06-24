/** Production dashboard menu grouping. */
export type OpsProductionSection = "setup" | "live" | "monitoring" | "preview";

export const OPS_PRODUCTION_SECTION_LABELS: Record<
  OpsProductionSection,
  { title: string; description: string }
> = {
  setup: {
    title: "Pre-Show Setup",
    description: "Configure countdown, readiness, and broadcast ingest before doors open.",
  },
  live: {
    title: "Live Operations",
    description: "Run the show — stream control, crew console, camera, and prayer flow.",
  },
  monitoring: {
    title: "Monitoring & Audit",
    description: "Incident history and post-show diagnostics.",
  },
  preview: {
    title: "Attendee & QA Views",
    description: "Open what attendees see — public countdown, live room, and OBS overlay.",
  },
};

export const OPS_PRODUCTION_SECTION_ORDER: readonly OpsProductionSection[] = [
  "setup",
  "live",
  "monitoring",
  "preview",
];
