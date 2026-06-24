"use client";

type ResponsiveStatusBannerProps = {
  isLive: boolean;
};

export default function ResponsiveStatusBanner({ isLive }: ResponsiveStatusBannerProps) {
  if (isLive) {
    return (
      <div
        className="border-b border-brand-pink/20 bg-brand-pink/10 py-1.5 text-center font-ui text-xs font-semibold uppercase tracking-[0.14em] text-brand-pink motion-safe:animate-pulse"
        role="status"
      >
        🔴 Broadcasting Live
      </div>
    );
  }

  return (
    <div
      className="border-b border-brand-purple/20 bg-brand-purple/10 py-1.5 text-center font-ui text-xs font-semibold uppercase tracking-[0.14em] text-brand-purple"
      role="status"
    >
      ⏳ Rehearsal Standby
    </div>
  );
}
