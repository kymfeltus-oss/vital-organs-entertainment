"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getLiveReactionDefinition } from "@/lib/live/live-reactions";

type CustomEmojiAnimatorProps = {
  assetId: string;
  onComplete: () => void;
};

export default function CustomEmojiAnimator({ assetId, onComplete }: CustomEmojiAnimatorProps) {
  const [randomX] = useState(() => Math.floor(Math.random() * 56) + 22);
  const [driftX] = useState(() => (Math.random() > 0.5 ? 1 : -1) * (8 + Math.floor(Math.random() * 18)));
  const [useFallback, setUseFallback] = useState(false);
  const reaction = getLiveReactionDefinition(assetId);

  const animationStyle = useMemo(
    () =>
      ({
        "--emoji-start-x": `${randomX}%`,
        "--emoji-drift-x": `${driftX}px`,
      }) as CSSProperties,
    [driftX, randomX],
  );

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes live-emoji-float-up {
          0% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--emoji-drift-x, 0px)), 0, 0) scale(0.82);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--emoji-drift-x, 0px)), -min(72vh, 34rem), 0) scale(1.12);
          }
        }
        .live-emoji-float-up {
          animation: live-emoji-float-up 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
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
          left: `${randomX}%`,
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
            className="h-14 w-14 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
            onError={() => setUseFallback(true)}
          />
        )}
      </div>
    </>
  );
}
