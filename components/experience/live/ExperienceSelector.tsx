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
    <div className="w-full min-w-0 max-w-full px-0.5">
      <div
        className="grid w-full grid-cols-2 gap-1.5 md:grid-cols-4"
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
              className={`touch-target experience-tab min-w-0 rounded-lg px-2 py-2.5 font-ui text-[0.54rem] font-bold uppercase tracking-[0.12em] sm:px-3 sm:text-[0.58rem] ${
                active ? "experience-tab-active" : "text-zinc-400"
              }`}
            >
              <span className="block truncate">{feed.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
