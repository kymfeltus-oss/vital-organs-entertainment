"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";

type AudioChannelState = {
  id: string;
  event_id: string;
  channel_id: string;
  label: string;
  level: number;
  solo: boolean;
  mute: boolean;
  updated_at: string;
};

type MasterAudioSettings = Record<string, unknown>;
type VideoRoutingState = Record<string, unknown> | null;
type ArchiveJobRow = Record<string, unknown>;
type ArchiveAssetRow = Record<string, unknown>;

type ApiResponse = {
  success?: boolean;
  error?: string;
  channels?: AudioChannelState[];
  masterSettings?: MasterAudioSettings;
  routing?: VideoRoutingState;
  jobs?: ArchiveJobRow[];
  assets?: ArchiveAssetRow[];
  job?: { id?: string };
};

type ProductionLiveState = {
  audioChannels: AudioChannelState[];
  masterAudioSettings: MasterAudioSettings;
  videoRouting: VideoRoutingState;
  archiveJobs: ArchiveJobRow[];
  archiveAssets: ArchiveAssetRow[];
  syncLoading: boolean;
  syncError: string | null;
  loadAllData: () => Promise<void>;
  updateFaderState: (channelId: string, level: number, mute: boolean, solo: boolean, label?: string) => Promise<void>;
  updateMasterFXDeck: (
    presetKey: "whiteNoisePreset" | "eqPreset" | "limiterDb" | "aiGainGuardEnabled" | "whiteNoiseSuppressor" | "concertEqPreset" | "masterLimiterCompressor",
    value: unknown,
  ) => Promise<void>;
  switchProgramVideoFeed: (channelSourceId: string, type?: "CUT" | "AUTO_FADE") => Promise<void>;
  updateRestreamTarget: (target: "twitch" | "youtube" | "facebook", enabled: boolean) => Promise<void>;
  triggerCloudArchiveSequence: (showId: string, title: string) => Promise<void>;
};

async function readJson(response: Response): Promise<ApiResponse> {
  const data = (await response.json()) as ApiResponse;
  if (!response.ok || data.success === false) {
    throw new Error(data.error ?? `Request failed (${response.status}).`);
  }
  return data;
}

export const useProductionLiveStore = create<ProductionLiveState>((set, get) => ({
  audioChannels: [],
  masterAudioSettings: {},
  videoRouting: null,
  archiveJobs: [],
  archiveAssets: [],
  syncLoading: false,
  syncError: null,

  loadAllData: async () => {
    set({ syncLoading: true, syncError: null });
    try {
      const [audioRes, videoRes, archiveRes] = await Promise.all([
        fetch("/api/owner/audio/mix-state", { credentials: "include", cache: "no-store" }),
        fetch("/api/owner/video-routing", { credentials: "include", cache: "no-store" }),
        fetch("/api/owner/archive/jobs", { credentials: "include", cache: "no-store" }),
      ]);

      const [audio, video, archive] = await Promise.all([
        readJson(audioRes),
        readJson(videoRes),
        readJson(archiveRes),
      ]);

      set({
        audioChannels: audio.channels ?? [],
        masterAudioSettings: audio.masterSettings ?? {},
        videoRouting: video.routing ?? null,
        archiveJobs: archive.jobs ?? [],
        archiveAssets: archive.assets ?? [],
        syncLoading: false,
        syncError: null,
      });
    } catch (error) {
      set({
        syncError: error instanceof Error ? error.message : "Production live sync failed.",
        syncLoading: false,
      });
    }
  },

  updateFaderState: async (channelId, level, mute, solo, label) => {
    try {
      await readJson(
        await fetch("/api/owner/audio/mix-state", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType: "CHANNEL", channelId, level, mute, solo, label }),
        }),
      );
      await get().loadAllData();
    } catch (error) {
      set({ syncError: error instanceof Error ? error.message : "Failed to commit channel state." });
    }
  },

  updateMasterFXDeck: async (presetKey, value) => {
    try {
      const payload: Record<string, unknown> = { targetType: "MASTER_DECK" };
      payload[presetKey] = value;
      await readJson(
        await fetch("/api/owner/audio/mix-state", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );
      await get().loadAllData();
    } catch (error) {
      set({ syncError: error instanceof Error ? error.message : "Failed to commit master deck state." });
    }
  },

  switchProgramVideoFeed: async (channelSourceId, type = "CUT") => {
    try {
      await readJson(
        await fetch("/api/owner/video-routing", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            active_program_channel_id: channelSourceId,
            transition_type: type,
          }),
        }),
      );
      await get().loadAllData();
    } catch (error) {
      set({ syncError: error instanceof Error ? error.message : "Failed to route program video feed." });
    }
  },

  updateRestreamTarget: async (target, enabled) => {
    try {
      await readJson(
        await fetch("/api/owner/video-routing", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [`${target}_restream_active`]: enabled,
          }),
        }),
      );
      await get().loadAllData();
    } catch (error) {
      set({ syncError: error instanceof Error ? error.message : "Failed to update restream target." });
    }
  },

  triggerCloudArchiveSequence: async (showId, title) => {
    try {
      const initData = await readJson(
        await fetch("/api/owner/archive/jobs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "INITIALIZE_JOB", showId, showTitle: title }),
        }),
      );

      const jobId = initData.job?.id;
      if (!jobId) throw new Error("Archive job was not created.");

      await readJson(
        await fetch("/api/owner/archive/jobs", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "TRIGGER_TRANSCODE_WORKER", jobId, showId }),
        }),
      );
      await get().loadAllData();
    } catch (error) {
      set({ syncError: error instanceof Error ? error.message : "Failed to start archive job sequence." });
    }
  },
}));

export function useProductionLiveSync() {
  const loadAllData = useProductionLiveStore((state) => state.loadAllData);

  useEffect(() => {
    void loadAllData();

    const supabase = getSupabase();
    const channel = supabase
      .channel("master-broadcast-state-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_audio_mix_state" }, () => void loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "audio_master_presets" }, () => void loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_video_routing" }, () => void loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_archive_jobs" }, () => void loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_archive_assets" }, () => void loadAllData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAllData]);
}
