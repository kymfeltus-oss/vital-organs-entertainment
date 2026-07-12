"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import type {
  LivBroadcastAudioRoutingRecord,
  LivCommentaryTrack,
  LivMasterOutputMode,
  LivOnCourseMatrixChannel,
} from "@/app/enterprise/liv-golf/lib/audio-store";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

type LivBroadcastAudioPanelProps = {
  roomId?: string;
  disabled?: boolean;
};

const MASTER_OUTPUT_OPTIONS: { value: LivMasterOutputMode; label: string }[] = [
  { value: "WORLD_MIX", label: "World Mix" },
  { value: "CLEAN_WORLD", label: "Clean World" },
  { value: "ON_COURSE_AMBIENT", label: "On-Course Ambient" },
  { value: "SPANISH_WORLD", label: "Spanish World" },
  { value: "AUGMENTED_IFB", label: "Augmented IFB" },
];

export default function LivBroadcastAudioPanel({
  roomId = LIV_GOLF_TOUR_MAIN_ROOM,
  disabled = false,
}: LivBroadcastAudioPanelProps) {
  const [routing, setRouting] = useState<LivBroadcastAudioRoutingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadRouting = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${getClientAppUrl()}/api/enterprise/liv-golf/audio/routing?roomId=${encodeURIComponent(roomId)}`,
        { credentials: "include", cache: "no-store" },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        routing?: LivBroadcastAudioRoutingRecord;
      };

      if (!response.ok || !payload.success || !payload.routing) {
        throw new Error(payload.error ?? `Unable to load audio routing (${response.status}).`);
      }

      setRouting(payload.routing);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Audio routing load failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadRouting();
  }, [loadRouting]);

  const persistRouting = useCallback(
    async (patch: {
      masterOutputMode?: LivMasterOutputMode;
      onCourseMatrix?: LivOnCourseMatrixChannel[];
      commentaryTracks?: LivCommentaryTrack[];
    }) => {
      if (!routing || disabled) return;

      setIsSaving(true);
      setError(null);
      setSaveMessage(null);

      try {
        const response = await fetch(
          `${getClientAppUrl()}/api/enterprise/liv-golf/audio/routing`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId,
              ...patch,
            }),
          },
        );

        const payload = (await response.json()) as {
          success?: boolean;
          error?: string;
          routing?: LivBroadcastAudioRoutingRecord;
        };

        if (!response.ok || !payload.success || !payload.routing) {
          throw new Error(payload.error ?? `Audio routing save failed (${response.status}).`);
        }

        setRouting(payload.routing);
        setSaveMessage("Audio routing matrix saved to production database.");
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : "Audio routing save failed.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [disabled, roomId, routing],
  );

  const updateMatrixChannel = (channelId: string, patch: Partial<LivOnCourseMatrixChannel>) => {
    if (!routing) return;
    const next = routing.onCourseMatrix.map((channel) =>
      channel.channelId === channelId ? { ...channel, ...patch } : channel,
    );
    setRouting({ ...routing, onCourseMatrix: next });
  };

  const updateCommentaryTrack = (trackId: string, patch: Partial<LivCommentaryTrack>) => {
    if (!routing) return;
    const next = routing.commentaryTracks.map((track) =>
      track.trackId === trackId ? { ...track, ...patch } : track,
    );
    setRouting({ ...routing, commentaryTracks: next });
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#141414] p-5">
      <div className="border-b border-white/5 pb-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Broadcast Audio Routing
        </p>
        <h2 className="text-sm font-semibold text-white">Tournament Feed Matrix</h2>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading persisted audio routing state...</p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {saveMessage ? (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </p>
      ) : null}

      {routing ? (
        <div className="mt-4 space-y-5">
          <label className="block text-xs text-zinc-400">
            Master Output Mode
            <select
              value={routing.masterOutputMode}
              disabled={disabled || isSaving}
              onChange={(event) =>
                setRouting({
                  ...routing,
                  masterOutputMode: event.target.value as LivMasterOutputMode,
                })
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
            >
              {MASTER_OUTPUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              On-Course Mic Matrix
            </p>
            <div className="space-y-3">
              {routing.onCourseMatrix.map((channel) => (
                <div
                  key={channel.channelId}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-white/5 bg-black/40 p-3 sm:grid-cols-4"
                >
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-white">{channel.label}</p>
                    <p className="font-mono text-[10px] text-zinc-500">{channel.channelId}</p>
                  </div>
                  <label className="text-xs text-zinc-400">
                    Gain (dB)
                    <input
                      type="number"
                      min={-60}
                      max={12}
                      step={0.5}
                      disabled={disabled || isSaving}
                      value={channel.gainDb}
                      onChange={(event) =>
                        updateMatrixChannel(channel.channelId, {
                          gainDb: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded border border-white/10 bg-black px-2 py-1 text-sm text-white"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      disabled={disabled || isSaving}
                      checked={channel.muted}
                      onChange={(event) =>
                        updateMatrixChannel(channel.channelId, { muted: event.target.checked })
                      }
                    />
                    Muted
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              International Commentary Tracks
            </p>
            <div className="space-y-3">
              {routing.commentaryTracks.map((track) => (
                <div
                  key={track.trackId}
                  className="flex flex-col gap-3 rounded-lg border border-white/5 bg-black/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{track.label}</p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      {track.locale} · {track.trackId}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      disabled={disabled || isSaving}
                      checked={track.active}
                      onChange={(event) =>
                        updateCommentaryTrack(track.trackId, { active: event.target.checked })
                      }
                    />
                    Active on stream
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={disabled || isSaving}
            onClick={() =>
              void persistRouting({
                masterOutputMode: routing.masterOutputMode,
                onCourseMatrix: routing.onCourseMatrix,
                commentaryTracks: routing.commentaryTracks,
              })
            }
            className="rounded-lg bg-white/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving Matrix..." : "Save Audio Routing"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
