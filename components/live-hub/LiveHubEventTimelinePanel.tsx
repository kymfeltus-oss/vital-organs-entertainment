"use client";

import {
  DEFAULT_EVENT_SCHEDULE,
  resolveCurrentScheduleIndex,
} from "@/lib/live-hub/console-layout";
import { timelineCategoryTone, type TimelineEvent } from "@/lib/live-hub/timeline";

type LiveHubEventTimelinePanelProps = {
  isLive: boolean;
  checklistCompleteCount: number;
  events: TimelineEvent[];
};

export default function LiveHubEventTimelinePanel({
  isLive,
  checklistCompleteCount,
  events,
}: LiveHubEventTimelinePanelProps) {
  const currentIndex = resolveCurrentScheduleIndex({
    isLive,
    checklistCompleteCount,
  });

  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111]/95 p-4">
      <h3 className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-zinc-400">
        Event Timeline
      </h3>

      <div className="mt-4 space-y-2">
        {DEFAULT_EVENT_SCHEDULE.map((segment, index) => {
          const isCurrent = index === currentIndex;
          return (
            <div
              key={segment.id}
              className={`rounded-xl border px-3 py-2.5 ${
                isCurrent
                  ? "border-[#1E40AF]/50 bg-[#1E40AF]/10"
                  : "border-white/8 bg-[#0B090A]/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-[0.58rem] font-bold uppercase tracking-[0.12em] ${
                    isCurrent ? "text-[#93c5fd]" : "text-zinc-400"
                  }`}
                >
                  {segment.label}
                </p>
                <span className="font-mono text-[0.55rem] text-zinc-600">{segment.time}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{segment.detail}</p>
            </div>
          );
        })}
      </div>

      {events.length > 0 ? (
        <div className="mt-4 border-t border-white/8 pt-3">
          <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Operator Log
          </p>
          <div className="mt-2 max-h-28 space-y-2 overflow-auto">
            {events.slice(0, 8).map((event) => (
              <div key={event.id} className="border-l-2 border-white/10 pl-2 text-xs">
                <p className={`font-bold uppercase tracking-[0.08em] ${timelineCategoryTone(event.category)}`}>
                  {event.title}
                </p>
                <p className="text-zinc-600">{event.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
