"use client";

import { Settings2 } from "lucide-react";

type RestreamPipelineStripProps = {
  pushConfigured: boolean;
  pullConfigured: boolean;
  previewConfigured: boolean;
  platformIsLive: boolean;
  onOpenConfig: () => void;
};

export default function RestreamPipelineStrip({
  pushConfigured,
  pullConfigured,
  previewConfigured,
  platformIsLive,
  onOpenConfig,
}: RestreamPipelineStripProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-purple/30 bg-brand-black/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 font-ui text-[0.48rem] uppercase tracking-[0.1em]">
        <span className="text-brand-purple">Restream</span>
        <span className={pushConfigured ? "text-brand-blue" : "text-brand-muted"}>
          Push {pushConfigured ? "✓" : "—"}
        </span>
        <span className="text-brand-border">|</span>
        <span className={pullConfigured ? "text-brand-blue" : "text-brand-muted"}>
          Pull {pullConfigured ? "✓" : "—"}
        </span>
        <span className="text-brand-border">|</span>
        <span className={previewConfigured ? "text-brand-blue" : "text-brand-muted"}>
          HLS {previewConfigured ? "✓" : "—"}
        </span>
        {platformIsLive ? (
          <>
            <span className="text-brand-border">|</span>
            <span className="text-brand-pink">Platform live</span>
          </>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onOpenConfig}
        className="touch-target inline-flex items-center gap-1.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-1.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-purple/20"
      >
        <Settings2 className="h-3.5 w-3.5 text-brand-purple" aria-hidden="true" />
        Restream setup
      </button>
    </div>
  );
}
