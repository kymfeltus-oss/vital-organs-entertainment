"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Calendar,
  Heart,
  HelpCircle,
  Home,
  Music,
  Play,
  Radio,
  Send,
  Share2,
  Sparkles,
  User,
  Users,
  HandHeart,
  MessageCircle,
  Sprout,
} from "lucide-react";
import HybridActivityList from "@/components/dashboard/HybridActivityList";
import PassActivatingShell from "@/components/live/PassActivatingShell";
import {
  computeCountdown,
  EVENT_LOBBY,
  type CountdownParts,
} from "@/lib/live/event-lobby";
import {
  filterActivityByKinds,
  type LiveActivityItem,
} from "@/lib/live/live-activity";
import { formatHarvestCurrency } from "@/lib/live/harvest-metrics";
import { useHarvestMetrics } from "@/lib/useHarvestMetrics";
import { useHybridLiveActivity } from "@/lib/useHybridLiveActivity";
import { useLiveAccessVerification } from "@/lib/useLiveAccessVerification";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

function isValidHlsUrl(url?: string | null): boolean {
  return Boolean(url && (url.includes(".m3u8") || url.includes(".m3u8?")));
}

const SIDEBAR_NAV = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Live", href: "/dashboard/live", icon: Radio },
  { label: "Giving", href: "/giving", icon: Heart },
  { label: "Music", href: "/music", icon: Music },
  { label: "Updates", href: "/updates", icon: Calendar },
  { label: "Prayer Wall", href: "/prayer", icon: MessageCircle },
  { label: "Account", href: "/dashboard/merch", icon: User },
  { label: "Help Center", href: "/exclusive", icon: HelpCircle },
] as const;

const MOBILE_NAV = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Live", href: "/dashboard/live", icon: Radio },
  { label: "Giving", href: "/giving", icon: Sparkles },
  { label: "Music", href: "/music", icon: Music },
  { label: "More", href: "/updates", icon: Calendar },
] as const;

const IMPACT_STATS = [
  { value: "12,482", label: "Viewers Ready", icon: Users },
  { value: "2,312", label: "Prayer Requests", icon: HandHeart },
  { value: "4,981", label: "Seeds Sown", icon: Sprout },
  { value: "1,242", label: "Event Shares", icon: Share2 },
] as const;

function useEventCountdown(targetIso: string): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => computeCountdown(targetIso));

  useEffect(() => {
    const tick = () => setParts(computeCountdown(targetIso));
    tick();
    const intervalId = setInterval(tick, 1_000);
    return () => clearInterval(intervalId);
  }, [targetIso]);

  return parts;
}

function useLobbyCta() {
  const { phase, evaluation } = useLiveAccessVerification();
  const { isLive: streamIsLive } = useLiveStreamState();
  const hasValidSource = isValidHlsUrl(evaluation?.playbackUrl);
  const isLocked = phase === "locked" || phase === "guest_hub";

  return useMemo(() => {
    if (phase === "checking" || phase === "activating_pass") {
      return { label: "ACTIVATING YOUR PASS", href: undefined, disabled: true };
    }
    if (isLocked) {
      return { label: "GET YOUR PASS", href: "/dashboard/merch", disabled: false };
    }
    if (!streamIsLive) {
      return { label: "WAITING FOR LIVE", href: undefined, disabled: true };
    }
    if (!hasValidSource) {
      return { label: "LIVE SIGNAL NOT READY", href: undefined, disabled: true };
    }
    return { label: "ENTER LIVE EXPERIENCE", href: "/dashboard/live", disabled: false };
  }, [hasValidSource, isLocked, phase, streamIsLive]);
}

function formatCountdownHms(countdown: CountdownParts): string {
  const totalHours = countdown.days * 24 + countdown.hours;
  return `${String(totalHours).padStart(2, "0")} : ${String(countdown.minutes).padStart(2, "0")} : ${String(countdown.seconds).padStart(2, "0")}`;
}

function PanelShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-white/10 bg-[#111111] shadow-[0_0_34px_rgba(0,0,0,0.45)] ${className}`}
    >
      {children}
    </section>
  );
}

function BrandIcon({
  src,
  width,
  height,
  alt,
  fallback,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function HarvestCard() {
  const { totalRaised, progressPercent, isLoading } = useHarvestMetrics();
  const displayAmount = isLoading ? 24_850 : totalRaised || 24_850;
  const displayPercent = isLoading ? 82 : Math.round(progressPercent) || 82;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayPercent / 100) * circumference;

  return (
    <div className="rounded-[20px] bg-gradient-to-br from-[#1E40AF] via-[#6366f1] to-[#B0267A] p-px shadow-[0_0_32px_rgba(176,38,122,0.28)]">
      <div className="flex flex-col rounded-[19px] bg-[#050406] px-4 pb-4 pt-3.5">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em]">
          <span className="text-[#60A5FA]">Awakening </span>
          <span className="text-[#E879B0]">Harvest</span>
        </p>

        <p className="mt-2.5 text-center text-[32px] font-black leading-none text-white">
          {formatHarvestCurrency(displayAmount)}
        </p>
        <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
          Raised So Far
        </p>

        <div className="mt-3 flex flex-col items-center">
          <div className="relative flex h-[112px] w-[112px] items-center justify-center">
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#111111" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#harvestRing)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="drop-shadow-[0_0_12px_rgba(176,38,122,0.6)]"
              />
              <defs>
                <linearGradient id="harvestRing" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#B0267A" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[30px] font-black leading-none text-white">{displayPercent}%</span>
          </div>
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4D4D8]">
            Of Goal Reached
          </p>
        </div>

        <div className="mt-3.5 rounded-[12px] bg-gradient-to-r from-[#1E40AF] via-[#6366f1] to-[#B0267A] p-px">
          <Link
            href="/giving"
            className="flex h-10 items-center justify-center gap-2 rounded-[11px] bg-[#050406] text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#0B090A]"
          >
            <BrandIcon
              src="/icons/heart-neon.png"
              width={14}
              height={14}
              alt=""
              fallback={<Heart className="h-3.5 w-3.5 text-[#E879B0]" aria-hidden="true" />}
            />
            Give Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function SidebarNavIcon({
  icon: Icon,
  isActive,
}: {
  icon: (typeof SIDEBAR_NAV)[number]["icon"];
  isActive: boolean;
}) {
  if (!isActive) {
    return <Icon className="h-[16px] w-[16px] shrink-0 text-white/90" strokeWidth={1.65} aria-hidden="true" />;
  }

  return (
    <span className="relative flex h-[16px] w-[16px] shrink-0 items-center justify-center">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="sidebarNavIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#E879B0" />
          </linearGradient>
        </defs>
      </svg>
      <Icon
        className="h-[16px] w-[16px] drop-shadow-[0_0_10px_rgba(176,38,122,0.55)]"
        stroke="url(#sidebarNavIconGrad)"
        strokeWidth={1.85}
        aria-hidden="true"
      />
    </span>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const harvestRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const aside = asideRef.current;
    const nav = navRef.current;
    const harvest = harvestRef.current;
    const logo = logoRef.current;
    if (!aside || !nav || !harvest || !logo) return;

    const navStyle = window.getComputedStyle(nav);
    const navChildren = Array.from(nav.children) as HTMLElement[];
    const navItemRects = navChildren.map((el) => {
      const r = el.getBoundingClientRect();
      return { label: el.textContent?.trim().slice(0, 20), height: r.height, top: r.top };
    });
    const navGaps = navItemRects.slice(1).map((item, i) => item.top - (navItemRects[i].top + navItemRects[i].height));
    const lastNavBottom = navItemRects.at(-1)?.top ?? 0;
    const lastNavHeight = navItemRects.at(-1)?.height ?? 0;
    const harvestTop = harvest.getBoundingClientRect().top;
    const navToHarvestGap = harvestTop - (lastNavBottom + lastNavHeight);
    const childFlexGrows = navChildren.map((el) => window.getComputedStyle(el).flexGrow);

    // #region agent log
    fetch("http://127.0.0.1:7792/ingest/d8b5dd27-4a5d-456e-ab44-bc32a12c283a", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "e29577" },
      body: JSON.stringify({
        sessionId: "e29577",
        runId: "pre-fix",
        hypothesisId: "H1-H5",
        location: "AttendeeEventLobbyClient.tsx:Sidebar",
        message: "sidebar layout metrics",
        data: {
          viewport: { w: window.innerWidth, h: window.innerHeight },
          lgMatches: window.matchMedia("(min-width: 1024px)").matches,
          aside: { height: aside.getBoundingClientRect().height, display: window.getComputedStyle(aside).display },
          logo: { height: logo.getBoundingClientRect().height },
          nav: {
            height: nav.getBoundingClientRect().height,
            scrollHeight: nav.scrollHeight,
            gap: navStyle.gap,
            justifyContent: navStyle.justifyContent,
            flexGrow: navStyle.flexGrow,
            childCount: navChildren.length,
            childFlexGrows,
          },
          navItemHeights: navItemRects.map((r) => r.height),
          navGapsBetweenItems: navGaps,
          navToHarvestGap,
          harvest: { height: harvest.getBoundingClientRect().height },
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [pathname]);

  return (
    <aside
      ref={asideRef}
      className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#050406] px-4 py-5 lg:flex"
    >
      <div ref={logoRef} className="shrink-0 px-0.5">
        <Image
          src="/branding/300-awakening-logo.png"
          alt="300 Awakening"
          width={220}
          height={128}
          className="mx-auto h-auto w-full max-w-[220px] object-contain"
          style={{ width: "auto", height: "auto", maxWidth: 220 }}
          priority
        />
      </div>

      <nav ref={navRef} className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {SIDEBAR_NAV.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const linkInner = (
            <>
              <SidebarNavIcon icon={item.icon} isActive={isActive} />
              {item.label}
            </>
          );

          if (isActive) {
            return (
              <div
                key={item.label}
                className="rounded-[14px] bg-gradient-to-r from-[#1E40AF] via-[#6366f1] to-[#B0267A] p-px shadow-[0_0_22px_rgba(176,38,122,0.28)]"
              >
                <Link
                  href={item.href}
                  className="flex h-10 items-center gap-3 rounded-[13px] bg-[#0B090A] px-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white"
                >
                  {linkInner}
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex h-10 items-center gap-3 rounded-[14px] px-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 transition hover:bg-white/[0.04]"
            >
              {linkInner}
            </Link>
          );
        })}
      </nav>

      <div ref={harvestRef} className="mt-4 shrink-0">
        <HarvestCard />
      </div>
    </aside>
  );
}

type HeroLobbyProps = {
  countdown: CountdownParts;
  isLiveSignal: boolean;
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled: boolean;
};

function HeroLobby({ countdown, isLiveSignal, ctaLabel, ctaHref, ctaDisabled }: HeroLobbyProps) {
  const timeDisplay = formatCountdownHms(countdown);

  return (
    <section className="relative h-[475px] shrink-0 overflow-hidden rounded-[24px] border border-[#1E40AF]/55 bg-[#050406] shadow-[0_0_70px_rgba(30,64,175,0.2),inset_0_0_80px_rgba(0,0,0,0.65)]">
      <Image
        src="/effects/hero-audience-banner.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-100"
        sizes="(max-width: 1280px) 100vw, 55vw"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/5 to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_30%_45%,rgba(30,64,175,0.32),transparent_36%),radial-gradient(circle_at_72%_43%,rgba(176,38,122,0.35),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-75">
        <Image
          src="/effects/waveform-overlay.png"
          alt=""
          fill
          className="object-cover object-bottom"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center pt-[26px] text-center">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.52em] text-[#93C5FD]">
          Live Recording Experience
        </p>

        <h1
          className="mb-[14px] font-black uppercase leading-[0.95] tracking-[0.18em] text-white"
          style={{
            fontSize: "clamp(54px, 4.35vw, 76px)",
            textShadow:
              "0 0 18px rgba(255,255,255,0.18), 0 0 34px rgba(176,38,122,0.18)",
          }}
        >
          YOU&apos;RE ALMOST LIVE
        </h1>

        <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.36em] text-white">
          The Awakening Begins Soon
        </p>

        <div className="relative mb-2 h-[108px] w-full max-w-[390px]">
          <Image src="/ui/countdown-frame.png" alt="" fill className="object-contain" priority />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <p
              className="text-[42px] font-black leading-none tracking-[0.18em] text-white"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.85)" }}
            >
              {timeDisplay}
            </p>
            <div className="mt-[10px] grid w-[250px] grid-cols-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4D4D8]">
              <span>HRS</span>
              <span className="text-center">MINS</span>
              <span className="text-right">SECS</span>
            </div>
          </div>
        </div>

        <div className="relative mt-1 h-[42px] w-full max-w-[300px]">
          <Image
            src={isLiveSignal ? "/ui/live-pill.png" : "/ui/waiting-live-signal-pill.png"}
            alt={isLiveSignal ? "Live signal" : "Waiting for live signal"}
            fill
            className="object-contain"
          />
        </div>

        <div className="relative mt-3 h-[78px] w-full max-w-[540px]">
          <Image src="/ui/enter-live-button-frame.png" alt="" fill className="object-contain" />
          <div className="absolute inset-0 flex items-center justify-center">
            {ctaHref && !ctaDisabled ? (
              <Link
                href={ctaHref}
                className="text-2xl font-black uppercase tracking-[0.28em] text-white hover:text-[#D4D4D8]"
              >
                {ctaLabel}
              </Link>
            ) : (
              <span
                className={`text-2xl font-black uppercase tracking-[0.28em] ${
                  ctaDisabled ? "text-[#D4D4D8]" : "text-white"
                }`}
              >
                {ctaLabel}
              </span>
            )}
          </div>
        </div>

        <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4D4D8]">
          Stay Close. The Experience Will Open Automatically.
        </p>
      </div>
    </section>
  );
}

function FeatureCardButton({
  href,
  label,
  borderClass,
  disabled,
  disabledLabel,
}: {
  href: string;
  label: string;
  borderClass: string;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  if (disabled) {
    return (
      <span
        className={`flex h-[38px] w-full cursor-not-allowed items-center justify-center rounded-[10px] border bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-[#A1A1AA] ${borderClass}`}
      >
        {disabledLabel ?? label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`flex h-[38px] w-full items-center justify-center rounded-[10px] border bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/5 ${borderClass}`}
    >
      {label}
    </Link>
  );
}

function FeatureCards({
  ctaHref,
  ctaDisabled,
  ctaLabel,
}: {
  ctaHref?: string;
  ctaDisabled: boolean;
  ctaLabel: string;
}) {
  return (
    <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex h-[246px] flex-col items-center justify-between rounded-[20px] border border-[#1E40AF]/75 bg-[#111111] p-[22px] text-center shadow-[0_0_34px_rgba(0,0,0,0.45)]">
        <BrandIcon
          src="/icons/play-icon-blue.png"
          width={86}
          height={86}
          alt=""
          fallback={
            <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-[#1E40AF]/60 bg-[#1E40AF]/15">
              <Play className="h-10 w-10 text-[#93C5FD]" fill="currentColor" aria-hidden="true" />
            </div>
          }
        />
        <div>
          <h3 className="text-xl font-black uppercase leading-[1.1] tracking-[0.18em] text-white">
            Watch Live
          </h3>
          <p className="mt-1 text-sm leading-[1.45] text-[#D4D4D8]">
            Experience the live recording in real time
          </p>
        </div>
        <FeatureCardButton
          href={ctaHref ?? "/dashboard/live"}
          label="Enter Live Experience"
          borderClass="border-[#1E40AF]/75 text-[#93C5FD]"
          disabled={ctaDisabled}
          disabledLabel={ctaLabel}
        />
      </div>

      <div className="flex h-[246px] flex-col items-center justify-between rounded-[20px] border border-[#B0267A]/75 bg-[#111111] p-[22px] text-center shadow-[0_0_34px_rgba(0,0,0,0.45)]">
        <Image
          src="/branding/vital-seed-logo.png"
          alt="Vital Seed"
          width={156}
          height={92}
          className="h-auto w-[156px] object-contain"
          style={{ width: "auto", height: "auto", maxWidth: 156, maxHeight: 92 }}
        />
        <div>
          <h3 className="text-xl font-black uppercase leading-[1.1] tracking-[0.18em] text-white">
            Vital Seed Giving
          </h3>
          <p className="mt-1 text-sm leading-[1.45] text-[#D4D4D8]">Every gift has a frequency.</p>
        </div>
        <FeatureCardButton
          href="/dashboard/vital-seed"
          label="Give Now"
          borderClass="border-[#B0267A]/75"
        />
      </div>

      <div className="flex h-[246px] flex-col items-center justify-between rounded-[20px] border border-[#B0267A]/55 bg-[#111111] p-[22px] text-center shadow-[0_0_34px_rgba(0,0,0,0.45)]">
        <Image
          src="/music/hallelujah-anyhow-cover.png"
          alt="Hallelujah Anyhow"
          width={170}
          height={100}
          className="h-auto w-[170px] object-contain"
          style={{ width: "auto", height: "auto", maxWidth: 170, maxHeight: 100 }}
        />
        <div>
          <h3 className="text-xl font-black uppercase leading-[1.1] tracking-[0.18em] text-white">
            Hallelujah Anyhow!
          </h3>
          <p className="mt-1 text-sm leading-[1.45] text-[#D4D4D8]">The new single available now</p>
        </div>
        <FeatureCardButton
          href="/music"
          label="Listen Now"
          borderClass="border-[#B0267A]/55"
        />
      </div>

      <div className="flex h-[246px] flex-col items-center justify-between rounded-[20px] border border-[#B0267A]/70 bg-[#111111] p-[22px] text-center shadow-[0_0_34px_rgba(0,0,0,0.45)]">
        <BrandIcon
          src="/icons/updates-neon.png"
          width={82}
          height={82}
          alt=""
          fallback={
            <Calendar
              className="h-[82px] w-[82px] text-[#B0267A]"
              strokeWidth={1.1}
              aria-hidden="true"
            />
          }
        />
        <div>
          <h3 className="text-xl font-black uppercase leading-[1.1] tracking-[0.18em] text-white">
            Event Updates
          </h3>
          <p className="mt-1 text-sm leading-[1.45] text-[#D4D4D8]">Stay in the know with the latest</p>
        </div>
        <FeatureCardButton
          href="/updates"
          label="View Updates"
          borderClass="border-[#B0267A]/70"
        />
      </div>
    </section>
  );
}

function LatestMovement({ items }: { items: LiveActivityItem[] }) {
  return (
    <PanelShell className="flex h-[240px] flex-col p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A1A1AA]">
        Latest Movement
      </h3>
      <div className="mt-3 flex-1 overflow-hidden">
        <HybridActivityList items={items} variant="movement" />
      </div>
      <Link
        href="/updates"
        className="mt-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E40AF] hover:text-[#93C5FD]"
      >
        View All Updates
      </Link>
    </PanelShell>
  );
}

function PrayerPreview({ items }: { items: LiveActivityItem[] }) {
  return (
    <PanelShell className="flex h-[240px] flex-col border-[#B0267A]/20 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B0267A]">
        Prayer Wall Preview
      </h3>
      <div className="mt-3 flex-1 overflow-hidden">
        <HybridActivityList items={items} variant="prayer" />
      </div>
      <Link
        href="/prayer"
        className="mt-auto text-[11px] font-bold uppercase tracking-[0.18em] text-[#B0267A]"
      >
        View Full Prayer Wall
      </Link>
    </PanelShell>
  );
}

function NewSingleCard() {
  return (
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
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A1A1AA]">
            On Apple Music
          </p>
          <Link
            href="/music"
            className="mt-3 inline-flex h-[38px] w-[220px] max-w-full items-center justify-center rounded-[10px] border border-[#B0267A]/60 bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-[#B0267A]/10"
          >
            Listen Now
          </Link>
        </div>
      </div>
      <div className="flex border-t border-white/10 bg-[#050406]">
        {["Bold Sound", "Faith-Filled", "Awaken A Generation"].map((tag) => (
          <span
            key={tag}
            className="flex-1 border-r border-white/10 px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#A1A1AA] last:border-r-0"
          >
            {tag}
          </span>
        ))}
      </div>
    </PanelShell>
  );
}

function RightRail({ chatActivity }: { chatActivity: LiveActivityItem[] }) {
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
          {IMPACT_STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Icon className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
                {label}
              </dt>
              <dd className="text-sm font-black text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </PanelShell>
    </aside>
  );
}

function BottomNav() {
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

function MobileStack({ chatActivity }: { chatActivity: LiveActivityItem[] }) {
  return (
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
  );
}

export default function AttendeeEventLobbyClient() {
  const { phase, verificationAttempt } = useLiveAccessVerification();
  const { isLive: streamIsLive, isLoading: isStreamStateLoading } = useLiveStreamState();
  const { pool, visible: activityVisible } = useHybridLiveActivity();
  const countdown = useEventCountdown(EVENT_LOBBY.targetIso);
  const cta = useLobbyCta();

  const movementActivity = useMemo(() => {
    const fromVisible = filterActivityByKinds(activityVisible, [
      "system",
      "join",
      "share",
      "music",
    ]);
    if (fromVisible.length >= 4) return fromVisible.slice(0, 5);
    return filterActivityByKinds(pool, ["system", "join", "share", "music"]).slice(0, 5);
  }, [activityVisible, pool]);

  const prayerActivity = useMemo(() => {
    const fromVisible = filterActivityByKinds(activityVisible, ["prayer"]);
    if (fromVisible.length >= 3) return fromVisible.slice(0, 3);
    return filterActivityByKinds(pool, ["prayer"]).slice(0, 3);
  }, [activityVisible, pool]);

  const chatActivity = useMemo(() => activityVisible.slice(0, 5), [activityVisible]);

  const isLiveSignal = streamIsLive && !isStreamStateLoading;

  if (phase === "checking" || phase === "activating_pass") {
    return <PassActivatingShell attempt={verificationAttempt} />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#050406] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <Sidebar />

        <main className="h-screen overflow-y-auto px-5 pt-5 pb-32">
          <div className="mb-4 lg:hidden">
            <Image
              src="/branding/300-awakening-logo.png"
              alt="300 Awakening"
              width={150}
              height={88}
              className="mx-auto h-auto w-[150px] object-contain"
              style={{ width: "auto", height: "auto", maxWidth: 150, maxHeight: 88 }}
              priority
            />
          </div>

          <HeroLobby
            countdown={countdown}
            isLiveSignal={isLiveSignal}
            ctaLabel={cta.label}
            ctaHref={cta.href}
            ctaDisabled={cta.disabled}
          />
          <FeatureCards ctaHref={cta.href} ctaDisabled={cta.disabled} ctaLabel={cta.label} />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.25fr]">
            <LatestMovement items={movementActivity} />
            <PrayerPreview items={prayerActivity} />
            <NewSingleCard />
          </div>
          <MobileStack chatActivity={chatActivity} />
        </main>

        <RightRail chatActivity={chatActivity} />
      </div>

      <BottomNav />
    </div>
  );
}
