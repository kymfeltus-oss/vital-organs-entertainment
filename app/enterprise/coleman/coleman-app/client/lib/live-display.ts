import {
  STANDBY_BAR_COUNT_LABEL,
  STANDBY_CHORD_PROGRESSION,
  STANDBY_KEY_BADGE,
  STANDBY_KEY_QUALITY,
  STANDBY_SESSION_TONIC,
  createStandbyLiveState,
} from "./default-standby-session";
import { deriveLiveIntelligence, parseProgressionEntry } from "./live-theory";
import type { LiveColemanState } from "./live-types";

export function liveFallback(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "—";
}

export function formatCentsBadge(cents: number): string | null {
  if (!Number.isFinite(cents) || cents === 0) {
    return null;
  }
  const magnitude = Math.min(50, Math.abs(Math.round(cents)));
  return cents > 0 ? `${magnitude} ♯` : `${magnitude} ♭`;
}

export function formatKeyDisplay(
  currentKey: string | null,
  sessionTonic: string | null,
  cents: number,
  isStandby = false,
): {
  keyLabel: string;
  qualityLabel: string;
  badgeLabel: string | null;
} {
  if (isStandby) {
    return {
      keyLabel: STANDBY_SESSION_TONIC,
      qualityLabel: STANDBY_KEY_QUALITY,
      badgeLabel: STANDBY_KEY_BADGE,
    };
  }

  const keyLabel = liveFallback(currentKey);
  const qualityLabel = liveFallback(sessionTonic ? `${sessionTonic} MAJOR` : null);
  const badgeLabel = formatCentsBadge(cents);

  return {
    keyLabel,
    qualityLabel,
    badgeLabel,
  };
}

export function formatBarCountLabel(chordCount: number, isStandby = false): string {
  if (isStandby) {
    return STANDBY_BAR_COUNT_LABEL;
  }
  if (chordCount <= 0) {
    return STANDBY_BAR_COUNT_LABEL;
  }
  return `${chordCount * 2} BARS`;
}

export function functionPillFromName(functionName: string | null): string | null {
  if (!functionName) {
    return null;
  }
  const parts = functionName.split("/").map((part) => part.trim());
  return parts.length >= 2 ? parts[parts.length - 1] : null;
}

export function resolveDisplayLiveState(
  liveData: LiveColemanState,
  activeChordIndex: number | null,
  isLiveEngaged: boolean,
): LiveColemanState {
  if (isLiveEngaged) {
    return liveData;
  }

  const index = activeChordIndex ?? 0;
  const progression = [...STANDBY_CHORD_PROGRESSION];
  const activeEntry = progression[index] ?? progression[0];
  const activeChord = parseProgressionEntry(activeEntry).chord;

  return {
    ...createStandbyLiveState(index),
    isMicActive: liveData.isMicActive,
    intelligence: {
      ...deriveLiveIntelligence({
        detectedNote: activeChord,
        sessionTonic: STANDBY_SESSION_TONIC,
        cents: 0,
        chordProgression: progression,
        activeChordIndex: index,
      }),
      status: liveData.intelligence.status,
    },
  };
}

export { parseProgressionEntry };
