"use client";

import CustomEmojiAnimator from "@/components/experience/live/CustomEmojiAnimator";

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

export default function LiveFloatingEmojiLayer({
  bursts,
  onComplete,
  variant,
}: LiveFloatingEmojiLayerProps) {
  if (bursts.length === 0) return null;

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
    </div>
  );
}
