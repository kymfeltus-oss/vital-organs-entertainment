import { createDefaultRoutingConfig } from "./routing-dev-store";
import {
  lowPassForInputSource,
  type AudioRoutingConfigRecord,
  type RoutingInputSource,
  type RoutingSelectedMode,
} from "./routing-persistence";

const STORAGE_PREFIX = "coleman-routing-config:";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readLocalRoutingConfig(userId: string): AudioRoutingConfigRecord | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AudioRoutingConfigRecord;
    if (!parsed?.userId || !parsed.selectedMode || !parsed.inputSource) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalRoutingConfig(record: AudioRoutingConfigRecord): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(record.userId), JSON.stringify(record));
  } catch {
    /* quota / private mode */
  }
}

export function resolveLocalRoutingConfig(userId: string): AudioRoutingConfigRecord {
  return readLocalRoutingConfig(userId) ?? createDefaultRoutingConfig(userId);
}

export function mergeLocalRoutingConfig(
  userId: string,
  patch: Partial<{
    selectedMode: RoutingSelectedMode;
    inputSource: RoutingInputSource;
    noiseGateDb: number;
    lowPassCutoffHz: number;
    latencyOffsetMs: number;
  }>,
): AudioRoutingConfigRecord {
  const current = resolveLocalRoutingConfig(userId);
  const nextInputSource = patch.inputSource ?? current.inputSource;
  const updated: AudioRoutingConfigRecord = {
    ...current,
    ...patch,
    userId,
    inputSource: nextInputSource,
    lowPassCutoffHz: patch.lowPassCutoffHz ?? lowPassForInputSource(nextInputSource),
    updatedAt: new Date().toISOString(),
  };
  writeLocalRoutingConfig(updated);
  return updated;
}
