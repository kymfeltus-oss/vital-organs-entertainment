"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Heart,
  HelpCircle,
  Home,
  MessageCircle,
  Music,
  Radio,
  User,
} from "lucide-react";
import { BrandIcon } from "@/components/dashboard/lobby/lobby-shared";
import { formatHarvestCurrency } from "@/lib/live/harvest-metrics";
import { useHarvestMetrics } from "@/lib/useHarvestMetrics";

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
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <linearGradient id="harvestRing" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#B0267A" />
                </linearGradient>
              </defs>
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

export function SidebarSkeleton() {
  return (
    <aside className="hidden h-screen w-[260px] shrink-0 animate-pulse border-r border-white/6 bg-[#050406] lg:flex" />
  );
}

export default function AttendeeEventLobbySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/6 bg-[#050406] px-4 py-5 lg:flex">
      <div className="shrink-0 px-0.5">
        <Image
          src="/branding/300-awakening-logo.png"
          alt="300 Awakening"
          width={220}
          height={128}
          className="mx-auto h-auto w-full max-w-[220px] object-contain"
          style={{ width: "auto", height: "auto", maxWidth: 220 }}
        />
      </div>
      <nav className="mt-5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
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
              className="flex h-10 items-center gap-3 rounded-[14px] px-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/90 transition hover:bg-white/4"
            >
              {linkInner}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4 shrink-0">
        <HarvestCard />
      </div>
    </aside>
  );
}
