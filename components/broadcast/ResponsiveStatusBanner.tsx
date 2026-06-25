"use client";

type ResponsiveStatusBannerProps = {
  isLive: boolean;
};

export default function ResponsiveStatusBanner({ isLive }: ResponsiveStatusBannerProps) {
  if (isLive) {
    return (
      <div
        className="border-2 border-brand-pink bg-brand-pink/15 py-2.5 text-center font-ui text-xs font-bold uppercase tracking-[0.22em] text-brand-pink motion-safe:animate-pulse"
        role="status"
      >
        🔴 Stream: Live
      </div>
    );
  }

  return (
    <div
      className="border-2 border-brand-pink bg-brand-purple/25 py-2.5 text-center font-ui text-xs font-bold uppercase tracking-[0.22em] text-purple-200"
      role="status"
    >
      ⏳ Rehearsal Standby
    </div>
  );
}
