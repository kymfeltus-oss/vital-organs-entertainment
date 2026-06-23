"use client";

import { Image, MonitorPlay } from "lucide-react";
import { resolveSourceCardStatus } from "@/lib/broadcast/readinessEngine";
import { technicalVideoHint, videoQualityLabel } from "@/lib/broadcast/layman-copy";
import type { BroadcastSource } from "@/lib/broadcast/types";

type SourceInputCardProps = {
  source: BroadcastSource;
  index: number;
  previewSourceId: string | null;
  programSourceId: string | null;
  onSelectPreview: (sourceId: string) => void;
  variant?: "stage" | "media";
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: "On Air Now", className: "bg-brand-pink/20 text-brand-pink" },
  preview: { label: "Up Next", className: "bg-brand-blue/15 text-brand-blue" },
  idle: { label: "⚪ Idle (Practice Mode Only)", className: "bg-brand-black text-brand-muted" },
  offline: { label: "Not Connected", className: "bg-brand-black text-brand-muted" },
};

export default function SourceInputCard({
  source,
  index,
  previewSourceId,
  programSourceId,
  onSelectPreview,
  variant = "stage",
}: SourceInputCardProps) {
  const status = resolveSourceCardStatus(
    source.id,
    previewSourceId,
    programSourceId,
    source.online,
  );
  const statusMeta = STATUS_LABEL[status] ?? STATUS_LABEL.idle;
  const isMedia = variant === "media";
  const camLabel = isMedia ? "Media" : `Cam ${index + 2}: ${source.name}`;

  return (
    <button
      type="button"
      onClick={() => source.online && onSelectPreview(source.id)}
      disabled={!source.online}
      className="touch-target flex h-full flex-col rounded-xl border border-brand-border bg-brand-panel p-3 text-left transition hover:border-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {isMedia ? (
            <Image className="h-4 w-4 shrink-0 text-brand-purple" aria-hidden="true" />
          ) : (
            <MonitorPlay className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
          )}
          <span className="truncate font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
            {camLabel}
          </span>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-ui text-[0.45rem] font-bold uppercase ${statusMeta.className}`}
        >
          {status === "active" || status === "preview"
            ? statusMeta.label
            : source.online
              ? "⚪ Idle (Practice Mode Only)"
              : "Not Connected"}
        </span>
      </div>

      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-black">
        <div className="px-3 text-center">
          <p className="font-headline text-sm uppercase tracking-[0.1em] text-white/80">
            {isMedia ? "Graphics Overlay" : source.name}
          </p>
          <p
            className="mt-1 font-ui text-[0.45rem] uppercase text-brand-muted"
            title={
              isMedia
                ? undefined
                : technicalVideoHint(
                    source.connectionType,
                    source.signalStrength,
                    source.vmixInputNumber,
                  )
            }
          >
            {isMedia ? "Graphics and slides slot" : "Source: Stage Camera"}
          </p>
        </div>
      </div>

      <p
        className="mt-2 truncate font-ui text-[0.48rem] text-brand-muted"
        title={isMedia ? undefined : technicalVideoHint(source.connectionType, source.signalStrength, source.vmixInputNumber)}
      >
        {isMedia ? "Media slot — coming soon" : videoQualityLabel(source.signalStrength)}
      </p>
    </button>
  );
}

export function MediaSlotPlaceholderCard() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-dashed border-brand-border bg-brand-panel/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Image className="h-4 w-4 text-brand-purple" aria-hidden="true" />
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
          Media Slots
        </span>
      </div>
      <div className="flex aspect-video items-center justify-center rounded-lg border border-brand-border bg-brand-black">
        <p className="font-ui text-[0.48rem] uppercase text-brand-muted">Ready</p>
      </div>
      <p className="mt-2 font-ui text-[0.48rem] text-brand-muted">Graphics overlay</p>
    </div>
  );
}
