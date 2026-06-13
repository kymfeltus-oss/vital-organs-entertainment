import { isBroadcastDevMode } from "@/lib/broadcast/config";
import { createMockAudioHealthSnapshot } from "@/lib/broadcast/adapters/mockSnapshots";
import type { AudioHealthSnapshot, VmixAdapterSnapshot } from "@/lib/broadcast/adapters/types";

function unavailableSnapshot(error: string): AudioHealthSnapshot {
  return {
    ok: false,
    source: "unavailable",
    error,
    fetchedAt: new Date().toISOString(),
    masterPeak: 0,
    clipping: false,
    silent: true,
    channels: [],
  };
}

function buildFromVmix(vmix: VmixAdapterSnapshot): AudioHealthSnapshot {
  const channels = vmix.inputs
    .filter((input) => input.meterLevel > 0 || input.volume > 0)
    .slice(0, 8)
    .map((input) => {
      const meterLevel = input.meterLevel;
      const clipping = meterLevel >= 95;
      return {
        id: `vmix-audio-${input.number}`,
        name: input.title,
        peakLevel: meterLevel,
        meterLevel,
        volume: input.volume,
        muted: input.muted,
        clipping,
        autoGain: false,
        silent: meterLevel < 4 && !input.muted,
      };
    });

  const masterPeak = channels.reduce((max, ch) => Math.max(max, ch.peakLevel), 0);

  if (channels.length === 0 && vmix.ok) {
    channels.push({
      id: "vmix-master",
      name: "Master Stream Output",
      peakLevel: 65,
      meterLevel: 65,
      volume: 100,
      muted: false,
      clipping: false,
      autoGain: false,
      silent: false,
    });
  }

  const silent = channels.every((ch) => ch.muted || ch.meterLevel < 4);
  const clipping = channels.some((ch) => ch.clipping);

  return {
    ok: vmix.ok,
    source: vmix.source,
    error: vmix.error,
    fetchedAt: new Date().toISOString(),
    masterPeak: masterPeak || 65,
    clipping,
    silent,
    channels,
  };
}

export async function getAudioHealthSnapshot(
  vmix: VmixAdapterSnapshot,
): Promise<AudioHealthSnapshot> {
  if (vmix.ok && vmix.source === "live" && vmix.inputs.length > 0) {
    return buildFromVmix(vmix);
  }

  if (isBroadcastDevMode()) {
    return createMockAudioHealthSnapshot();
  }

  if (vmix.ok && vmix.inputs.length > 0) {
    return buildFromVmix(vmix);
  }

  return unavailableSnapshot(
    vmix.error ?? "No audio telemetry — configure vMix or enable BROADCAST_DEV_MODE.",
  );
}
