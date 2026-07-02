"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getLiveReactionDefinition } from "@/lib/live/live-reactions";

type CustomEmojiAnimatorProps = {
  assetId: string;
  onComplete: () => void;
};

const FLOAT_DURATION_MS = 2600;

export default function CustomEmojiAnimator({ assetId, onComplete }: CustomEmojiAnimatorProps) {
  /** Narrow band along the right edge so bursts don't stack on one pixel. */
  const [rightInset] = useState(() => 10 + Math.floor(Math.random() * 36));
  const [driftLeft] = useState(() => 6 + Math.floor(Math.random() * 18));
  const [useFallback, setUseFallback] = useState(false);
  const reaction = getLiveReactionDefinition(assetId);
  const isFullBodySticker =
    assetId === "praise_break" || assetId === "praise_break_man";

  const animationStyle = useMemo(
    () =>
      ({
        "--emoji-drift-left": `${driftLeft}px`,
      }) as CSSProperties,
    [driftLeft],
  );

  useEffect(() => {
    const timer = window.setTimeout(onComplete, FLOAT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes live-emoji-float-up {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.82);
          }
          10% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(
              calc(-1 * var(--emoji-drift-left, 0px)),
              calc(-100vh + var(--live-mobile-dock-h, 4.5rem) + 5rem),
              0
            ) scale(1.06);
          }
        }
        .live-emoji-float-up {
          animation: live-emoji-float-up 2.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .live-emoji-float-up {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
      <div
        className="live-emoji-float-up pointer-events-none absolute z-[1] select-none"
        style={{
          ...animationStyle,
          right: `calc(${rightInset}px + env(safe-area-inset-right, 0px))`,
          left: "auto",
          bottom: "calc(var(--live-mobile-dock-h, 4.5rem) + 0.5rem)",
        }}
        aria-hidden="true"
      >
        {useFallback || !reaction.imageSrc ? (
          <span className="block text-[2.75rem] leading-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]">
            {reaction.emoji}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reaction.imageSrc}
            alt=""
            className={`object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${
              isFullBodySticker ? "h-24 w-24" : "h-14 w-14"
            }`}
            onError={() => setUseFallback(true)}
          />
        )}
      </div>
    </>
  );
}
