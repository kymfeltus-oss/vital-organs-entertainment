"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MusicAppleMusicHeader from "@/components/music/MusicAppleMusicHeader";
import MusicOverlay from "@/components/music/MusicOverlay";
import {
  MUSIC_ASSETS,
  MUSIC_DESKTOP_ART,
  MUSIC_MOBILE_ART,
  type MusicOverlayVariant,
} from "@/lib/music/assets";

type ScaledMusicArtboardProps = {
  artWidth: number;
  artHeight: number;
  backgroundSrc: string;
  variant: MusicOverlayVariant;
  visibleClassName: string;
};

function ScaledMusicArtboard({
  artWidth,
  artHeight,
  backgroundSrc,
  variant,
  visibleClassName,
}: ScaledMusicArtboardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const { width: hostWidth, height: hostHeight } = host.getBoundingClientRect();
      if (!hostWidth || !hostHeight) return;

      setScale(Math.min(hostWidth / artWidth, hostHeight / artHeight));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(host);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [artWidth, artHeight]);

  return (
    <div
      ref={hostRef}
      className={`relative flex w-full flex-1 items-center justify-center overflow-hidden ${visibleClassName}`}
    >
      <div
        className="relative shrink-0 origin-center"
        style={{
          width: artWidth,
          height: artHeight,
          transform: `scale(${scale})`,
        }}
      >
        <Image
          src={backgroundSrc}
          alt=""
          width={artWidth}
          height={artHeight}
          priority
          sizes="100vw"
          className="z-0 h-full w-full object-fill"
        />
        <MusicAppleMusicHeader variant={variant} />
        <MusicOverlay variant={variant} />
      </div>
    </div>
  );
}

export default function MusicPageClient() {
  return (
    <>
      <ScaledMusicArtboard
        artWidth={MUSIC_DESKTOP_ART.width}
        artHeight={MUSIC_DESKTOP_ART.height}
        backgroundSrc={MUSIC_ASSETS.desktopBackground}
        variant="desktop"
        visibleClassName="hidden flex-1 lg:flex"
      />
      <ScaledMusicArtboard
        artWidth={MUSIC_MOBILE_ART.width}
        artHeight={MUSIC_MOBILE_ART.height}
        backgroundSrc={MUSIC_ASSETS.mobileBackground}
        variant="mobile"
        visibleClassName="flex flex-1 lg:hidden"
      />
    </>
  );
}
