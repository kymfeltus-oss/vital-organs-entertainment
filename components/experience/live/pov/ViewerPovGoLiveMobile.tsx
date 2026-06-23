"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MoreHorizontal, ShoppingBag, Sprout, X } from "lucide-react";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import {
  POV_MOCK_CHAT_MESSAGES,
  POV_MOCK_CREATOR,
} from "@/lib/experience/live-pov-mock";
import { useLiveViewerCount } from "@/lib/experience/useLiveViewerCount";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

const NAME_CLASS = {
  blue: "text-brand-blue",
  pink: "text-brand-pink",
  purple: "text-brand-purple",
} as const;

type ViewerPovGoLiveMobileProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
};

export default function ViewerPovGoLiveMobile({
  profile,
  onProfileChange,
}: ViewerPovGoLiveMobileProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { displayLabel: viewerLabel } = useLiveViewerCount({
    enabled: true,
    userId: profile.userId,
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-black">
      {/* Full-screen simulated live camera — sole background layer */}
      <div
        className="absolute inset-0 z-0 h-full w-full bg-gradient-to-b from-[#1a0a2e] via-[#2d1045] to-[#0a1628]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_28%,rgba(255,255,255,0.16),transparent_62%)]" />
        <div className="absolute bottom-[12%] left-1/2 h-[48%] w-[76%] -translate-x-1/2 rounded-[4rem] bg-gradient-to-t from-black/20 via-white/[0.07] to-transparent" />
      </div>

      {/* Top floating bar — no boxed chrome */}
      <div className="absolute left-[clamp(0.75rem,3.5cqw,1rem)] right-[clamp(0.75rem,3.5cqw,1rem)] top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex items-center gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-white/25 font-ui text-xs font-bold text-white"
          style={{ background: POV_MOCK_CREATOR.avatarGradient }}
          aria-hidden="true"
        >
          {POV_MOCK_CREATOR.initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-sm font-semibold text-white viewer-pov-text-shadow">
            {POV_MOCK_CREATOR.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 font-ui text-[0.58rem] font-bold uppercase tracking-wider text-white shadow-[0_0_16px_rgba(239,68,68,0.55)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
              Live
            </span>
            <span className="rounded-full bg-black/45 px-2.5 py-0.5 font-ui text-[0.58rem] font-semibold text-white backdrop-blur-sm viewer-pov-text-shadow">
              👁️ {viewerLabel}
            </span>
          </div>
        </div>

        <div className="viewer-pov-profile-orb shrink-0">
          <ProfileOrbEditor
            profile={profile}
            onProfileChange={onProfileChange}
            size={40}
          />
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          aria-label="More actions"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href={ATTENDEE_DASHBOARD_PATH}
          className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          aria-label="Close live stream"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Raw floating chat — no boxes, fade mask */}
      <div className="viewer-pov-chat-mask pointer-events-none absolute bottom-[clamp(5.5rem,14cqw,7.5rem)] left-[clamp(0.75rem,3.5cqw,1rem)] z-10 max-h-[42%] max-w-[75%] overflow-hidden">
        <div className="viewer-pov-chat-scroll flex flex-col justify-end gap-2.5 pr-2">
          {POV_MOCK_CHAT_MESSAGES.map((entry) => (
            <p key={entry.id} className="font-body text-[0.9rem] leading-snug viewer-pov-text-shadow">
              <span className={`font-ui text-xs font-bold ${NAME_CLASS[entry.accent]}`}>
                {entry.user}
              </span>{" "}
              <span className="text-white">
                {entry.type === "seed" ? (
                  <>
                    <span className="text-amber-300">✦ </span>
                    {entry.text}
                  </>
                ) : (
                  entry.text
                )}
              </span>
            </p>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[clamp(0.75rem,3.5cqw,1rem)] right-[clamp(0.75rem,3.5cqw,1rem)] z-20 flex items-center gap-[clamp(0.5rem,2cqw,0.625rem)]">
        <label className="sr-only" htmlFor="viewer-pov-mobile-comment">
          Join the conversation
        </label>
        <input
          id="viewer-pov-mobile-comment"
          type="text"
          readOnly
          placeholder="Join the conversation..."
          className="h-12 min-w-0 flex-1 rounded-full border-0 bg-black/50 px-5 font-body text-sm text-white placeholder:text-white/50 backdrop-blur-md viewer-pov-text-shadow focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <button
          type="button"
          className="viewer-pov-seed-glow touch-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 text-black shadow-[0_0_24px_rgba(250,204,21,0.45)]"
          aria-label="Vital Seed"
        >
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Slide-up action sheet — secondary options only when requested */}
      {menuOpen ? (
        <>
          <button
            type="button"
            className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="viewer-pov-sheet absolute inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/10 bg-brand-panel/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
            <p className="mb-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
              Quick Actions
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Prayer", icon: Heart },
                { label: "Merch", icon: ShoppingBag },
                { label: "Vital Seed", icon: Sprout },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className="touch-target flex flex-col items-center gap-2 rounded-2xl bg-white/5 px-3 py-4 font-ui text-[0.62rem] font-semibold uppercase tracking-wider text-white transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
