"use client";

import { cn } from "@/lib/utils";
import type { IncidentConnectionState } from "@/lib/incidents/types";

type IncidentConnectionStatusProps = {
  state: IncidentConnectionState;
};

export default function IncidentConnectionStatus({ state }: IncidentConnectionStatusProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em]",
        state === "live" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        state === "reconnecting" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
        state === "disconnected" && "border-brand-border text-brand-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "live" && "animate-pulse bg-emerald-400",
          state === "reconnecting" && "animate-pulse bg-amber-400",
          state === "disconnected" && "bg-brand-muted",
        )}
      />
      {state === "live" ? "Live" : state === "reconnecting" ? "Reconnecting" : "Disconnected"}
    </span>
  );
}
