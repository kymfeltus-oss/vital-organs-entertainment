"use client";

import { Suspense, useState, type CSSProperties } from "react";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import HoldingRoomCountdownOverlay from "@/components/experience/holding-room/HoldingRoomCountdownOverlay";
import {
  HOLDING_ROOM_ART_NATIVE,
  HOLDING_ROOM_ASSETS,
} from "@/lib/experience/holding-room-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  MOBILE_ARTBOARD_FULL_SHELL,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

type ExperienceHoldingRoomPageClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
};

function ExperienceHoldingRoomPageContent({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
}: ExperienceHoldingRoomPageClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <main id="main-content" className="live-holding-shell bg-black text-white">
      <div className={`holding-room-page ${MOBILE_ARTBOARD_FULL_SHELL}`}>
        <div
          className="holding-room-page__stage"
          style={
            mobileArtboardStageStyle({ native: HOLDING_ROOM_ART_NATIVE }) as CSSProperties
          }
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
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />

            <div className="absolute inset-0">
              <HoldingRoomCountdownOverlay
                initialCountdownConfig={initialCountdownConfig}
                initialCountdown={initialCountdown}
              />
            </div>

            <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceHoldingRoomPageContent
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
      />
    </Suspense>
  );
}
