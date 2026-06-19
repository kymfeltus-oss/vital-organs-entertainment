"use client";

import type { CSSProperties } from "react";
import MusicOverlay from "@/components/music/MusicOverlay";
import { MUSIC_ASSETS, MUSIC_MOBILE_ART } from "@/lib/music/assets";

export default function MusicPageClient() {
  return (
    <div className="music-page">
      <div
        className="music-page__stage"
        style={
          {
            "--music-art-w": MUSIC_MOBILE_ART.width,
            "--music-art-h": MUSIC_MOBILE_ART.height,
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MUSIC_ASSETS.mobileBackground}
          alt="Hallelujah Anyhow — Ian Craig and 300 Awakening"
          width={MUSIC_MOBILE_ART.width}
          height={MUSIC_MOBILE_ART.height}
          className="music-page__bg"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <MusicOverlay />
      </div>
    </div>
  );
}
