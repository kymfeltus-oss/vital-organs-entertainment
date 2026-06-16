"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import MusicOverlay from "@/components/music/MusicOverlay";
import { MUSIC_ARTBOARD, MUSIC_BACKGROUND_SRC } from "@/lib/music/assets";

export default function MusicPageClient() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const { width: hostWidth, height: hostHeight } = host.getBoundingClientRect();
      if (!hostWidth || !hostHeight) return;

      setScale(
        Math.min(hostWidth / MUSIC_ARTBOARD.width, hostHeight / MUSIC_ARTBOARD.height),
      );
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(host);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", updateScale);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden"
    >
      <div
        className="relative shrink-0 origin-center"
        style={{
          width: MUSIC_ARTBOARD.width,
          height: MUSIC_ARTBOARD.height,
          transform: `scale(${scale})`,
        }}
      >
        <Image
          src={MUSIC_BACKGROUND_SRC}
          alt=""
          width={MUSIC_ARTBOARD.width}
          height={MUSIC_ARTBOARD.height}
          priority
          sizes="100vw"
          className="z-0 h-full w-full object-fill"
        />
        <MusicOverlay />
      </div>
    </div>
  );
}
