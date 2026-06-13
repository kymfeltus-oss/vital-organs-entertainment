"use client";

export type EventProgramItemStatus = "upcoming" | "current" | "completed";

export type EventProgramItem = {
  id: string;
  title: string;
  time?: string;
  description?: string;
  status: EventProgramItemStatus;
};

/** Sample service order for display until a live program backend is connected. */
const FALLBACK_EVENT_PROGRAM: EventProgramItem[] = [
  {
    id: "doors-open",
    title: "Doors Open",
    time: "6:30 PM",
    description: "Virtual doors open — settle in before we go live.",
    status: "completed",
  },
  {
    id: "welcome",
    title: "Welcome / Opening Prayer",
    time: "7:00 PM",
    description: "Gathering welcome and opening prayer with the Awakening host team.",
    status: "current",
  },
  {
    id: "worship-1",
    title: "Worship Set 1",
    time: "7:15 PM",
    description: "Opening worship with the live band and choir.",
    status: "upcoming",
  },
  {
    id: "special-guest",
    title: "Special Guest",
    description: "Featured guest appearance during the live experience.",
    status: "upcoming",
  },
  {
    id: "giving",
    title: "Giving Moment",
    description: "Sow A Seed — every gift carries a frequency into the mission.",
    status: "upcoming",
  },
  {
    id: "main-message",
    title: "Main Message / Feature Segment",
    description: "The central message and feature segment of the evening.",
    status: "upcoming",
  },
  {
    id: "worship-2",
    title: "Worship Set 2",
    description: "Closing worship set before prayer and benediction.",
    status: "upcoming",
  },
  {
    id: "prayer-moment",
    title: "Prayer Moment",
    description: "Corporate prayer and ministry response time.",
    status: "upcoming",
  },
  {
    id: "closing",
    title: "Closing / Benediction",
    description: "Final words and benediction to send you forth.",
    status: "upcoming",
  },
];

function ProgramItemRow({ item }: { item: EventProgramItem }) {
  const isCompleted = item.status === "completed";
  const isCurrent = item.status === "current";

  return (
    <li
      className={`rounded-xl border px-3 py-3 transition sm:px-4 ${
        isCurrent
          ? "border-[#1E40AF]/50 bg-[#1E40AF]/10"
          : isCompleted
            ? "border-white/8 bg-black/20 opacity-60"
            : "border-white/8 bg-[#111111]/40"
      }`}
      aria-current={isCurrent ? "step" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-ui text-[0.62rem] font-bold uppercase tracking-[0.12em] sm:text-[0.65rem] ${
              isCompleted
                ? "text-brand-muted line-through decoration-brand-muted/50"
                : isCurrent
                  ? "text-white"
                  : "text-white/90"
            }`}
          >
            {item.title}
          </p>
          {item.time ? (
            <p
              className={`mt-1 font-ui text-[0.55rem] tabular-nums tracking-[0.08em] ${
                isCompleted ? "text-brand-muted/70" : "text-brand-muted"
              }`}
            >
              {item.time}
            </p>
          ) : null}
        </div>

        {isCurrent ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#1E40AF]/55 bg-[#1E40AF]/15 px-2.5 py-1 shadow-[0_0_20px_rgba(30,64,175,0.35)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1E40AF]" aria-hidden="true" />
            <span className="font-ui text-[0.5rem] font-bold uppercase tracking-[0.12em] exp-text-blue">
              Now
            </span>
          </span>
        ) : null}
      </div>

      {item.description ? (
        <p
          className={`mt-2 font-body text-sm leading-snug ${
            isCompleted ? "text-brand-muted/80" : "text-brand-muted"
          }`}
        >
          {item.description}
        </p>
      ) : null}
    </li>
  );
}

type EventProgramPanelProps = {
  items?: EventProgramItem[];
  isFallback?: boolean;
};

export default function EventProgramPanel({
  items = FALLBACK_EVENT_PROGRAM,
  isFallback = true,
}: EventProgramPanelProps) {
  return (
    <div>
      <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
        Event Program
      </p>
      <p className="mt-1 font-body text-sm text-brand-muted">
        Follow where we are in tonight&apos;s experience.
      </p>

      {isFallback ? (
        <p className="mt-3 rounded-lg border border-white/8 bg-black/30 px-3 py-2 font-body text-xs leading-relaxed text-zinc-400">
          Sample program shown for preview. Live schedule will update automatically when connected
          to production.
        </p>
      ) : null}

      <ol className="mt-4 space-y-2" aria-label="Event program timeline">
        {items.map((item) => (
          <ProgramItemRow key={item.id} item={item} />
        ))}
      </ol>
    </div>
  );
}
