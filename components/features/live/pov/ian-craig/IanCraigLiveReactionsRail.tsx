"use client";

import { Heart } from "lucide-react";
import FloatingLiveReactions from "@/components/features/live/FloatingLiveReactions";
import { formatPovViewerCount } from "@/lib/features/live/live-pov-mock";

type IanCraigLiveReactionsRailProps = {
  reactionTotal: number;
  onSpawnHeart: () => void;
  isSendingHeart?: boolean;
};

export default function IanCraigLiveReactionsRail({
  reactionTotal,
  onSpawnHeart,
  isSendingHeart = false,
}: IanCraigLiveReactionsRailProps) {
  return (
    <>
      <FloatingLiveReactions />

      <button
        type="button"
        onClick={onSpawnHeart}
        disabled={isSendingHeart}
        className="ian-craig-live-reactions-heart pointer-events-auto absolute bottom-[calc(8.25rem+env(safe-area-inset-bottom))] right-[clamp(0.75rem,3vw,1.25rem)] z-30 touch-target flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-full border border-brand-pink/40 bg-black/45 px-3 py-2 text-brand-pink backdrop-blur-md shadow-[0_0_24px_rgba(255,47,175,0.3)] transition hover:bg-brand-pink/10 disabled:opacity-50 lg:bottom-[calc(7rem+env(safe-area-inset-bottom))]"
        aria-label="Send heart reaction"
      >
        <Heart className="h-5 w-5 fill-brand-pink" aria-hidden="true" />
        <span className="font-ui text-[0.58rem] font-bold tabular-nums">
          {formatPovViewerCount(reactionTotal)}
        </span>
      </button>
    </>
  );
}
