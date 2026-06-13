"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  HandHeart,
  Home,
  Music,
  Play,
  Radio,
  Send,
  Share2,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import HybridActivityList from "@/components/dashboard/HybridActivityList";
import {
  FeatureCardButton,
  FeatureCardMedia,
  FeatureCardShell,
  IMPACT_STATS,
  PanelShell,
} from "@/components/dashboard/lobby/lobby-shared";
import type { LiveActivityItem } from "@/lib/live/live-activity";

export type LobbyCtaState = {
  href?: string;
  disabled: boolean;
  label: string;
};

const MOBILE_NAV = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Live", href: "/dashboard/live", icon: Radio },
  { label: "Giving", href: "/giving", icon: Sparkles },
  { label: "Music", href: "/music", icon: Music },
  { label: "More", href: "/updates", icon: Calendar },
] as const;

const IMPACT_ICONS = {
  users: Users,
  "hand-heart": HandHeart,
  sprout: Sprout,
  share: Share2,
} as const;

type BelowHeroProps = LobbyCtaState & {
  movementActivity: LiveActivityItem[];
  prayerActivity: LiveActivityItem[];
  chatActivity: LiveActivityItem[];
};

function FeatureCards({ href: ctaHref, disabled: ctaDisabled, label: ctaLabel }: LobbyCtaState) {
  return (
    <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:grid-rows-[86px_auto_auto_38px] xl:gap-y-2">
      <FeatureCardShell
        borderClass="border-[#1E40AF]/75"
        media={
          <FeatureCardMedia
            src="/icons/play-icon-blue.png"
            alt="Watch Live"
            fallback={
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-[#1E40AF]/60 bg-[#1E40AF]/15">
                <Play className="h-10 w-10 text-[#93C5FD]" fill="currentColor" aria-hidden="true" />
              </div>
            }
          />
        }
        title="Watch Live"
        description="Experience the live recording in real time"
        button={
          <FeatureCardButton
            href={ctaHref ?? "/dashboard/live"}
            label="Enter Live Experience"
            borderClass="border-[#1E40AF]/75 text-[#93C5FD]"
            disabled={ctaDisabled}
            disabledLabel={ctaLabel}
          />
        }
      />
      <FeatureCardShell
        borderClass="border-[#B0267A]/75"
        media={
          <FeatureCardMedia
            src="/branding/vital-seed-logo.png"
            alt="Vital Seed Giving"
            fallback={
              <Sparkles className="h-[86px] w-[86px] text-[#B0267A]" strokeWidth={1.1} aria-hidden="true" />
            }
          />
        }
        title="Vital Seed Giving"
        description="Every gift has a frequency."
        button={
          <FeatureCardButton href="/dashboard/vital-seed" label="Give Now" borderClass="border-[#B0267A]/75" />
        }
      />
      <FeatureCardShell
        borderClass="border-[#B0267A]/55"
        media={
          <FeatureCardMedia
            src="/music/hallelujah-anyhow-cover.png"
            alt="Hallelujah Anyhow"
            fallback={
              <Music className="h-[86px] w-[86px] text-[#B0267A]" strokeWidth={1.1} aria-hidden="true" />
            }
          />
        }
        title="Hallelujah Anyhow!"
        description="The new single available now"
        button={
          <FeatureCardButton href="/music" label="Listen Now" borderClass="border-[#B0267A]/55" />
        }
      />
      <FeatureCardShell
        borderClass="border-[#B0267A]/70"
        media={
          <FeatureCardMedia
            src="/icons/event-updates-icon.png"
            alt="Event Updates"
            fallback={
              <Calendar className="h-[86px] w-[86px] text-[#B0267A]" strokeWidth={1.1} aria-hidden="true" />
            }
          />
        }
        title="Event Updates"
        description="Stay in the know with the latest"
        button={
          <FeatureCardButton href="/updates" label="View Updates" borderClass="border-[#B0267A]/70" />
        }
      />
    </section>
  );
}

export function AttendeeEventLobbyBelowHero({
  movementActivity,
  prayerActivity,
  chatActivity,
  href: ctaHref,
  disabled: ctaDisabled,
  label: ctaLabel,
}: BelowHeroProps) {
  return (
    <>
      <FeatureCards href={ctaHref} disabled={ctaDisabled} label={ctaLabel} />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.25fr]">
        <PanelShell className="flex h-[240px] flex-col p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
            Latest Movement
          </h3>
          <div className="mt-3 flex-1 overflow-hidden">
            <HybridActivityList items={movementActivity} variant="movement" />
          </div>
          <Link
            href="/updates"
            className="mt-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E40AF] hover:text-[#93C5FD]"
          >
            View All Updates
          </Link>
        </PanelShell>
        <PanelShell className="flex h-[240px] flex-col border-[#B0267A]/20 p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B0267A]">
            Prayer Wall Preview
          </h3>
          <div className="mt-3 flex-1 overflow-hidden">
            <HybridActivityList items={prayerActivity} variant="prayer" />
          </div>
          <Link
            href="/prayer"
            className="mt-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#B0267A]"
          >
            View Full Prayer Wall
          </Link>
        </PanelShell>
        <PanelShell className="flex h-[240px] flex-col overflow-hidden border-[#B0267A]/25 p-0">
          <div className="flex min-h-0 flex-1 items-center p-5">
            <Image
              src="/music/hallelujah-anyhow-cover.png"
              alt="Hallelujah Anyhow"
              width={180}
              height={120}
              className="h-auto w-[180px] shrink-0 object-contain"
              style={{ width: "auto", height: "auto", maxWidth: 180, maxHeight: 120 }}
            />
            <div className="ml-3 flex min-w-0 flex-col">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#1E40AF]">
                New Single
              </p>
              <h3 className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white">
                Hallelujah Anyhow!
              </h3>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4D4D8]">
                Available Now
              </p>
              <Link
                href="/music"
                className="mt-3 inline-flex h-[38px] w-[220px] max-w-full items-center justify-center rounded-[10px] border border-[#B0267A]/60 bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#B0267A]/10"
              >
                Listen Now
              </Link>
            </div>
          </div>
        </PanelShell>
      </div>
      <div className="mt-4 space-y-4 lg:hidden">
        <PanelShell className="p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
            Live Chat
          </h3>
          <div className="mt-3 max-h-36 overflow-auto">
            <HybridActivityList items={chatActivity.slice(0, 3)} variant="chat" />
          </div>
        </PanelShell>
        <PanelShell className="p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
            Community Impact
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {IMPACT_STATS.map(({ value, label }) => (
              <div key={label}>
                <dd className="font-black text-white">{value}</dd>
                <dt className="text-[11px] text-[#A1A1AA]">{label}</dt>
              </div>
            ))}
          </dl>
        </PanelShell>
      </div>
    </>
  );
}

export function AttendeeEventLobbyRightRail({
  chatActivity,
}: {
  chatActivity: LiveActivityItem[];
}) {
  return (
    <aside className="hidden h-screen flex-col overflow-y-auto border-l border-white/10 bg-[#050406] px-4 pb-[100px] pt-5 lg:flex">
      <div className="mb-4 flex h-[42px] items-center justify-end gap-3">
        <button
          type="button"
          className="inline-flex h-[42px] items-center gap-2 rounded-full border border-[#1E40AF]/55 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#93C5FD]"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          Share Event
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#111111] text-[#A1A1AA]"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1E40AF] to-[#B0267A] text-[11px] font-black text-white">
          VS
        </div>
      </div>
      <PanelShell className="flex h-[360px] flex-col rounded-[20px] border-white/12 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
            Live Chat
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#B0267A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#93C5FD]" />
            12.4K Online
          </span>
        </div>
        <div className="mt-3 flex-1 overflow-y-auto">
          <HybridActivityList items={chatActivity} variant="chat" />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-[#050406] px-3 py-2.5">
          <span className="flex-1 text-xs text-[#A1A1AA]">Send a message...</span>
          <Send className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
        </div>
      </PanelShell>
      <PanelShell className="mt-4 h-[285px] rounded-[20px] p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
          Community Impact
        </h3>
        <dl className="mt-5 space-y-4">
          {IMPACT_STATS.map(({ value, label, iconName }) => {
            const Icon = IMPACT_ICONS[iconName];
            return (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                  <Icon className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-sm font-black text-white">{value}</dd>
              </div>
            );
          })}
        </dl>
      </PanelShell>
    </aside>
  );
}

export function AttendeeEventLobbyBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Dashboard"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[76px] items-center border-t border-white/10 bg-[#050406]/96 backdrop-blur-[18px] lg:left-[260px]"
    >
      <div className="flex w-full items-center justify-around px-2">
        {MOBILE_NAV.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1"
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive
                    ? "text-white drop-shadow-[0_0_14px_rgba(30,64,175,0.9)]"
                    : "text-[#A1A1AA]"
                }`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span
                className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                  isActive ? "text-white" : "text-[#A1A1AA]"
                }`}
              >
                {item.label}
              </span>
              {isActive ? (
                <span className="absolute -bottom-0.5 h-[2px] w-16 rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
