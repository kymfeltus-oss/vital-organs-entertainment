import type { AttendeeRecentMessage } from "@/lib/ops/production-dashboard-metrics";

type LiveAttendeeSignalPanelProps = {
  troubleCount: number;
  audioIssueCount: number;
  videoIssueCount: number;
  paidAttendees: number;
  recentChatCount10m: number;
  recentMessages: AttendeeRecentMessage[];
};

export default function LiveAttendeeSignalPanel({
  troubleCount,
  audioIssueCount,
  videoIssueCount,
  paidAttendees,
  recentChatCount10m,
  recentMessages,
}: LiveAttendeeSignalPanelProps) {
  return (
    <section
      id="viewers-chat"
      className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5"
    >
      <header className="mb-4 border-b border-brand-border pb-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-blue">
          Live Attendee Signals
        </h2>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Total Complaints" value={String(troubleCount)} />
        <Stat label="Audio Issues" value={String(audioIssueCount)} />
        <Stat label="Video Issues" value={String(videoIssueCount)} />
        <Stat label="Paid Attendees" value={String(paidAttendees)} />
      </div>

      <p className="mb-2 font-ui text-[0.48rem] uppercase tracking-[0.12em] text-brand-muted">
        Chat activity (10m): {recentChatCount10m}
      </p>

      <div className="max-h-40 space-y-2 overflow-y-auto">
        {recentMessages.length === 0 ? (
          <p className="font-body text-xs text-brand-muted">No recent messages loaded.</p>
        ) : (
          recentMessages.map((message) => (
            <article
              key={message.id}
              className="rounded-lg border border-brand-border/70 bg-brand-black/30 px-3 py-2"
            >
              <p className="font-ui text-[0.48rem] uppercase tracking-[0.1em] text-brand-muted">
                {message.author}
              </p>
              <p className="mt-0.5 font-body text-xs text-white">{message.body}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-black/30 px-3 py-2">
      <p className="font-ui text-[0.46rem] uppercase tracking-[0.1em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 font-headline text-lg text-white">{value}</p>
    </div>
  );
}
