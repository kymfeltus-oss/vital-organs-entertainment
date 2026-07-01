"use client";

import { Suspense, useState, type CSSProperties } from "react";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import HoldingRoomCountdownOverlay from "@/components/experience/holding-room/HoldingRoomCountdownOverlay";
import {
  HOLDING_ROOM_ART_NATIVE,
  HOLDING_ROOM_ASSETS,
} from "@/lib/experience/holding-room-assets";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";

/** Band across countdown circles — reused for status messages (ended, connecting). */
const HOLDING_ROOM_STATUS_BAND: CSSProperties = {
  position: "absolute",
  left: "8%",
  top: "42.5%",
  width: "84%",
  height: "14%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

type ExperienceHoldingRoomPageClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
  attendeeUiPhase?: AttendeeUiPhase;
  showClock?: boolean;
  statusMessage?: string;
};

function ExperienceHoldingRoomPageContent({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
  attendeeUiPhase = "pre_show",
  showClock = true,
  statusMessage,
}: {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
  initialProfile: AttendeeProfileSnapshot;
  attendeeUiPhase?: AttendeeUiPhase;
  showClock?: boolean;
  statusMessage?: string;
}) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className={`holding-room-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
      <div
        className={`holding-room-page__stage ${MOBILE_ARTBOARD_TAB_STAGE}`}
        style={mobileArtboardStageStyle({ native: HOLDING_ROOM_ART_NATIVE }) as CSSProperties}
      >
        <div className={`${MOBILE_ARTBOARD_ART_FIT} holding-room-page__art-fit`}>
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
          {showClock ? (
            <HoldingRoomCountdownOverlay
              initialCountdownConfig={initialCountdownConfig}
              initialCountdown={initialCountdown}
              attendeeUiPhase={attendeeUiPhase}
            />
          ) : statusMessage ? (
            <div
              className="holding-room-countdown"
              aria-live="polite"
              aria-label={statusMessage}
            >
              <div
                className="holding-room-countdown__starting-soon"
                style={HOLDING_ROOM_STATUS_BAND}
              >
                <p className="holding-room-countdown__starting-soon-text font-ui">{statusMessage}</p>
              </div>
            </div>
          ) : null}
          <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />
        </div>
      </div>
    </div>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
  attendeeUiPhase,
  showClock,
  statusMessage,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceHoldingRoomPageContent
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
        initialProfile={initialProfile}
        attendeeUiPhase={attendeeUiPhase}
        showClock={showClock}
        statusMessage={statusMessage}
      />
    </Suspense>
  );
}
