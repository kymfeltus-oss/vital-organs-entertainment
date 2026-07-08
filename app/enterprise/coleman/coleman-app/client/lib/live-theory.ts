import type { LiveColemanState } from "./live-types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const MAJOR_NASHVILLE = ["1", "2", "3", "4", "5", "6", "7"] as const;

const FUNCTION_LABELS: Record<string, string> = {
  I: "TONIC",
  ii: "SUPERTONIC",
  iii: "MEDIANT",
  IV: "SUBDOMINANT",
  V: "DOMINANT",
  vi: "SUBMEDIANT",
  "vii°": "LEADING",
};

const FLAT_KEYS: Record<string, number> = {
  C: 0,
  F: 1,
  Bb: 2,
  Eb: 3,
  Ab: 4,
  Db: 5,
  Gb: 6,
  Cb: 7,
};

const SHARP_KEYS: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  "F#": 6,
  "C#": 7,
};

export function normalizeNoteName(note: string): string | null {
  const trimmed = note.trim();
  if (!trimmed || trimmed === "—") {
    return null;
  }
  const match = trimmed.match(/^([A-Ga-g])([#b♭♯]?)/);
  if (!match) {
    return null;
  }
  const letter = match[1].toUpperCase();
  const accidental = match[2];
  if (accidental === "b" || accidental === "♭") {
    const flatMap: Record<string, string> = {
      C: "B",
      D: "Db",
      E: "Eb",
      F: "F",
      G: "Gb",
      A: "Ab",
      B: "Bb",
    };
    return flatMap[letter] ?? null;
  }
  if (accidental === "#" || accidental === "♯") {
    return `${letter}#`;
  }
  return letter;
}

export function noteToSemitone(note: string): number | null {
  const normalized = normalizeNoteName(note);
  if (!normalized) {
    return null;
  }
  const index = NOTE_NAMES.indexOf(normalized as (typeof NOTE_NAMES)[number]);
  return index >= 0 ? index : null;
}

export function semitoneToNote(semitone: number): string {
  return NOTE_NAMES[((semitone % 12) + 12) % 12];
}

export function intervalSemitones(fromNote: string, toNote: string): number | null {
  const from = noteToSemitone(fromNote);
  const to = noteToSemitone(toNote);
  if (from === null || to === null) {
    return null;
  }
  return (to - from + 12) % 12;
}

export function romanForNoteInMajor(tonic: string, note: string): string | null {
  const interval = intervalSemitones(tonic, note);
  if (interval === null) {
    return null;
  }
  const degreeIndex = MAJOR_INTERVALS.indexOf(interval);
  if (degreeIndex < 0) {
    return null;
  }
  return MAJOR_ROMANS[degreeIndex];
}

export function nashvilleForNoteInMajor(tonic: string, note: string): string | null {
  const interval = intervalSemitones(tonic, note);
  if (interval === null) {
    return null;
  }
  const degreeIndex = MAJOR_INTERVALS.indexOf(interval);
  if (degreeIndex < 0) {
    return null;
  }
  return MAJOR_NASHVILLE[degreeIndex];
}

export function functionLabelForRoman(roman: string): string {
  return FUNCTION_LABELS[roman] ?? "CHORD";
}

export function formatProgressionEntry(chord: string, tonic: string | null): string {
  if (!tonic) {
    return chord;
  }
  const roman = romanForNoteInMajor(tonic, chord);
  return roman ? `${chord} / ${roman}` : chord;
}

export function parseProgressionEntry(entry: string): { chord: string; roman: string | null } {
  const parts = entry.split("/").map((part) => part.trim());
  if (parts.length >= 2) {
    return { chord: parts[0], roman: parts.slice(1).join(" / ") };
  }
  return { chord: entry.trim(), roman: null };
}

export function keySignatureBadge(tonic: string | null): string | null {
  if (!tonic) {
    return null;
  }
  const normalized = normalizeNoteName(tonic);
  if (!normalized) {
    return null;
  }
  const flats = FLAT_KEYS[normalized];
  if (flats !== undefined && flats > 0) {
    return `${flats} ♭`;
  }
  const sharps = SHARP_KEYS[normalized];
  if (sharps !== undefined && sharps > 0) {
    return `${sharps} ♯`;
  }
  return null;
}

export function formatKeyQuality(tonic: string | null): string | null {
  if (!tonic) {
    return null;
  }
  const normalized = normalizeNoteName(tonic);
  return normalized ? `${normalized} MAJOR` : null;
}

export function suggestedVoicingsFromProgression(
  progression: string[],
  activeIndex: number | null,
): string[] {
  if (progression.length === 0) {
    return [];
  }
  const index = activeIndex ?? 0;
  const current = parseProgressionEntry(progression[index] ?? progression[0]).chord;
  const next = parseProgressionEntry(
    progression[Math.min(index + 1, progression.length - 1)],
  ).chord;
  const prev = parseProgressionEntry(progression[Math.max(index - 1, 0)]).chord;

  const pairs = [
    `${current} / ${next}`,
    `${prev} / ${current}`,
    `${current} / ${prev}`,
    `${next} / ${current}`,
  ];

  return [...new Set(pairs)].slice(0, 4);
}

export type DerivedIntelligenceInput = {
  detectedNote: string | null;
  sessionTonic: string | null;
  cents: number;
  chordProgression: string[];
  activeChordIndex: number | null;
};

export function deriveLiveIntelligence(input: DerivedIntelligenceInput): LiveColemanState["intelligence"] {
  const { detectedNote, sessionTonic, cents, chordProgression, activeChordIndex } = input;

  if (!detectedNote && chordProgression.length === 0) {
    return {
      status: "LIVE",
      functionName: null,
      cadencePotential: null,
      cadenceScore: 0,
      nashvilleNumber: null,
      scaleDegree: null,
      suggestedVoicings: [],
    };
  }

  const activeEntry =
    activeChordIndex !== null && chordProgression[activeChordIndex]
      ? chordProgression[activeChordIndex]
      : null;

  const activeParsed = activeEntry ? parseProgressionEntry(activeEntry) : null;
  const tonic = sessionTonic ?? activeParsed?.chord ?? detectedNote;
  const chordRoot = activeParsed?.chord ?? detectedNote;

  if (!tonic || !chordRoot) {
    return {
      status: "LIVE",
      functionName: null,
      cadencePotential: null,
      cadenceScore: 0,
      nashvilleNumber: null,
      scaleDegree: null,
      suggestedVoicings: [],
    };
  }

  const roman =
    activeParsed?.roman ?? romanForNoteInMajor(tonic, chordRoot) ?? null;
  const nashville = nashvilleForNoteInMajor(tonic, chordRoot);
  const functionBase = roman ? functionLabelForRoman(roman) : null;
  const functionName = functionBase && roman ? `${functionBase} / ${roman}` : null;

  const centMagnitude = Math.min(50, Math.abs(Math.round(cents)));
  const cadenceScore = Math.max(0, Math.min(100, 100 - centMagnitude * 2));
  let cadencePotential: string | null = null;
  if (centMagnitude <= 5) {
    cadencePotential = "STRONG";
  } else if (centMagnitude <= 15) {
    cadencePotential = "MODERATE";
  } else if (detectedNote) {
    cadencePotential = "DRIFTING";
  }

  const scaleDegree =
    nashville && tonic ? `${nashville} / 7` : null;

  return {
    status: "LIVE",
    functionName,
    cadencePotential,
    cadenceScore,
    nashvilleNumber: nashville,
    scaleDegree,
    suggestedVoicings: suggestedVoicingsFromProgression(chordProgression, activeChordIndex),
  };
}
