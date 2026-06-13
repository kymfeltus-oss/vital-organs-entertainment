/**
 * DEV_MODE-only adapter snapshots.
 * Never used as production source of truth when live adapters succeed.
 */

import type {
  AudioHealthSnapshot,
  ObsAdapterSnapshot,
  StreamHealthSnapshot,
  VmixAdapterSnapshot,
} from "@/lib/broadcast/adapters/types";

let mockTick = 0;
let mockVmixState: VmixAdapterSnapshot | null = null;
let mockStreamState: StreamHealthSnapshot | null = null;

export function bumpMockTick(): void {
  mockTick += 1;
}

function buildMockVmixBase(): VmixAdapterSnapshot {
  return {
    ok: true,
    source: "mock",
    error: null,
    fetchedAt: new Date().toISOString(),
    version: "25.0.0.0-mock",
    inputs: [
      {
        key: "mock-1",
        number: 1,
        title: "Main Stage",
        type: "Capture",
        muted: false,
        volume: 100,
        meterLevel: 72,
        online: true,
      },
      {
        key: "mock-2",
        number: 2,
        title: "Main Singer",
        type: "NDI",
        muted: false,
        volume: 95,
        meterLevel: 64,
        online: true,
      },
      {
        key: "mock-3",
        number: 3,
        title: "Background Singers",
        type: "SRT",
        muted: false,
        volume: 90,
        meterLevel: 52,
        online: true,
      },
      {
        key: "mock-4",
        number: 4,
        title: "Band",
        type: "Capture",
        muted: false,
        volume: 88,
        meterLevel: 58,
        online: true,
      },
      {
        key: "mock-5",
        number: 5,
        title: "Audience",
        type: "Stream",
        muted: false,
        volume: 80,
        meterLevel: 40,
        online: true,
      },
    ],
    activeInputNumber: 1,
    activeInputTitle: "Main Stage",
    previewInputNumber: 2,
    previewInputTitle: "Main Singer",
    isRecording: true,
    isStreaming: false,
  };
}

/** Returns persistent dev snapshot with light meter jitter on each poll. */
export function getMockVmixSnapshot(): VmixAdapterSnapshot {
  bumpMockTick();
  if (!mockVmixState) {
    mockVmixState = buildMockVmixBase();
  }

  const jitter = mockTick % 5;
  mockVmixState = {
    ...mockVmixState,
    fetchedAt: new Date().toISOString(),
    inputs: mockVmixState.inputs.map((input, index) => ({
      ...input,
      meterLevel: Math.min(
        100,
        (buildMockVmixBase().inputs[index]?.meterLevel ?? input.meterLevel) + jitter,
      ),
      online: input.number === 5 ? jitter !== 3 : input.online,
    })),
  };

  return mockVmixState;
}

export function updateMockVmixSnapshot(
  updater: (current: VmixAdapterSnapshot) => VmixAdapterSnapshot,
): VmixAdapterSnapshot {
  const current = mockVmixState ?? buildMockVmixBase();
  mockVmixState = updater({ ...current, fetchedAt: new Date().toISOString() });
  return mockVmixState;
}

/** @deprecated Use getMockVmixSnapshot for stateful dev polling. */
export function createMockVmixSnapshot(): VmixAdapterSnapshot {
  return getMockVmixSnapshot();
}

export function createMockObsSnapshot(): ObsAdapterSnapshot {
  return {
    ok: true,
    source: "mock",
    connected: true,
    error: null,
    fetchedAt: new Date().toISOString(),
    scenes: [
      { name: "Main Stage", isActive: true, isPreview: false },
      { name: "Main Singer", isActive: false, isPreview: true },
      { name: "Band", isActive: false, isPreview: false },
    ],
    currentScene: "Main Stage",
    previewScene: "Main Singer",
    streaming: false,
    recording: true,
  };
}

export function createMockStreamHealthSnapshot(): StreamHealthSnapshot {
  if (!mockStreamState) {
    mockStreamState = {
      ok: true,
      source: "mock",
      error: null,
      fetchedAt: new Date().toISOString(),
      bitrateKbps: 5800,
      droppedFrames: 0,
      packetLossPercent: 0.4,
      bitrateStable: true,
      internetStatus: "online",
      destinations: [
        {
          id: "restream",
          name: "Restream",
          connected: true,
          live: false,
          bitrateKbps: 0,
          error: null,
          droppedFrames: 0,
        },
        {
          id: "youtube",
          name: "YouTube",
          connected: true,
          live: false,
          bitrateKbps: 0,
          error: null,
          droppedFrames: 0,
        },
        {
          id: "facebook",
          name: "Facebook",
          connected: false,
          live: false,
          bitrateKbps: 0,
          error: "Awaiting encoder handshake",
          droppedFrames: 0,
        },
        {
          id: "custom_rtmp",
          name: "Custom RTMP",
          connected: true,
          live: false,
          bitrateKbps: 0,
          error: null,
          droppedFrames: 0,
        },
      ],
    };
  }

  return {
    ...mockStreamState,
    fetchedAt: new Date().toISOString(),
  };
}

export function updateMockStreamHealthSnapshot(
  updater: (current: StreamHealthSnapshot) => StreamHealthSnapshot,
): StreamHealthSnapshot {
  const current = createMockStreamHealthSnapshot();
  mockStreamState = updater({ ...current, fetchedAt: new Date().toISOString() });
  return mockStreamState;
}

export function createMockAudioHealthSnapshot(): AudioHealthSnapshot {
  const jitter = mockTick % 7;
  const channels = [
    {
      id: "audio-lead",
      name: "Lead Mic",
      peakLevel: 62 + jitter,
      meterLevel: 62 + jitter,
      volume: 78,
      muted: false,
      clipping: false,
      autoGain: true,
      silent: false,
    },
    {
      id: "audio-bgv",
      name: "BGV Mics",
      peakLevel: 48,
      meterLevel: 48,
      volume: 64,
      muted: false,
      clipping: false,
      autoGain: true,
      silent: false,
    },
    {
      id: "audio-band",
      name: "Band Line",
      peakLevel: 55 + jitter,
      meterLevel: 55 + jitter,
      volume: 70,
      muted: false,
      clipping: jitter === 6,
      autoGain: false,
      silent: false,
    },
    {
      id: "audio-crowd",
      name: "Crowd Ambience",
      peakLevel: 28,
      meterLevel: 28,
      volume: 42,
      muted: false,
      clipping: false,
      autoGain: false,
      silent: false,
    },
    {
      id: "audio-master",
      name: "Master Stream Output",
      peakLevel: 68 + jitter,
      meterLevel: 68 + jitter,
      volume: 85,
      muted: false,
      clipping: false,
      autoGain: false,
      silent: false,
    },
  ];

  return {
    ok: true,
    source: "mock",
    error: null,
    fetchedAt: new Date().toISOString(),
    masterPeak: 68 + jitter,
    clipping: channels.some((ch) => ch.clipping),
    silent: channels.every((ch) => ch.meterLevel < 4),
    channels,
  };
}
