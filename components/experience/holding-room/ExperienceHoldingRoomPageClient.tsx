"use client";

import { Suspense, useState, type CSSProperties } from "react";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import {
  HOLDING_ROOM_ART_NATIVE,
  HOLDING_ROOM_ASSETS,
} from "@/lib/experience/holding-room-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { mobileArtboardStageStyle } from "@/lib/responsive";

type ExperienceHoldingRoomPageClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialProfile: AttendeeProfileSnapshot;
};

function ExperienceHoldingRoomPageContent({
  initialProfile,
}: {
  initialProfile: AttendeeProfileSnapshot;
}) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className="holding-room-page mobile-artboard-tab-shell">
      <div
        className="holding-room-page__stage mobile-artboard-tab-shell__stage"
        style={mobileArtboardStageStyle({ native: HOLDING_ROOM_ART_NATIVE }) as CSSProperties}
      >
        <div className="mobile-artboard-art-fit holding-room-page__art-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOLDING_ROOM_ASSETS.mobileBackground}
            alt="300 Awakening holding room"
            width={HOLDING_ROOM_ART_NATIVE.width}
            height={HOLDING_ROOM_ART_NATIVE.height}
            className="holding-room-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />
        </div>
      </div>
    </div>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig: _initialCountdownConfig,
  initialProfile,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceHoldingRoomPageContent initialProfile={initialProfile} />
    </Suspense>
  );
}
