"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Clapperboard,
  FileText,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mic2,
  Settings,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import {
  LIVE_HUB_NAV,
  LIVE_TOOLS_NAV,
  RESOURCES_NAV,
  type HubNavSection,
} from "@/lib/live-hub/console-layout";

type LiveHubSidebarProps = {
  activeSection: HubNavSection;
  onSectionChange: (section: HubNavSection) => void;
};

const HUB_ICONS: Record<HubNavSection, typeof Wrench> = {
  "pre-live": Wrench,
  "stream-setup": Video,
  content: Clapperboard,
  team: Users,
  advanced: Settings,
};

function NavButton({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: typeof Wrench;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.62rem] font-bold uppercase tracking-[0.12em] transition ${
        active
          ? "border border-[#1E40AF]/45 bg-[#1E40AF]/12 text-[#93c5fd]"
          : "border border-transparent text-zinc-500 hover:border-white/8 hover:bg-[#111111] hover:text-zinc-300"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

export default function LiveHubSidebar({
  activeSection,
  onSectionChange,
}: LiveHubSidebarProps) {
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-white/10 bg-[#0B090A]">
      <div className="border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logoa.png"
            alt="300 Awakening"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div>
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[#1E40AF]">
              Live Hub
            </p>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white">
              300 Awakening
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-auto px-3 py-4">
        <div>
          <p className="mb-2 px-2 text-[0.5rem] font-bold uppercase tracking-[0.24em] text-zinc-600">
            Live Hub
          </p>
          <div className="space-y-1">
            {LIVE_HUB_NAV.map((item) => {
              const Icon = HUB_ICONS[item.id];
              return (
                <NavButton
                  key={item.id}
                  label={item.label}
                  icon={Icon}
                  active={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
                />
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[0.5rem] font-bold uppercase tracking-[0.24em] text-zinc-600">
            Live Tools
          </p>
          <div className="space-y-1">
            {LIVE_TOOLS_NAV.map((label) => (
              <NavButton
                key={label}
                label={label}
                icon={
                  label === "Teleprompter"
                    ? FileText
                    : label === "Music Player"
                      ? Headphones
                      : label === "Stage Rehearsal"
                        ? Mic2
                      : Clapperboard
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-2 text-[0.5rem] font-bold uppercase tracking-[0.24em] text-zinc-600">
            Resources
          </p>
          <div className="space-y-1">
            {RESOURCES_NAV.map((label) => (
              <NavButton
                key={label}
                label={label}
                icon={
                  label === "Help Center"
                    ? HelpCircle
                    : label === "Video Tutorials"
                      ? BookOpen
                      : MessageCircle
                }
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl border border-[#B0267A]/30 bg-gradient-to-br from-[#1E40AF]/10 to-[#B0267A]/10 p-3">
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-[#93c5fd]">
            Sovereign Partner
          </p>
          <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-widest text-white">
            Plan Active
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-[0.5rem] uppercase tracking-[0.14em] text-zinc-500">
              <span>Storage</span>
              <span>68%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#0B090A]">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A]" />
            </div>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-white/10 bg-[#0B090A]/80 py-2 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-[#1E40AF]/40 hover:text-white"
          >
            Manage Plan
          </button>
        </div>
        <Link
          href="/ops"
          className="mt-3 block text-center text-[0.55rem] font-bold uppercase tracking-[0.14em] text-zinc-600 transition hover:text-[#93c5fd]"
        >
          ← Ops Command Center
        </Link>
      </div>
    </aside>
  );
}
