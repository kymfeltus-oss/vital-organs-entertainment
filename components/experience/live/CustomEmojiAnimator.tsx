"use client";

import { useEffect, useState } from "react";
import { getLiveReactionDefinition } from "@/lib/live/live-reactions";

type CustomEmojiAnimatorProps = {
  assetId: string;
  onComplete: () => void;
};

export default function CustomEmojiAnimator({ assetId, onComplete }: CustomEmojiAnimatorProps) {
  const [randomX] = useState(() => Math.floor(Math.random() * 60) + 20);
  const [useFallback, setUseFallback] = useState(false);
  const reaction = getLiveReactionDefinition(assetId);

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (useFallback || !reaction.imageSrc) {
    return (
      <>
        <style>{`
          @keyframes animate-float-up {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-140%) scale(1.08); }
          }
          .animate-float-up {
            animation: animate-float-up 2s ease-out forwards;
            will-change: transform, opacity;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-float-up { animation: none; opacity: 0; }
          }
        `}</style>
        <span
          className="animate-float-up pointer-events-none absolute bottom-0 select-none text-4xl"
          style={{ left: `${randomX}%` }}
          aria-hidden="true"
        >
          {reaction.emoji}
        </span>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes animate-float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-140%) scale(1.08); }
        }
        .animate-float-up {
          animation: animate-float-up 2s ease-out forwards;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-float-up { animation: none; opacity: 0; }
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reaction.imageSrc}
        alt=""
        className="animate-float-up pointer-events-none absolute bottom-0 h-12 w-12 object-contain"
        style={{ left: `${randomX}%` }}
        onError={() => setUseFallback(true)}
      />
    </>
  );
}
