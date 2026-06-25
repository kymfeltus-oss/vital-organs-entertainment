import type { AudioChannel } from "@/lib/broadcast/types";
import type { OpsStreamAudioLevels } from "@/lib/ops/ops-stream-state";

const CHANNEL_DEFS: { id: string; name: string; key: keyof OpsStreamAudioLevels }[] = [
  { id: "master", name: "Master", key: "master" },
  { id: "cam1", name: "Cam 1", key: "cam1" },
  { id: "cam2", name: "Cam 2", key: "cam2" },
  { id: "cam3", name: "Cam 3", key: "cam3" },
  { id: "cam4", name: "Cam 4", key: "cam4" },
  { id: "media1", name: "Media 1", key: "media1" },
  { id: "media2", name: "Media 2", key: "media2" },
];

export function audioLevelsToChannels(
  levels: OpsStreamAudioLevels | null | undefined,
): AudioChannel[] {
  if (!levels) return [];

  return CHANNEL_DEFS.map((def) => {
    const meterLevel = levels[def.key] ?? 0;
    return {
      id: def.id,
      name: def.name,
      volume: meterLevel,
      muted: false,
      meterLevel,
      clipping: meterLevel >= 96,
      autoGain: false,
    };
  });
}
