"use client";

import type { AttendeeExperienceKey, AttendeeStreamFeedOption } from "@/lib/experience/stream-experiences";

type ExperienceSelectorProps = {
  feeds: AttendeeStreamFeedOption[];
  selectedKey: AttendeeExperienceKey;
  onSelect: (key: AttendeeExperienceKey) => void;
};

export default function ExperienceSelector({
  feeds,
  selectedKey,
  onSelect,
}: ExperienceSelectorProps) {
  return (
    <div className="w-full min-w-0">
      <p className="mb-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
        Choose Your View
      </p>
      <div
        className="flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Broadcast experience views"
      >
        {feeds.map((feed) => {
          const active = feed.key === selectedKey;
          return (
            <button
              key={feed.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(feed.key)}
              title={feed.description || feed.label}
              className={`touch-target shrink-0 rounded-full border px-3 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] transition sm:px-4 sm:text-[0.62rem] ${
                active
                  ? "border-brand-blue/50 bg-brand-blue/15 text-brand-blue"
                  : "border-brand-border bg-black/50 text-brand-muted hover:border-white/15 hover:text-white"
              }`}
            >
              {feed.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
