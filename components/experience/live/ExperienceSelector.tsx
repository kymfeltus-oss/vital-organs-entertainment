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
    <div className="w-full min-w-0 px-0.5">
      <div
        className="grid grid-cols-2 gap-2 sm:flex sm:min-w-0 sm:gap-2 sm:overflow-x-auto sm:pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden"
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
              className={`touch-target experience-tab shrink-0 rounded-lg px-3 py-2.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] sm:px-4 sm:text-[0.62rem] ${
                active ? "experience-tab-active" : "text-zinc-400"
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
