"use client";

import Link from "next/link";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";
import { HUB_SPEC_COLORS, HUB_SPEC_GLOWS, hubSpecClasses } from "@/lib/experience/hub-design-tokens";

type ExperienceHubSkylineCalloutProps = {
  payload: ExperienceHubPayload;
};

export default function ExperienceHubSkylineCallout({
  payload,
}: ExperienceHubSkylineCalloutProps) {
  const { skyline, isStreamLive, liveSkylineHeadline, liveSkylineSubhead } = payload;
  const liveRoomHref = isStreamLive ? "/experience/live" : undefined;

  const livePillClassName = `inline-flex min-h-8 items-center justify-center rounded-full border bg-[#FF007F18] px-4 py-1 ${hubSpecClasses.label} text-[0.58rem] tracking-[0.18em] animate-pulse`;

  const headline = liveSkylineHeadline || skyline.headline;
  const subhead = liveSkylineSubhead || skyline.subhead;

  const livePill = liveRoomHref ? (
    <Link
      href={liveRoomHref}
      className={livePillClassName}
      style={{
        borderColor: `${HUB_SPEC_COLORS.pink}99`,
        color: HUB_SPEC_COLORS.pink,
        boxShadow: HUB_SPEC_GLOWS.pink,
      }}
    >
      {skyline.livePillLabel}
    </Link>
  ) : (
    <p
      className={livePillClassName}
      style={{
        borderColor: `${HUB_SPEC_COLORS.pink}99`,
        color: HUB_SPEC_COLORS.pink,
        boxShadow: HUB_SPEC_GLOWS.pink,
      }}
    >
      {skyline.livePillLabel}
    </p>
  );

  return (
    <section className="relative mt-[clamp(1rem,3vw,1.75rem)] flex flex-col items-center gap-3 text-center">
      {livePill}

      <h1
        className={`${hubSpecClasses.headline} max-w-[min(100%,46rem)] text-[clamp(2rem,8vw,3.75rem)] leading-[0.92] tracking-[0.1em]`}
      >
        {headline}
      </h1>
      <p
        className={`max-w-[min(100%,38rem)] ${hubSpecClasses.body} text-[0.68rem] font-semibold uppercase tracking-[0.22em]`}
      >
        {subhead}
      </p>
    </section>
  );
}
