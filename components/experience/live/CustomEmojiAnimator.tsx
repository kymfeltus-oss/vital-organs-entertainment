"use client";

import { useEffect, useState } from "react";

const EMOJI_ASSET_MAP: Record<string, string> = {
  seed_fire: "/images/emojis/seed-fire.png",
  awakening_glow: "/images/emojis/awakening-glow.png",
};

type CustomEmojiAnimatorProps = {
  assetId: string;
  onComplete: () => void;
};

export default function CustomEmojiAnimator({ assetId, onComplete }: CustomEmojiAnimatorProps) {
  const [randomX] = useState(() => Math.floor(Math.random() * 60) + 20);

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const imageSrc = EMOJI_ASSET_MAP[assetId] || EMOJI_ASSET_MAP.seed_fire;

  return (
    <>
      <style>{`
        @keyframes animate-float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-140%) scale(1.08);
          }
        }
        .animate-float-up {
          animation: animate-float-up 2s ease-out forwards;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float-up {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="custom reaction"
        className="animate-float-up pointer-events-none absolute bottom-0 h-12 w-12 object-contain"
        style={{ left: `${randomX}%` }}
      />
    </>
  );
}
