"use client";

import { Suspense, type CSSProperties } from "react";
import {
  HOLDING_ROOM_ART_NATIVE,
  HOLDING_ROOM_ASSETS,
} from "@/lib/experience/holding-room-assets";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { mobileArtboardStageStyle } from "@/lib/responsive";

type ExperienceHoldingRoomPageClientProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

function ExperienceHoldingRoomPageContent() {
  return (
    <div className="holding-room-page pt-safe pb-safe">
      <div
        className="holding-room-page__stage"
        style={mobileArtboardStageStyle({ native: HOLDING_ROOM_ART_NATIVE }) as CSSProperties}
      >
        <div className="mobile-artboard-art-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOLDING_ROOM_ASSETS.mobileBackground}
            alt="300 Awakening holding room"
            width={HOLDING_ROOM_ART_NATIVE.width}
            height={HOLDING_ROOM_ART_NATIVE.height}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

export default function ExperienceHoldingRoomPageClient({
  initialCountdownConfig: _initialCountdownConfig,
}: ExperienceHoldingRoomPageClientProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceHoldingRoomPageContent />
    </Suspense>
  );
}
