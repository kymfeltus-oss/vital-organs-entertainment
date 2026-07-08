import {
  STANDBY_BAR_COUNT_LABEL,
  STANDBY_KEY_BADGE,
  STANDBY_SESSION_TONIC,
  createStandbyLiveState,
} from "./default-standby-session";
import {
  formatKeyQuality,
  keySignatureBadge,
  parseProgressionEntry,
  spellNote,
  type NoteSpelling,
} from "./live-theory";
import type { LiveColemanState } from "./types";

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
  noteSpelling: NoteSpelling = "flat",
): {
  keyLabel: string;
  qualityLabel: string;
  badgeLabel: string | null;
} {
  if (isStandby) {
    const standbyKey = spellNote(STANDBY_SESSION_TONIC, noteSpelling) ?? STANDBY_SESSION_TONIC;
    return {
      keyLabel: standbyKey,
      qualityLabel: `${standbyKey} MAJOR`,
      badgeLabel: STANDBY_KEY_BADGE,
    };
  }

  const keyLabel = liveFallback(spellNote(currentKey, noteSpelling));
  const spelledKey = currentKey ? spellNote(currentKey, noteSpelling) : null;
  const spelledTonic = sessionTonic ? spellNote(sessionTonic, noteSpelling) : spelledKey;
  const qualityLabel = liveFallback(formatKeyQuality(spelledTonic));
  const badgeLabel =
    formatCentsBadge(cents) ?? keySignatureBadge(spelledTonic ?? spelledKey);

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
  if (isLiveEngaged || liveData.currentKey) {
    return liveData;
  }

  void activeChordIndex;
  return {
    ...createStandbyLiveState(),
    isMicActive: liveData.isMicActive,
  };
}

export { parseProgressionEntry };
