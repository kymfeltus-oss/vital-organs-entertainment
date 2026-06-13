import { getAudioHealthSnapshot } from "@/lib/broadcast/adapters/audioHealthAdapter";
import { getObsAdapterSnapshot } from "@/lib/broadcast/adapters/obsAdapter";
import { getStreamHealthSnapshot } from "@/lib/broadcast/adapters/streamHealthAdapter";
import type { AdapterBundle } from "@/lib/broadcast/adapters/types";
import {
  getVmixAdapterSnapshot,
  inferConnectionType,
  resolveVmixSourceId,
} from "@/lib/broadcast/adapters/vmixAdapter";
import { isBroadcastDevMode } from "@/lib/broadcast/config";
import type {
  AudioChannel,
  BroadcastSource,
  ProductionState,
  ProductionStore,
  StreamDestination,
} from "@/lib/broadcast/types";

function mapVmixSources(vmix: AdapterBundle["vmix"]): BroadcastSource[] {
  return vmix.inputs.map((input) => ({
    id: resolveVmixSourceId(input.number) ?? `vmix-${input.number}`,
    name: input.title,
    connectionType: inferConnectionType(input.type),
    online: input.online,
    isDark: input.online && input.meterLevel < 8,
    isOverexposed: input.meterLevel >= 98,
    signalStrength: input.online ? Math.max(40, input.meterLevel) : 0,
    vmixInputNumber: input.number,
    adapterSource: "vmix" as const,
  }));
}

function mapAudioChannels(audio: AdapterBundle["audioHealth"]): AudioChannel[] {
  if (audio.channels.length === 0) {
    return [];
  }

  return audio.channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    volume: channel.volume,
    muted: channel.muted,
    meterLevel: channel.meterLevel,
    clipping: channel.clipping,
    autoGain: channel.autoGain,
  }));
}

function mapDestinations(stream: AdapterBundle["streamHealth"]): StreamDestination[] {
  return stream.destinations.map(({ droppedFrames: _dropped, ...dest }) => dest);
}

function buildProductionState(
  bundle: AdapterBundle,
  previewSourceId: string | null,
  programSourceId: string | null,
): ProductionState {
  return {
    previewSourceId,
    programSourceId,
    isLive: bundle.vmix.isStreaming || bundle.streamHealth.destinations.some((d) => d.live),
    isRecording: bundle.vmix.isRecording || bundle.obs.recording,
    lastTransition: null,
    stingerActive: false,
    fadeProgress: 1,
    supervisorOverride: false,
    supervisorReason: "",
    storageAvailableGb: 128,
  };
}


export async function fetchAdapterBundle(): Promise<AdapterBundle> {
  const devMode = isBroadcastDevMode();
  const vmix = await getVmixAdapterSnapshot();
  const [obs, streamHealth] = await Promise.all([
    getObsAdapterSnapshot(),
    getStreamHealthSnapshot(),
  ]);
  const audioHealth = await getAudioHealthSnapshot(vmix);

  return { devMode, vmix, obs, streamHealth, audioHealth };
}

export function hydrateProductionStore(
  bundle: AdapterBundle,
  uiOverrides?: Partial<Pick<ProductionState, "supervisorOverride" | "supervisorReason">>,
): ProductionStore {
  const sources = mapVmixSources(bundle.vmix);
  const previewSourceId = resolveVmixSourceId(bundle.vmix.previewInputNumber);
  const programSourceId = resolveVmixSourceId(bundle.vmix.activeInputNumber);

  const production = {
    ...buildProductionState(bundle, previewSourceId, programSourceId),
    ...uiOverrides,
  };

  const usingMock =
    bundle.devMode &&
    (bundle.vmix.source === "mock" ||
      bundle.streamHealth.source === "mock" ||
      bundle.audioHealth.source === "mock");

  return {
    sources,
    audioChannels: mapAudioChannels(bundle.audioHealth),
    destinations: mapDestinations(bundle.streamHealth),
    production,
    meta: {
      hydratedAt: new Date().toISOString(),
      devMode: bundle.devMode,
      vmixConnected: bundle.vmix.ok && bundle.vmix.source === "live",
      obsConnected: bundle.obs.connected && bundle.obs.source === "live",
      streamHealthConnected: bundle.streamHealth.ok,
      audioHealthConnected: bundle.audioHealth.ok,
      dataSource: usingMock ? "mock" : bundle.vmix.ok ? "live" : "mixed",
      adapterErrors: [
        bundle.vmix.error,
        bundle.obs.error,
        bundle.streamHealth.error,
        bundle.audioHealth.error,
      ].filter(Boolean) as string[],
    },
    adapters: {
      vmix: bundle.vmix,
      obs: bundle.obs,
      streamHealth: bundle.streamHealth,
      audioHealth: bundle.audioHealth,
    },
  } as unknown as ProductionStore;
}

export async function loadProductionStore(
  uiOverrides?: Partial<Pick<ProductionState, "supervisorOverride" | "supervisorReason">>,
): Promise<ProductionStore> {
  const bundle = await fetchAdapterBundle();
  return hydrateProductionStore(bundle, uiOverrides);
}
