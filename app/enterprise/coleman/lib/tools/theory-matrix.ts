import {
  normalizeNoteName,
  semitoneToNote,
  spellNote,
  type NoteSpelling,
} from "@/app/enterprise/coleman/lib/live-theory";

export const THEORY_ROOT_KEYS = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

const ROOT_SEMITONES: Record<TheoryRootKey, number> = {
  C: 0,
  Db: 1,
  D: 2,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  Ab: 8,
  A: 9,
  Bb: 10,
  B: 11,
};

const FLAT_ROOTS = new Set<TheoryRootKey>(["F", "Bb", "Eb", "Ab", "Db"]);

export type TheoryRootKey = (typeof THEORY_ROOT_KEYS)[number];
export type ScaleMode = "major" | "minor";

export type TheoryDegreeRow = {
  degree: number;
  nashville: string;
  roman: string;
  chord: string;
  function: string;
};

export type VoicingHint = {
  label: string;
  notes: string;
  shape: string;
};

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const MINOR_ROMANS = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;

const MAJOR_QUALITIES = ["M", "m", "m", "M", "M", "m", "dim"] as const;
const MINOR_QUALITIES = ["m", "dim", "M", "m", "m", "M", "M"] as const;

const MAJOR_FUNCTIONS = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Leading",
] as const;

const MINOR_FUNCTIONS = [
  "Tonic",
  "Supertonic",
  "Mediant",
  "Subdominant",
  "Dominant",
  "Submediant",
  "Subtonic",
] as const;

function chordSymbol(root: string, quality: (typeof MAJOR_QUALITIES)[number]): string {
  if (quality === "M") {
    return root;
  }
  if (quality === "m") {
    return `${root}m`;
  }
  return `${root}dim`;
}

function spellingForRoot(root: TheoryRootKey): NoteSpelling {
  return FLAT_ROOTS.has(root) || root.includes("b") ? "flat" : "sharp";
}

function scaleNotes(root: TheoryRootKey, mode: ScaleMode): string[] {
  const tonic = ROOT_SEMITONES[root];
  const spelling = spellingForRoot(root);
  const intervals = mode === "major" ? MAJOR_INTERVALS : NATURAL_MINOR_INTERVALS;

  return intervals.map((interval) => {
    const pitchClass = semitoneToNote(tonic + interval);
    return spellNote(pitchClass, spelling) ?? pitchClass;
  });
}

export function buildTheoryMatrix(root: TheoryRootKey, mode: ScaleMode): TheoryDegreeRow[] {
  const notes = scaleNotes(root, mode);
  const romans = mode === "major" ? MAJOR_ROMANS : MINOR_ROMANS;
  const qualities = mode === "major" ? MAJOR_QUALITIES : MINOR_QUALITIES;
  const functions = mode === "major" ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS;

  return notes.map((note, index) => ({
    degree: index + 1,
    nashville: String(index + 1),
    roman: romans[index],
    chord: chordSymbol(note, qualities[index]),
    function: functions[index],
  }));
}

const OPEN_VOICING_LIBRARY: Record<string, VoicingHint[]> = {
  C: [
    { label: "I — C", notes: "C / E / G", shape: "x32010 open C" },
    { label: "IV — F", notes: "F / A / C", shape: "133211 barre F" },
    { label: "V — G", notes: "G / B / D", shape: "320003 open G" },
    { label: "vi — Am", notes: "A / C / E", shape: "x02210 open Am" },
  ],
  G: [
    { label: "I — G", notes: "G / B / D", shape: "320003 open G" },
    { label: "ii — Am", notes: "A / C / E", shape: "x02210 open Am" },
    { label: "IV — C", notes: "C / E / G", shape: "x32010 open C" },
    { label: "V — D", notes: "D / F# / A", shape: "xx0232 open D" },
  ],
  D: [
    { label: "I — D", notes: "D / F# / A", shape: "xx0232 open D" },
    { label: "ii — Em", notes: "E / G / B", shape: "022000 open Em" },
    { label: "IV — G", notes: "G / B / D", shape: "320003 open G" },
    { label: "V — A", notes: "A / C# / E", shape: "x02220 open A" },
  ],
};

function normalizeRootForLookup(root: TheoryRootKey): string {
  return normalizeNoteName(root) ?? root;
}

export function voicingHintsForKey(root: TheoryRootKey, mode: ScaleMode): VoicingHint[] {
  const matrix = buildTheoryMatrix(root, mode);
  const lookupRoot = normalizeRootForLookup(root);
  const preset = OPEN_VOICING_LIBRARY[lookupRoot];

  if (preset) {
    return preset;
  }

  return matrix.slice(0, 4).map((row) => ({
    label: `${row.nashville} — ${row.chord}`,
    notes: `${row.chord} triad`,
    shape: `${row.roman} — common root-position voicing`,
  }));
}

export function scaleLabel(root: TheoryRootKey, mode: ScaleMode): string {
  return `${root} ${mode === "major" ? "Major" : "Natural Minor"}`;
}
