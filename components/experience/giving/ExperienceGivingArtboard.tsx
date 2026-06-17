"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

type ExperienceGivingArtboardProps = {
  artWidth: number;
  artHeight: number;
  backgroundSrc: string;
  visibleClassName: string;
  scaleMode?: "contain" | "cover";
  children: ReactNode;
};

export default function ExperienceGivingArtboard({
  artWidth,
  artHeight,
  backgroundSrc,
  visibleClassName,
  scaleMode = "contain",
  children,
}: ExperienceGivingArtboardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateScale = () => {
      const { width: hostWidth, height: hostHeight } = host.getBoundingClientRect();
      if (!hostWidth || !hostHeight) return;

      const widthScale = hostWidth / artWidth;
      const heightScale = hostHeight / artHeight;
      setScale(scaleMode === "cover" ? Math.max(widthScale, heightScale) : Math.min(widthScale, heightScale));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(host);
    window.addEventListener("orientationchange", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [artWidth, artHeight, scaleMode]);

  return (
    <div
      ref={hostRef}
      className={`relative flex w-full flex-1 items-start justify-center overflow-hidden ${visibleClassName}`}
    >
      <div
        className="relative shrink-0 origin-top"
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
          className="z-0 block h-full w-full object-contain"
        />
        {children}
      </div>
    </div>
  );
}
