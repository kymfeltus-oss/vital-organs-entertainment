"use client";

import { Heart, MessageCircle, MoreHorizontal, Sprout } from "lucide-react";
import { useLiveStreamReactions } from "@/lib/experience/LiveStreamReactionsContext";

type IgLiveActionRailProps = {
  onFocusComment: () => void;
  onOpenGive: () => void;
  onOpenMore: () => void;
};

export default function IgLiveActionRail({
  onFocusComment,
  onOpenGive,
  onOpenMore,
}: IgLiveActionRailProps) {
  const { enabled, isSending, sendReaction } = useLiveStreamReactions();

  const handleHeart = () => {
    if (!enabled || isSending) return;
    void sendReaction("heart");
  };

  const items = [
    {
      key: "heart",
      label: "React with heart",
      icon: Heart,
      onClick: handleHeart,
      className: "text-brand-pink",
    },
    {
      key: "comment",
      label: "Comment",
      icon: MessageCircle,
      onClick: onFocusComment,
      className: "text-white",
    },
    {
      key: "seed",
      label: "Give seeds",
      icon: Sprout,
      onClick: onOpenGive,
      className: "text-emerald-400",
    },
    {
      key: "more",
      label: "More actions",
      icon: MoreHorizontal,
      onClick: onOpenMore,
      className: "text-white",
    },
  ] as const;

  return (
    <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[25] flex flex-col items-center gap-3 md:bottom-28 md:right-5">
      {items.map(({ key, label, icon: Icon, onClick, className }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className="touch-target flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
          aria-label={label}
        >
          <Icon className={`h-5 w-5 ${className}`} aria-hidden="true" strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
