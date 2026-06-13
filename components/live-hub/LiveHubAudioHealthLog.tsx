"use client";

type LiveHubAudioHealthLogProps = {
  healingLogs: string[];
  onSimulateSilence?: () => void;
};

export default function LiveHubAudioHealthLog({
  healingLogs,
  onSimulateSilence,
}: LiveHubAudioHealthLogProps) {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-headline text-lg tracking-wider text-brand-blue">
          Audio Background Health Logs
        </h4>
        <div className="flex items-center gap-2">
          {onSimulateSilence ? (
            <button
              type="button"
              onClick={onSimulateSilence}
              className="touch-target rounded border border-brand-pink/40 px-2 py-1 font-ui text-[10px] font-bold uppercase tracking-widest text-brand-pink transition hover:bg-brand-pink/10"
            >
              Simulate Silence
            </button>
          ) : null}
          <span className="rounded bg-brand-blue/20 px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            Web Worker Active
          </span>
        </div>
      </div>

      <div className="h-28 space-y-1.5 overflow-y-auto rounded-lg border border-white/5 bg-brand-black/60 p-3 font-mono text-xs text-brand-muted">
        {healingLogs.length === 0 ? (
          <p className="text-brand-muted">Awaiting worker telemetry…</p>
        ) : (
          healingLogs.map((log, index) => (
            <div
              key={`${index}-${log.slice(0, 24)}`}
              className={log.includes("🔧") ? "font-bold text-brand-pink" : undefined}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
