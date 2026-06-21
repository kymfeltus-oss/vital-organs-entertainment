"use client";

import Link from "next/link";
import { AWAKENING_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import {
  DASHBOARD_STORY_ART,
  DASHBOARD_STORY_WATCH_HIT,
  DASHBOARD_STORY_WELCOME_MASK,
  DASHBOARD_STORY_WELCOME_STACK,
  dashboardStoryRectStyle,
} from "@/lib/experience/dashboard-story-slots";

type ExperienceDashboardStoryCardProps = {
  headerDisplayName: string;
};

/** Ian Craig journey poster — dynamic welcome name + isolated Watch Now hit target. */
export default function ExperienceDashboardStoryCard({
  headerDisplayName,
}: ExperienceDashboardStoryCardProps) {
  const displayName = headerDisplayName?.trim() || "GUEST";

  return (
    <div className="experience-dashboard-story-card dashboard-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={AWAKENING_ASSETS.ianCraigStoryPoster}
        alt=""
        width={DASHBOARD_STORY_ART.width}
        height={DASHBOARD_STORY_ART.height}
        className="experience-dashboard-story-card__poster"
        loading="eager"
        decoding="async"
        draggable={false}
      />

      <div
        className="experience-dashboard-story-card__welcome-mask"
        style={dashboardStoryRectStyle(DASHBOARD_STORY_WELCOME_MASK)}
        aria-hidden
      />

      <div
        className="experience-dashboard-story-card__welcome"
        style={dashboardStoryRectStyle(DASHBOARD_STORY_WELCOME_STACK)}
        aria-label={`Welcome ${displayName}`}
      >
        <p className="experience-dashboard-welcome-label">Welcome</p>
        <p className="experience-dashboard-welcome-name">{displayName}</p>
      </div>

      <Link
        href={AWAKENING_ASSETS.routes.watchStory}
        className="experience-dashboard-story-card__watch touch-target"
        style={dashboardStoryRectStyle(DASHBOARD_STORY_WATCH_HIT)}
        aria-label="Watch Ian Craig's healing journey"
      />
    </div>
  );
}
