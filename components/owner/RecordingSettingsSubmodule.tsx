"use client";

import { useEffect, useState } from "react";
import { useRecordingArchiveManager } from "@/hooks/useRecordingArchiveManager";
import type { RecordingTargetType } from "@/types/recording";

type RecordingSettingsSubmoduleProps = {
  showId: string;
  showTitle: string;
};

function formatAssetSize(fileSizeMb: number): string {
  return `${(fileSizeMb / 1024).toFixed(2)} GB`;
}

function isRetrievableUrl(value: string): boolean {
  return Boolean(value.trim()) && (/^(https?:\/\/|\/|s3:\/\/)/i.test(value.trim()));
}

export default function RecordingSettingsSubmodule({
  showId,
  showTitle,
}: RecordingSettingsSubmoduleProps) {
  const {
    config,
    jobs,
    isSaving,
    isProcessingJob,
    errorMessage,
    successMessage,
    saveRecordingConfiguration,
    triggerLiveArchiveProcess,
  } = useRecordingArchiveManager(showId, showTitle);

  const [targetType, setTargetType] = useState<RecordingTargetType>("DUAL_TRACK_BOTH");
  const [resolution, setResolution] = useState<"1080p" | "720p">("1080p");
  const [watermark, setWatermark] = useState(false);
  const [retrieveMessage, setRetrieveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setTargetType(config.targetType);
    setResolution(config.resolution);
    setWatermark(config.watermarkEnabled);
  }, [config]);

  const handleFormSubmission = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveRecordingConfiguration(targetType, resolution, watermark);
  };

  const handleRetrieveAsset = (videoUrl: string) => {
    if (!isRetrievableUrl(videoUrl)) {
      setRetrieveMessage("Archive asset URL is missing or invalid.");
      return;
    }
    setRetrieveMessage(`Opening archive asset: ${videoUrl}`);
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#050505] p-6 text-white shadow-[0_0_44px_rgba(0,0,0,0.55)] backdrop-blur-md selection:bg-purple-500/30">
      <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="bg-gradient-to-r from-[#00f2ff] to-[#9d00ff] bg-clip-text font-headline text-3xl uppercase tracking-wider text-transparent">
            Cloud DVR & Media Archival Synthesis
          </h2>
          <p className="mt-1 font-body text-xs text-gray-400">
            Configure automated system-level side-rendering pipelines for post-event asset delivery.
          </p>
        </div>
        <button
          type="button"
          disabled={isProcessingJob || isSaving}
          onClick={() => void triggerLiveArchiveProcess()}
          data-testid="simulate-stream-stop-btn"
          className="self-start rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-ui text-xs font-semibold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-200 hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 sm:self-center"
        >
          {isProcessingJob ? "Synthesizing Archives..." : "Simulate Stream Stop"}
        </button>
      </div>

      {errorMessage ? (
        <div
          data-testid="archive-error-alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 p-3 font-body text-sm text-red-400"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          data-testid="archive-success-alert"
          className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 font-body text-sm text-emerald-400"
        >
          {successMessage}
        </div>
      ) : null}

      {retrieveMessage ? (
        <div className="mb-4 rounded-lg border border-sky-500/30 bg-sky-950/30 p-3 font-body text-sm text-sky-200">
          {retrieveMessage}
        </div>
      ) : null}

      <form onSubmit={handleFormSubmission} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col space-y-2">
            <label className="font-ui text-sm font-semibold uppercase tracking-wider text-gray-300">
              Archival Save Target Mode
            </label>
            <select
              value={targetType}
              disabled={isSaving || isProcessingJob}
              onChange={(event) => setTargetType(event.target.value as RecordingTargetType)}
              data-testid="archival-mode-select"
              className="rounded-lg border border-white/10 bg-[#111116] p-3 font-body text-sm text-white transition-all focus:border-[#00f2ff] focus:outline-none disabled:opacity-45"
            >
              <option value="DUAL_TRACK_BOTH">
                Dual Split Tracking (One Video with Chat, One Without)
              </option>
              <option value="CLEAN_ONLY">Clean Production Master Only (No Chat Overlay)</option>
              <option value="BURNED_CHAT_ONLY">
                Interactive Fan Broadcast Only (Burned Live Chat)
              </option>
            </select>
            <p className="font-body text-[11px] text-gray-500">
              Controls whether the recording engine captures the clean feed, the conversation layer,
              or both targets.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-ui text-sm font-semibold uppercase tracking-wider text-gray-300">
              Encoding Capture Profile
            </label>
            <select
              value={resolution}
              disabled={isSaving || isProcessingJob}
              onChange={(event) => setResolution(event.target.value as "1080p" | "720p")}
              data-testid="archival-resolution-select"
              className="rounded-lg border border-white/10 bg-[#111116] p-3 font-body text-sm text-white transition-all focus:border-[#00f2ff] focus:outline-none disabled:opacity-45"
            >
              <option value="1080p">High-Definition Source (1080p60 Pro Broadcast)</option>
              <option value="720p">Standard Optimized Source (720p60 Compressed)</option>
            </select>
            <p className="font-body text-[11px] text-gray-500">
              Higher capture profiles provide crisp post-production assets while increasing storage.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border border-white/5 bg-[#111116]/60 p-4 transition-colors hover:border-white/10">
          <input
            type="checkbox"
            id="watermark-toggle"
            checked={watermark}
            disabled={isSaving || isProcessingJob}
            onChange={(event) => setWatermark(event.target.checked)}
            data-testid="archival-watermark-checkbox"
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-black text-[#00f2ff] focus:ring-0 focus:ring-offset-0 disabled:opacity-45"
          />
          <div className="flex flex-col">
            <label
              htmlFor="watermark-toggle"
              className="cursor-pointer font-ui text-sm font-semibold uppercase tracking-wider text-gray-200"
            >
              Inject Sovereign Brand Watermark Protection
            </label>
            <span className="mt-0.5 font-body text-xs text-gray-400">
              Burns the protective dynamic watermark identifier onto compiled archival video files.
            </span>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/5 pt-2">
          <button
            type="submit"
            disabled={isSaving || isProcessingJob}
            data-testid="commit-archival-policy-btn"
            className="w-full rounded-lg bg-gradient-to-r from-[#00f2ff] to-[#9d00ff] px-6 py-3 font-ui text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(157,0,255,0.2)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {isSaving ? "Propagating Configuration Rules..." : "Commit Archival Policy"}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-ui text-md font-bold uppercase tracking-wider text-gray-300">
            Generated Show Vault Asset Inventory
          </h3>
          <span
            className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-gray-400"
            data-testid="job-count-badge"
          >
            Records Found: {jobs.length}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div
            data-testid="empty-vault-state"
            className="rounded-lg border border-dashed border-white/10 bg-[#111116]/30 p-8 text-center font-body text-sm text-gray-500"
          >
            No historical archive generation logs detected inside this show archive profile.
            <br />
            Execute the stream-stop simulation to test compilation nodes.
          </div>
        ) : (
          <div className="space-y-4" data-testid="vault-jobs-container">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col space-y-3 rounded-lg border border-white/5 bg-[#111116] p-4 transition-all hover:border-white/10"
              >
                <div className="flex flex-col gap-2 border-b border-white/5 pb-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-gray-400">
                      Run Hash: {job.id.substring(0, 16)}
                    </span>
                    <span
                      className={`rounded border px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wider ${
                        job.status === "COMPLETED"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "animate-pulse border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <span className="font-body text-xs text-gray-500">
                    Timestamp Execution: {new Date(job.startedAt).toLocaleDateString()}{" "}
                    {new Date(job.startedAt).toLocaleTimeString()}
                  </span>
                </div>

                {job.assets.length > 0 ? (
                  <div className="mt-1 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {job.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/40 p-3"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-body text-xs font-semibold text-gray-200">
                            {asset.title}
                          </span>
                          <span className="mt-0.5 font-mono text-[10px] uppercase text-gray-400">
                            {asset.assetType === "CLEAN_RAW"
                              ? "Clean Production Matrix"
                              : "Co-Stream Chat Burn-In"}{" "}
                            | {formatAssetSize(asset.fileSizeMb)}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-testid={`retrieve-asset-${asset.id}`}
                          onClick={() => handleRetrieveAsset(asset.videoUrl)}
                          className="shrink-0 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-ui text-xs font-medium uppercase tracking-wider transition-all hover:bg-white/10 hover:text-[#00f2ff]"
                        >
                          Retrieve Asset
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/10 bg-amber-950/20 p-3 font-body text-xs text-amber-400">
                    Server-side rendering engine active. Compiling parallel video tracks into archive buckets...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
