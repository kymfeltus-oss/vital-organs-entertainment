"use client";

import { Suspense, type CSSProperties } from "react";
import HoldingRoomContent from "@/components/experience/holding-room/HoldingRoomContent";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import {
  HOLDING_ROOM_ARTBOARD,
  HOLDING_ROOM_ASSETS,
  HOLDING_ROOM_SAFE_AREA,
} from "@/lib/experience/holding-room-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

type ExperienceHoldingRoomPageClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

function ExperienceHoldingRoomPageContent({
  initialCountdownConfig,
}: ExperienceHoldingRoomPageClientProps) {
  const { config, countdown, eventPhase, isLoading, showTimer } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });

  const showCountdown =
    eventPhase === "waiting" && shouldShowCountdownTimer(config, isLoading) && showTimer;

  return (
    <div className="holding-room-page">
      <div
        className="holding-room-page__stage"
        style={
          {
            "--holding-art-w": HOLDING_ROOM_ARTBOARD.width,
            "--holding-art-h": HOLDING_ROOM_ARTBOARD.height,
            "--holding-safe-top": HOLDING_ROOM_SAFE_AREA.top,
            "--holding-safe-right": HOLDING_ROOM_SAFE_AREA.right,
            "--holding-safe-bottom": HOLDING_ROOM_SAFE_AREA.bottom,
            "--holding-safe-left": HOLDING_ROOM_SAFE_AREA.left,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOLDING_ROOM_ASSETS.mobileBackground}
          alt="300 Awakening holding room"
          width={HOLDING_ROOM_ARTBOARD.width}
          height={HOLDING_ROOM_ARTBOARD.height}
          className="holding-room-page__bg"
          loading="eager"
          decoding="async"
          draggable={false}
        />

        <HoldingRoomContent countdown={countdown} showCountdown={showCountdown} />
      </div>
    </div>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceHoldingRoomPageContent initialCountdownConfig={initialCountdownConfig} />
    </Suspense>
  );
}
