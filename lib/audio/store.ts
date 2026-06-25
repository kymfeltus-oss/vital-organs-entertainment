"use client";

import { create } from "zustand";
import type {
  AudioAlert,
  AudioHealthReport,
  AudioOverviewCard,
  AudioStatus,
  DelayState,
  FeedbackState,
  LiveAudioBus,
  LiveAudioChannel,
  LoudnessState,
  WaveformLane,
  WirelessDevice,
} from "@/lib/audio/types";

type ConnectionState = "connected" | "disconnected" | "reconnecting";

type AudioStore = {
  connection: ConnectionState;
  status: AudioStatus | null;
  overview: AudioOverviewCard[];
  channels: LiveAudioChannel[];
  buses: LiveAudioBus[];
  alerts: AudioAlert[];
  wireless: WirelessDevice[];
  loudness: LoudnessState | null;
  delay: DelayState | null;
  feedback: FeedbackState | null;
  waveforms: WaveformLane[];
  health: AudioHealthReport | null;
  error: string | null;
  setConnection: (connection: ConnectionState) => void;
  setError: (error: string | null) => void;
  applyLiveSnapshot: (payload: Record<string, unknown>) => void;
};

export const useAudioStore = create<AudioStore>((set) => ({
  connection: "disconnected",
  status: null,
  overview: [],
  channels: [],
  buses: [],
  alerts: [],
  wireless: [],
  loudness: null,
  delay: null,
  feedback: null,
  waveforms: [],
  health: null,
  error: null,
  setConnection: (connection) => set({ connection }),
  setError: (error) => set({ error }),
  applyLiveSnapshot: (payload) =>
    set({
      status: (payload.status as AudioStatus) ?? null,
      overview: (payload.overview as AudioOverviewCard[]) ?? [],
      channels: (payload.channels as LiveAudioChannel[]) ?? [],
      buses: (payload.buses as LiveAudioBus[]) ?? [],
      alerts: (payload.alerts as AudioAlert[]) ?? [],
      wireless: (payload.wireless as WirelessDevice[]) ?? [],
      loudness: (payload.loudness as LoudnessState) ?? null,
      delay: (payload.delay as DelayState) ?? null,
      feedback: (payload.feedback as FeedbackState) ?? null,
      waveforms: (payload.waveforms as WaveformLane[]) ?? [],
      health: (payload.health as AudioHealthReport) ?? null,
    }),
}));
