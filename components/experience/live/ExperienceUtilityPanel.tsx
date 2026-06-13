"use client";

import { Heart, HandHeart, ListOrdered, Radio } from "lucide-react";
import dynamic from "next/dynamic";
import EventProgramPanel from "@/components/experience/live/EventProgramPanel";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

const FellowshipChatPanel = dynamic(
  () => import("@/components/experience/live/FellowshipChatPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="font-body text-sm text-brand-muted">Opening Fellowship Chat…</p>
    ),
  },
);

const ExperiencePrayerPanel = dynamic(
  () => import("@/components/experience/live/ExperiencePrayerPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="font-body text-sm text-brand-muted">Loading prayer panel…</p>
    ),
  },
);

const ExperienceGivingPanel = dynamic(
  () => import("@/components/experience/live/ExperienceGivingPanel"),
  {
    ssr: false,
    loading: () => (
      <p className="font-body text-sm text-brand-muted">Loading giving panel…</p>
    ),
  },
);

export type ExperienceUtilityTab = "watch" | "prayer" | "give" | "program";

type ExperienceUtilityPanelProps = {
  activeTab: ExperienceUtilityTab;
  onTabChange: (tab: ExperienceUtilityTab) => void;
  countdownConfig: EventCountdownConfig;
  variant: "waiting" | "live";
};

const TABS: { id: ExperienceUtilityTab; label: string; icon: typeof Heart }[] = [
  { id: "watch", label: "Watch / Chat", icon: Radio },
  { id: "prayer", label: "Prayer", icon: HandHeart },
  { id: "give", label: "Give", icon: Heart },
  { id: "program", label: "Event Program", icon: ListOrdered },
];

function WatchChatPanel({
  variant,
  countdownConfig,
}: {
  variant: "waiting" | "live";
  countdownConfig: EventCountdownConfig;
}) {
  return (
    <div className="flex flex-col gap-4">
      {variant === "waiting" ? (
        <div>
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            Waiting Room
          </p>
          <p className="mt-2 font-body text-sm leading-relaxed text-white/85">
            The live broadcast has not started yet. Stay on this page — the experience will open
            automatically when we go live.
          </p>
          <p className="mt-2 font-body text-sm text-brand-muted">{countdownConfig.helper_text}</p>
        </div>
      ) : (
        <p className="font-body text-sm text-brand-muted">
          The live player is above. Fellowship Chat is open below while you watch.
        </p>
      )}

      <div className="border-t border-brand-border pt-4">
        <FellowshipChatPanel />
      </div>
    </div>
  );
}

export default function ExperienceUtilityPanel({
  activeTab,
  onTabChange,
  countdownConfig,
  variant,
}: ExperienceUtilityPanelProps) {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-panel/90 p-3 sm:p-4">
      <p className="mb-3 font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        {variant === "waiting" ? "Experience Access" : "While You Watch"}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`touch-target flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 font-ui text-[0.54rem] font-bold uppercase tracking-[0.1em] transition sm:text-[0.58rem] sm:tracking-[0.12em] ${
                active
                  ? "border-brand-blue/50 bg-brand-blue/10 text-brand-blue"
                  : "border-brand-border bg-black/40 text-brand-muted hover:border-white/15 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-40 rounded-xl border border-brand-border bg-black/50 p-4">
        {activeTab === "watch" && (
          <WatchChatPanel variant={variant} countdownConfig={countdownConfig} />
        )}

        {activeTab === "prayer" && <ExperiencePrayerPanel />}

        {activeTab === "give" && <ExperienceGivingPanel />}

        {activeTab === "program" && <EventProgramPanel />}
      </div>
    </section>
  );
}
