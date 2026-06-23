"use client";

import { Camera, Settings2 } from "lucide-react";
import RestreamCameraCard from "@/components/broadcast/RestreamCameraCard";
import SourceInputCard, {
  MediaSlotPlaceholderCard,
} from "@/components/broadcast/SourceInputCard";
import { resolveActiveOpsPreviewHlsUrl } from "@/lib/ops/resolve-active-stream-playback";
import { resolveMobileOperatorPreviewHlsUrl } from "@/lib/ops/resolve-mobile-operator-stream";
import type { BroadcastSource } from "@/lib/broadcast/types";
import type { OpsSnapshot } from "@/lib/ops/types";

type CameraGridProps = {
  sources: BroadcastSource[];
  previewSourceId: string | null;
  programSourceId: string | null;
  platformIsLive: boolean;
  opsStream: OpsSnapshot["stream"] | null;
  monitorHlsUrl?: string | null;
  onSelectPreview: (sourceId: string) => void;
  onOpenRestreamConfig: () => void;
  onLocalAudioUpdate?: (db: number) => void;
  emptyLabel?: string;
};

export default function CameraGrid({
  sources,
  previewSourceId,
  programSourceId,
  platformIsLive,
  opsStream,
  monitorHlsUrl,
  onSelectPreview,
  onOpenRestreamConfig,
  onLocalAudioUpdate,
  emptyLabel,
}: CameraGridProps) {
  const engineMode = opsStream?.studioEngineMode ?? "restream_api";
  const activeMobileStreamKey = opsStream?.activeMobileStreamKey ?? null;
  const mobileOperatorHlsUrl = resolveMobileOperatorPreviewHlsUrl(activeMobileStreamKey);
  const previewHlsUrl = monitorHlsUrl ?? resolveActiveOpsPreviewHlsUrl(opsStream);
  const cameraGuyHlsUrl = mobileOperatorHlsUrl ?? previewHlsUrl;
  const isFailoverActive = opsStream?.activeSource === "backup";
  const isInternalStudio = engineMode === "internal_studio";
  const pullConfigured = opsStream?.primaryRtmpPullConfigured === true;
  const previewConfigured = opsStream?.cameraPreviewConfigured === true;
  const urlExists =
    pullConfigured ||
    previewConfigured ||
    Boolean(previewHlsUrl?.trim()) ||
    Boolean(activeMobileStreamKey);
  const isStreaming =
    engineMode === "restream_api"
      ? previewConfigured && (platformIsLive || Boolean(previewHlsUrl?.trim()))
      : platformIsLive || (isInternalStudio && Boolean(activeMobileStreamKey));

  const stageSource = sources[0] ?? null;
  const extraSources = sources.slice(1, 2);

  return (
    <section
      aria-label="Camera input module"
      className="flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-brand-border bg-brand-panel/50 p-2"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Camera className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.2em] text-brand-blue">
              Camera Inputs
            </p>
            <p className="truncate font-ui text-[0.48rem] text-brand-muted">
              {engineMode === "internal_studio"
                ? "In-app cameras and phones"
                : "External field camera and stage feeds"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRestreamConfig}
          className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-1.5 font-ui text-[0.48rem] font-bold uppercase tracking-widest text-white transition hover:bg-brand-purple/20"
        >
          <Settings2 className="h-3.5 w-3.5 text-brand-purple" aria-hidden="true" />
          Restream Setup
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-3">
        <RestreamCameraCard
          urlExists={urlExists}
          isStreaming={isStreaming || Boolean(activeMobileStreamKey)}
          hlsUrl={cameraGuyHlsUrl}
          streamKeyLabel={activeMobileStreamKey}
          isFailoverActive={isFailoverActive}
          engineMode={engineMode}
          onConfigClick={onOpenRestreamConfig}
          onLocalAudioUpdate={onLocalAudioUpdate}
        />

        {stageSource ? (
          <SourceInputCard
            source={stageSource}
            index={0}
            previewSourceId={previewSourceId}
            programSourceId={programSourceId}
            onSelectPreview={onSelectPreview}
            variant="stage"
          />
        ) : (
          <div className="flex flex-col rounded-xl border border-dashed border-brand-border bg-brand-black/40 p-3">
            <p className="font-ui text-[0.52rem] font-bold uppercase text-brand-muted">
              Cam 2: Main Stage
            </p>
            <div className="mt-2 flex flex-1 items-center justify-center rounded-lg border border-brand-border bg-brand-black p-4">
              <p className="text-center font-ui text-[0.48rem] uppercase text-brand-muted">
                {emptyLabel ?? "No stage camera connected yet"}
              </p>
            </div>
          </div>
        )}

        {extraSources.length > 0 ? (
          extraSources.map((source, index) => (
            <SourceInputCard
              key={source.id}
              source={source}
              index={index + 1}
              previewSourceId={previewSourceId}
              programSourceId={programSourceId}
              onSelectPreview={onSelectPreview}
              variant="stage"
            />
          ))
        ) : (
          <MediaSlotPlaceholderCard />
        )}
      </div>
    </section>
  );
}
