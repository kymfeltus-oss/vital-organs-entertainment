"use client";

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import HoldingRoomCountdownOverlay from "@/components/experience/holding-room/HoldingRoomCountdownOverlay";
import HoldingRoomFellowshipChat from "@/components/experience/holding-room/HoldingRoomFellowshipChat";
import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import {
  HOLDING_ROOM_ART_NATIVE,
  HOLDING_ROOM_ASSETS,
} from "@/lib/experience/holding-room-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  MOBILE_ARTBOARD_TAB_STAGE,
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
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => setShowChat(true), { timeout: 1_500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(() => setShowChat(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      id="main-content"
      className="min-h-dvh overflow-x-hidden overflow-y-auto bg-black text-white"
    >
      <section className="mx-auto flex min-h-dvh w-full max-w-[600px] items-center justify-center bg-black">
        <div
          className={`relative w-full overflow-hidden bg-black ${MOBILE_ARTBOARD_TAB_STAGE}`}
          style={
            mobileArtboardStageStyle({
              native: HOLDING_ROOM_ART_NATIVE,
              extra: {
                height: "min(100dvh, calc(100vw * 1920 / 1080))",
                aspectRatio: "1080 / 1920",
              },
            }) as CSSProperties
          }
        >
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOLDING_ROOM_ASSETS.mobileBackground}
              alt="300 Awakening holding room"
              width={HOLDING_ROOM_ART_NATIVE.width}
              height={HOLDING_ROOM_ART_NATIVE.height}
              className="absolute inset-0 h-full w-full select-none object-contain"
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

            {showChat ? (
              <div className="absolute inset-0">
                <HoldingRoomFellowshipChat />
              </div>
            ) : null}

            <div className="absolute inset-x-0 top-0 z-30">
              <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig,
  initialCountdown,
  initialProfile,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <IgLiveChatProvider>
      <Suspense fallback={null}>
        <ExperienceHoldingRoomPageContent
          initialCountdownConfig={initialCountdownConfig}
          initialCountdown={initialCountdown}
          initialProfile={initialProfile}
        />
      </Suspense>
    </IgLiveChatProvider>
  );
}
