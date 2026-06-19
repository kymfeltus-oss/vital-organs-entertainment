"use client";

import type { CSSProperties } from "react";
import MusicOverlay from "@/components/music/MusicOverlay";
import { MUSIC_ASSETS, MUSIC_MOBILE_ART, MUSIC_MOBILE_ART_NATIVE } from "@/lib/music/assets";
import { mobileArtboardStageStyle } from "@/lib/responsive";

export default function MusicPageClient() {
  return (
    <div className="music-page">
      <div
        className="music-page__stage"
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
          <MusicOverlay />
        </div>
      </div>
    </div>
  );
}
