"use client";

import dynamic from "next/dynamic";
import FeatureErrorBoundary from "@/components/parable/FeatureErrorBoundary";
import type { IgLiveSheetAction } from "@/lib/experience/ig-live-config";

const ExperiencePrayerPanel = dynamic(
  () => import("@/components/experience/live/ExperiencePrayerPanel"),
  { ssr: false },
);

const ExperienceGivingPanel = dynamic(
  () => import("@/components/experience/live/ExperienceGivingPanel"),
  { ssr: false },
);

const EventProgramPanel = dynamic(
  () => import("@/components/experience/live/EventProgramPanel"),
  { ssr: false },
);

const LivePollPanel = dynamic(
  () => import("@/components/experience/live/LivePollPanel"),
  { ssr: false },
);

type IgLiveActionPanelsProps = {
  action: Exclude<IgLiveSheetAction, null | "more">;
};

export default function IgLiveActionPanels({ action }: IgLiveActionPanelsProps) {
  if (action === "prayer") {
    return (
      <FeatureErrorBoundary featureLabel="Prayer">
        <ExperiencePrayerPanel />
      </FeatureErrorBoundary>
    );
  }

  if (action === "give") {
    return (
      <FeatureErrorBoundary featureLabel="Giving">
        <ExperienceGivingPanel />
      </FeatureErrorBoundary>
    );
  }

  if (action === "program") {
    return (
      <FeatureErrorBoundary featureLabel="Event program">
        <EventProgramPanel />
      </FeatureErrorBoundary>
    );
  }

  return (
    <FeatureErrorBoundary featureLabel="Polls">
      <LivePollPanel />
    </FeatureErrorBoundary>
  );
}
