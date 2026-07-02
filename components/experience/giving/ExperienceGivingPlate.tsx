"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import {
  MOBILE_ARTBOARD_ART_FIT,
  MOBILE_ARTBOARD_TAB_SHELL,
  MOBILE_ARTBOARD_TAB_STAGE,
  mobileArtboardStageStyle,
} from "@/lib/responsive";
import {
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_HEADER_STAGE_RATIO,
  VITAL_SEED_GIVING_MOBILE_ART_NATIVE,
} from "@/lib/vital-seed/giving-assets";

type ExperienceGivingPlateProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  children: ReactNode;
};

export default function ExperienceGivingPlate({
  profile,
  onProfileChange,
  children,
}: ExperienceGivingPlateProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const formOverlayRef = useRef<HTMLDivElement>(null);

  const syncFormPlacement = useCallback(() => {
    const stage = stageRef.current;
    const overlay = formOverlayRef.current;
    if (!stage || !overlay) return;

    const stageRect = stage.getBoundingClientRect();
    const nativeW = VITAL_SEED_GIVING_MOBILE_ART_NATIVE.width;
    const nativeH = VITAL_SEED_GIVING_MOBILE_ART_NATIVE.height;
    const scale = Math.min(stageRect.width / nativeW, stageRect.height / nativeH);
    const paintedHeightPx = nativeH * scale;
    const paintedBottomPct = (paintedHeightPx / stageRect.height) * 100;
    // Drop the form well below the header art so "Select Amount" clears the
    // SEED wordmark. Bottom stays pinned above the nav dock via CSS.
    const formTopPct = Math.min(paintedBottomPct + 9, 72);

    overlay.style.setProperty("--vital-giving-form-top", `${formTopPct}%`);
  }, []);

  useEffect(() => {
    syncFormPlacement();

    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(() => syncFormPlacement());
    observer.observe(stage);

    window.addEventListener("resize", syncFormPlacement);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncFormPlacement);
    };
  }, [syncFormPlacement]);

  return (
    <div className={`vital-giving-page ${MOBILE_ARTBOARD_TAB_SHELL}`}>
      <div
        ref={stageRef}
        className={`vital-giving-page__stage ${MOBILE_ARTBOARD_TAB_STAGE}`}
        style={
          {
            ...mobileArtboardStageStyle(),
            "--vital-giving-form-top": `${VITAL_SEED_GIVING_HEADER_STAGE_RATIO * 100 + 9}%`,
          } as CSSProperties
        }
      >
        <div className={MOBILE_ARTBOARD_ART_FIT}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={bgImgRef}
            src={VITAL_SEED_GIVING_ASSETS.mobileBackground}
            alt="Vital Seed Giving"
            width={VITAL_SEED_GIVING_MOBILE_ART_NATIVE.width}
            height={VITAL_SEED_GIVING_MOBILE_ART_NATIVE.height}
            className="vital-giving-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
            onLoad={syncFormPlacement}
          />

          <MobileArtboardTabHeader profile={profile} onProfileChange={onProfileChange} />

          <div ref={formOverlayRef} className="vital-giving-page__form-overlay">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
