"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, LogOut, Newspaper, Radio, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItemConfig = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: readonly string[];
};

const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    label: "Live",
    href: "/dashboard/live",
    icon: Radio,
    match: ["/dashboard/live", "/dashboard", "/live", "/experience"],
  },
  {
    label: "Merch",
    href: "/dashboard/merch",
    icon: ShoppingBag,
    match: ["/dashboard/merch"],
  },
  {
    label: "Vital Seed",
    href: "/dashboard/vital-seed",
    icon: Heart,
    match: ["/dashboard/vital-seed", "/giving"],
  },
  {
    label: "Updates",
    href: "/updates",
    icon: Newspaper,
    match: ["/updates"],
  },
] as const;

type NavLinkProps = {
  item: NavItemConfig;
  isActive: boolean;
  variant: "bottom" | "sidebar";
};

function NavLink({ item, isActive, variant }: NavLinkProps) {
  const Icon = item.icon;
  const isSidebar = variant === "sidebar";

  return (
    <Link
      href={item.href}
      className={
        isSidebar
          ? `relative flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
              isActive
                ? "bg-[#1E40AF]/20 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`
          : "relative flex flex-1 flex-col items-center gap-1 py-1"
      }
    >
      <Icon
        className={`shrink-0 h-5 w-5 ${
          isActive
            ? "text-white drop-shadow-[0_0_16px_rgba(30,64,175,0.9)]"
            : isSidebar
              ? "text-zinc-500"
              : "text-zinc-600"
        }`}
        strokeWidth={1.4}
      />
      <span
        className={`font-bold uppercase tracking-[0.12em] ${
          isSidebar ? "text-xs" : "text-[0.5rem]"
        } ${isActive ? "text-white" : isSidebar ? "text-zinc-500" : "text-zinc-600"}`}
      >
        {item.label}
      </span>
      {isActive && (
        <motion.span
          layoutId={isSidebar ? "nav-active-sidebar" : "nav-active-bottom"}
          className={
            isSidebar
              ? "absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#1E40AF] to-[#B0267A]"
              : "absolute -bottom-0.5 h-[3px] w-14 rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A]"
          }
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
    </Link>
  );
}

function SignOutButton({
  variant,
  isLoggingOut,
  onLogout,
}: {
  variant: "bottom" | "sidebar";
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const isSidebar = variant === "sidebar";

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      className={
        isSidebar
          ? "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          : "flex w-full items-center justify-center gap-1.5 py-1.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-zinc-600 transition-colors hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" strokeWidth={1.4} aria-hidden="true" />
      )}
      <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}

export default function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        router.refresh();
        router.push("/email-gate");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const items = NAV_ITEMS.map((item) => ({
    item,
    isActive: item.match.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ),
  }));

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <nav
          aria-label="Primary mobile"
          className="border-t border-[#1E40AF]/40 bg-[#0B090A]/95 pb-safe backdrop-blur-xl"
        >
          <div className="flex items-center justify-around px-2 pt-2">
            {items.map(({ item, isActive }) => (
              <NavLink key={item.href} item={item} isActive={isActive} variant="bottom" />
            ))}
          </div>
          <div className="border-t border-white/5 px-4 py-2">
            <SignOutButton
              variant="bottom"
              isLoggingOut={isLoggingOut}
              onLogout={() => void handleLogout()}
            />
          </div>
        </nav>
      </div>

      <nav
        aria-label="Primary desktop"
        className="fixed top-0 left-0 z-50 hidden h-dvh w-64 flex-col border-r border-[#1E40AF]/30 bg-[#0B090A]/95 pt-safe backdrop-blur-xl md:flex"
      >
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            300 Awakening
          </p>
          <p className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
            Experience
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3 py-6">
          {items.map(({ item, isActive }) => (
            <NavLink key={item.href} item={item} isActive={isActive} variant="sidebar" />
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 px-3 py-4">
          <SignOutButton
            variant="sidebar"
            isLoggingOut={isLoggingOut}
            onLogout={() => void handleLogout()}
          />
        </div>
      </nav>
    </>
  );
}
