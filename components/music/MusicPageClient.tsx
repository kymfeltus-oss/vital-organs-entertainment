"use client";

import { useState, type CSSProperties } from "react";
import MusicOverlay from "@/components/music/MusicOverlay";
import MobileArtboardTabHeader from "@/components/navigation/MobileArtboardTabHeader";
import { MUSIC_ASSETS, MUSIC_MOBILE_ART_NATIVE } from "@/lib/music/assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { mobileArtboardStageStyle } from "@/lib/responsive";

type MusicPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function MusicPageClient({ initialProfile }: MusicPageClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className="music-page mobile-artboard-tab-shell">
      <div
        className="music-page__stage mobile-artboard-tab-shell__stage"
        style={mobileArtboardStageStyle({ native: MUSIC_MOBILE_ART_NATIVE }) as CSSProperties}
      >
        <div className="mobile-artboard-art-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MUSIC_ASSETS.mobileBackground}
            alt="Hallelujah Anyhow — Ian Craig and 300 Awakening"
            width={MUSIC_MOBILE_ART_NATIVE.width}
            height={MUSIC_MOBILE_ART_NATIVE.height}
            className="music-page__bg"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <MobileArtboardTabHeader profile={profile} onProfileChange={setProfile} />
          <MusicOverlay />
        </div>
      </div>
    </div>
  );
}
