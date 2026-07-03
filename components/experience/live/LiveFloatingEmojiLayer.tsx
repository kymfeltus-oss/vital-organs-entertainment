"use client";

import { useEffect, useState } from "react";
import CustomEmojiAnimator from "@/components/experience/live/CustomEmojiAnimator";
import type { LiveReactionAssetId } from "@/lib/live/live-reactions";

type FloatingEmojiBurst = {
  id: string;
  assetId: string;
};

type LiveFloatingEmojiLayerProps = {
  bursts: FloatingEmojiBurst[];
  onComplete: (id: string) => void;
  /** mobile = fixed full-screen layer above chat; desktop = video stage only */
  variant: "mobile" | "desktop";
};

const AMBIENT_EMOJI_ASSETS: readonly LiveReactionAssetId[] = [
  "heart_reaction",
  "seed_fire",
  "hallelujah",
  "awakening_glow",
];
const AMBIENT_EMOJI_MIN_DELAY_MS = 3_000;
const AMBIENT_EMOJI_MAX_DELAY_MS = 5_000;

function nextAmbientEmojiDelayMs(): number {
  return (
    AMBIENT_EMOJI_MIN_DELAY_MS +
    Math.floor(
      Math.random() * (AMBIENT_EMOJI_MAX_DELAY_MS - AMBIENT_EMOJI_MIN_DELAY_MS + 1),
    )
  );
}

export default function LiveFloatingEmojiLayer({
  bursts,
  onComplete,
  variant,
}: LiveFloatingEmojiLayerProps) {
  const [ambientBursts, setAmbientBursts] = useState<FloatingEmojiBurst[]>([]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;

    const scheduleNext = (delayMs: number) => {
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        const assetId =
          AMBIENT_EMOJI_ASSETS[Math.floor(Math.random() * AMBIENT_EMOJI_ASSETS.length)]!;
        const burst: FloatingEmojiBurst = {
          id: `ambient-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          assetId,
        };
        setAmbientBursts((current) => [...current, burst].slice(-4));
        scheduleNext(nextAmbientEmojiDelayMs());
      }, delayMs);
    };

    scheduleNext(1_000 + Math.floor(Math.random() * 1_000));
    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [variant]);

  if (bursts.length === 0 && ambientBursts.length === 0) return null;

  const layerClass =
    variant === "mobile"
      ? "pointer-events-none fixed inset-0 z-[38] overflow-hidden lg:hidden"
      : "pointer-events-none absolute inset-0 z-20 hidden overflow-hidden lg:block";

  return (
    <div className={layerClass} aria-hidden="true">
      {bursts.map((burst) => (
        <CustomEmojiAnimator
          key={burst.id}
          assetId={burst.assetId}
          onComplete={() => onComplete(burst.id)}
        />
      ))}
      {ambientBursts.map((burst) => (
        <CustomEmojiAnimator
          key={burst.id}
          assetId={burst.assetId}
          onComplete={() =>
            setAmbientBursts((current) => current.filter((item) => item.id !== burst.id))
          }
        />
      ))}
    </div>
  );
}
