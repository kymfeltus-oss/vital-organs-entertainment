"use client";

import { Radio, Square } from "lucide-react";

type LiveHubGoLiveButtonProps = {
  blocked: boolean;
  criticalIssueCount: number;
  onClick: () => void;
  isLive?: boolean;
  onStop?: () => void;
  isStopping?: boolean;
  /** header = top bar; hero = checklist; sticky = bottom action bar */
  variant?: "header" | "hero" | "sticky";
};

export default function LiveHubGoLiveButton({
  blocked,
  criticalIssueCount,
  onClick,
  isLive = false,
  onStop,
  isStopping = false,
  variant = "header",
}: LiveHubGoLiveButtonProps) {
  const sizeStyles =
    variant === "sticky"
      ? "w-full justify-center gap-3 px-6 py-4 text-[0.7rem] tracking-[0.2em]"
      : variant === "hero"
        ? "gap-2 px-6 py-3 text-[0.62rem] tracking-[0.16em]"
        : "gap-2 px-5 py-2.5 text-[0.62rem] tracking-[0.16em] sm:px-8 sm:py-3 sm:text-[0.65rem] sm:tracking-[0.18em]";

  if (isLive && onStop) {
    return (
      <button
        type="button"
        onClick={onStop}
        disabled={isStopping}
        title="Open end-broadcast confirmation — stops vMix and closes attendee access"
        className={`touch-target inline-flex shrink-0 items-center rounded-full border border-brand-pink/70 bg-brand-pink/20 font-bold uppercase text-white transition hover:bg-brand-pink/30 disabled:cursor-wait disabled:opacity-60 neon-pink-glow ${sizeStyles}`}
      >
        <Square className={variant === "sticky" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
        <span>{isStopping ? "Stopping…" : "Stop Stream"}</span>
      </button>
    );
  }

  const blockedStyles =
    "border-brand-pink/50 bg-brand-pink/10 text-white neon-pink-glow hover:bg-brand-pink/15";
  const readyStyles =
    "border-brand-blue/80 bg-gradient-to-r from-brand-blue/30 to-brand-pink/25 text-white shadow-[0_0_28px_rgba(0,168,255,0.35)] hover:brightness-110";

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        blocked
          ? `${criticalIssueCount} critical blocker(s) — click to review before going live`
          : "Open Go Live review"
      }
      className={`touch-target inline-flex shrink-0 items-center rounded-full border font-bold uppercase transition ${sizeStyles} ${
        blocked ? blockedStyles : readyStyles
      }`}
    >
      <Radio className={variant === "sticky" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
      <span>Go Live</span>
      {blocked ? (
        <span className="rounded-full border border-brand-pink/40 bg-brand-black/40 px-2 py-0.5 text-[0.5rem] font-bold normal-case tracking-normal text-brand-pink">
          {criticalIssueCount} blocked
        </span>
      ) : null}
    </button>
  );
}
