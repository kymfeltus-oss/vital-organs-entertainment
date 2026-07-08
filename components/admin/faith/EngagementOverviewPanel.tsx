"use client";

type EngagementOverviewPanelProps = {
  primaryColor?: string;
};

const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"] as const;
const BAR_HEIGHTS = [42, 58, 74, 88] as const;

const METRICS = [
  { label: "Total Engagement", value: "189K" },
  { label: "Active Members", value: "24K" },
  { label: "Generosity Volume", value: "$2.4M" },
  { label: "Event Attendance", value: "8.7K" },
] as const;

export default function EngagementOverviewPanel({
  primaryColor = "#FFB800",
}: EngagementOverviewPanelProps) {
  return (
    <aside className="w-full shrink-0 space-y-6 rounded-2xl border border-neutral-900 bg-neutral-950 p-5 xl:w-72">
      <div>
        <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-500">
          Engagement Overview
        </h2>
        <p className="mt-1 text-[11px] text-neutral-600">Last 30 Days</p>
      </div>

      <div className="flex h-36 items-end justify-between gap-2 rounded-xl border border-neutral-900 bg-black px-4 py-4">
        {WEEKS.map((week, index) => (
          <div key={week} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${BAR_HEIGHTS[index]}%`,
                background: `linear-gradient(180deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 45%, #000) 100%)`,
              }}
            />
            <span className="text-[9px] font-mono text-neutral-600">{week}</span>
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {METRICS.map((metric) => (
          <li
            key={metric.label}
            className="flex items-center justify-between border-b border-neutral-900 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-[11px] text-neutral-500">{metric.label}</span>
            <span className="font-mono text-sm font-bold text-white">{metric.value}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
