"use client";

type TeamRow = {
  rank: number;
  name: string;
  score: number;
  color: string;
  isFavored?: boolean;
};

const STANDINGS: TeamRow[] = [
  { rank: 1, name: "Aces GC", score: -14, color: "#FF3333" },
  { rank: 2, name: "Crushers GC", score: -12, color: "#CCFF00", isFavored: true },
  { rank: 3, name: "Fireballs GC", score: -9, color: "#FF9900" },
  { rank: 4, name: "HyFlyers GC", score: -6, color: "#33CCFF" },
];

export default function LivScoreboardCard() {
  return (
    <div className="w-full rounded-2xl border border-liv-border bg-liv-card p-4 font-liv-sans text-white shadow-xl selection:bg-liv-volt selection:text-black sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <span className="font-liv-mono text-[9px] font-bold uppercase tracking-[0.25em] text-liv-volt">
            Live Standings
          </span>
          <h4 className="mt-0.5 text-sm font-bold tracking-tight text-white">TEAM LEADERBOARD</h4>
        </div>
        <div className="animate-pulse rounded-md border border-liv-volt/20 bg-liv-volt/10 px-2 py-1 font-liv-mono text-[9px] font-bold uppercase tracking-wider text-liv-volt">
          ● Live Tracking
        </div>
      </div>

      <div className="space-y-2">
        {STANDINGS.map((team) => (
          <div
            key={team.name}
            className={`flex items-center justify-between rounded-xl border bg-liv-charcoal px-4 py-3 transition-all duration-200 ${
              team.isFavored
                ? "border-liv-volt/30 shadow-[0_0_15px_rgba(204,255,0,0.02)]"
                : "border-white/5 hover:border-white/10"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-4 font-liv-mono text-xs text-zinc-500">{team.rank}</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full shadow-inner"
                style={{ backgroundColor: team.color }}
              />
              <span
                className={`truncate text-sm font-medium tracking-wide ${
                  team.isFavored ? "text-white" : "text-zinc-300"
                }`}
              >
                {team.name}
              </span>
            </div>
            <span className="shrink-0 font-liv-mono text-xs font-bold tracking-tighter text-white">
              {team.score > 0 ? `+${team.score}` : team.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
