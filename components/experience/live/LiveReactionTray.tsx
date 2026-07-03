"use client";

import { useState } from "react";
import {
  LIVE_REACTION_TRAY,
  type LiveReactionDefinition,
} from "@/lib/live/live-reactions";

type LiveReactionTrayProps = {
  variant: "mobile-dock" | "desktop-grid";
  onReaction: (assetId: string) => void;
};

function ReactionVisual({
  reaction,
  size,
}: {
  reaction: LiveReactionDefinition;
  size: "mobile" | "desktop";
}) {
  const [useFallback, setUseFallback] = useState(false);
  const imageClass =
    size === "mobile" ? "h-8 w-8 object-contain" : "h-10 w-10 object-contain";
  const emojiClass =
    size === "mobile" ? "text-base leading-none" : "text-lg leading-none";

  if (useFallback || !reaction.imageSrc) {
    return (
      <span className={emojiClass} aria-hidden="true">
        {reaction.emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={reaction.imageSrc}
      alt=""
      className={imageClass}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
    />
  );
}

function MobileReactionButton({
  reaction,
  onReaction,
}: {
  reaction: LiveReactionDefinition;
  onReaction: (assetId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onReaction(reaction.assetId)}
      aria-label={reaction.accessibilityLabel ?? reaction.label}
      className="touch-target flex h-11 w-11 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-white transition hover:border-brand-blue/35 hover:bg-brand-blue/10"
    >
      <ReactionVisual reaction={reaction} size="mobile" />
    </button>
  );
}

function DesktopReactionButton({
  reaction,
  onReaction,
}: {
  reaction: LiveReactionDefinition;
  onReaction: (assetId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onReaction(reaction.assetId)}
      aria-label={reaction.accessibilityLabel ?? reaction.label}
      className="touch-target inline-flex min-h-11 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white transition hover:border-brand-blue/40 hover:bg-brand-blue/10"
    >
      <ReactionVisual reaction={reaction} size="desktop" />
      <span className="mt-1 text-[0.55rem] font-normal normal-case tracking-normal text-brand-muted">
        {reaction.label}
      </span>
    </button>
  );
}

export default function LiveReactionTray({ variant, onReaction }: LiveReactionTrayProps) {
  if (variant === "mobile-dock") {
    return (
      <>
        {LIVE_REACTION_TRAY.map((reaction) => (
          <MobileReactionButton
            key={reaction.assetId}
            reaction={reaction}
            onReaction={onReaction}
          />
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
      {LIVE_REACTION_TRAY.map((reaction) => (
        <DesktopReactionButton
          key={reaction.assetId}
          reaction={reaction}
          onReaction={onReaction}
        />
      ))}
    </div>
  );
}
