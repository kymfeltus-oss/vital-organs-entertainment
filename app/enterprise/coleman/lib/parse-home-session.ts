import type { ColemanHomeSession, ChordBlock, VoicingPill } from "./home-types";
import type { TheoryEntry } from "./types";

const ROMAN_BY_DEGREE: Record<string, string> = {
  "1": "I",
  "2": "ii",
  "3": "III",
  "4": "IV",
  "5": "V",
  "6": "vi",
  "7": "vii°",
};

function parseChords(raw: string): string[] {
  return raw
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNumerals(raw: string): string[] {
  return raw
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function inferKeyQuality(root: string): string {
  if (/m(?!aj)/i.test(root) || root.includes("m")) return "MINOR";
  return "MAJOR";
}

function buildVoicings(chords: string[]): VoicingPill[] {
  if (chords.length < 2) {
    return [{ id: "v-add", label: "+ " }];
  }

  const pairs: VoicingPill[] = [];
  for (let i = 0; i < Math.min(chords.length - 1, 4); i += 1) {
    pairs.push({
      id: `v-${i}`,
      label: `[ ${chords[i]} / ${chords[i + 1]} ]`,
    });
  }
  pairs.push({ id: "v-add", label: "[ + ]" });
  return pairs;
}

export function buildHomeSessionFromTheory(entry: TheoryEntry): ColemanHomeSession {
  const chords = parseChords(entry.key);
  const numerals = parseNumerals(entry.progressionLabel);
  const root = chords[0] ?? "Open";

  const progression: ChordBlock[] = chords.map((chord, index) => ({
    id: `chord-${index}`,
    chord,
    roman: ROMAN_BY_DEGREE[numerals[index] ?? ""] ?? numerals[index] ?? "I",
    isActive: index === 0,
  }));

  const quality = inferKeyQuality(root);
  const displayRoot = root.replace(/m$/i, "");

  return {
    noteLabel: "CURRENT KEY",
    currentKey: displayRoot,
    keyQuality: `${displayRoot} ${quality}`,
    keyBadge: "6 b",
    flatBadge: { symbol: "♭", label: "FLAT" },
    sharpBadge: { symbol: "♯", label: "SHARP" },
    progressionTitle: "CHORD PROGRESSION",
    barCount: Math.max(progression.length * 2, 8),
    progression,
    intelligence: {
      isLive: true,
      functionLabel: "FUNCTION",
      functionValue: quality === "MAJOR" ? "TONIC / I" : "TONIC / i",
      cadenceLabel: "CADENCE POTENTIAL",
      cadenceValue: "STRONG",
      cadencePercent: 70,
      dialPrimary: root,
      dialSecondary: `${root} ${quality}`,
      nashvilleLabel: "NASHVILLE NUMBER",
      nashvilleValue: "1 / I",
      scaleDegreeLabel: "SCALE DEGREE",
      scaleDegreeValue: "1 / 7",
      voicings: buildVoicings(chords),
    },
  };
}

export function emptyHomeSession(): ColemanHomeSession {
  return {
    noteLabel: "CURRENT KEY",
    currentKey: "—",
    keyQuality: "—",
    keyBadge: "—",
    flatBadge: { symbol: "♭", label: "FLAT" },
    sharpBadge: { symbol: "♯", label: "SHARP" },
    progressionTitle: "CHORD PROGRESSION",
    barCount: 0,
    progression: [],
    intelligence: {
      isLive: false,
      functionLabel: "FUNCTION",
      functionValue: "—",
      cadenceLabel: "CADENCE POTENTIAL",
      cadenceValue: "—",
      cadencePercent: 0,
      dialPrimary: "—",
      dialSecondary: "—",
      nashvilleLabel: "NASHVILLE NUMBER",
      nashvilleValue: "—",
      scaleDegreeLabel: "SCALE DEGREE",
      scaleDegreeValue: "—",
      voicings: [{ id: "v-add", label: "[ + ]" }],
    },
  };
}
