"use client";

import { useMemo, useState } from "react";

type RootKey = "C" | "C#" | "Db" | "D" | "Eb" | "E" | "F" | "F#" | "G" | "Ab" | "A" | "Bb" | "B";
type SystemScaleMode = "Major" | "Minor";

type DegreeRow = {
  numeral: string;
  nns: string;
  chordName: string;
  harmonicRole: string;
  voicingHint: string;
};

const SCALE_INTERVAL_STEPS: Record<SystemScaleMode, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
};

const QUALITIES_MATRIX: Record<SystemScaleMode, string[]> = {
  Major: ["", "m", "m", "", "", "m", "dim"],
  Minor: ["m", "dim", "", "m", "m", "", ""],
};

const ROMAN_MATRIX: Record<SystemScaleMode, string[]> = {
  Major: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
  Minor: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
};

const FUNCTIONAL_ROLES: Record<SystemScaleMode, string[]> = {
  Major: [
    "Tonic (Home)",
    "Subdominant",
    "Tonic Parallel",
    "Subdominant",
    "Dominant (Tension)",
    "Tonic Parallel",
    "Leading Tone",
  ],
  Minor: [
    "Tonic (Home)",
    "Leading Tone",
    "Relative Major",
    "Subdominant",
    "Dominant Minor",
    "Subdominant Parallel",
    "Subtonic",
  ],
};

const CHROMATIC_SCALE_ARRAY = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_SPELLING_DICTIONARY: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "G#": "Ab",
  "A#": "Bb",
};

const ROOT_OPTIONS: RootKey[] = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

function buildNashvilleRows(selectedRoot: RootKey, scaleMode: SystemScaleMode): DegreeRow[] {
  let startIndex = CHROMATIC_SCALE_ARRAY.indexOf(selectedRoot);
  if (startIndex === -1) {
    const sharpEquivalent = Object.keys(FLAT_SPELLING_DICTIONARY).find(
      (key) => FLAT_SPELLING_DICTIONARY[key] === selectedRoot,
    );
    startIndex = sharpEquivalent ? CHROMATIC_SCALE_ARRAY.indexOf(sharpEquivalent) : 0;
  }

  const intervals = SCALE_INTERVAL_STEPS[scaleMode];
  const qualities = QUALITIES_MATRIX[scaleMode];
  const romans = ROMAN_MATRIX[scaleMode];
  const roles = FUNCTIONAL_ROLES[scaleMode];

  return intervals.map((step, index) => {
    const currentChromIdx = (startIndex + step) % 12;
    let rawNoteName = CHROMATIC_SCALE_ARRAY[currentChromIdx];

    if (["Db", "Eb", "Ab", "Bb", "F"].includes(selectedRoot) && FLAT_SPELLING_DICTIONARY[rawNoteName]) {
      rawNoteName = FLAT_SPELLING_DICTIONARY[rawNoteName];
    }

    const quality = qualities[index];
    const chordLabel = `${rawNoteName}${quality}`;

    let substitutionGuide = `${chordLabel}sus4`;
    if (quality === "m") {
      substitutionGuide = `${rawNoteName}7`;
    }
    if (quality === "dim") {
      substitutionGuide = `${CHROMATIC_SCALE_ARRAY[(currentChromIdx + 1) % 12]} / ${rawNoteName}`;
    }

    return {
      numeral: romans[index],
      nns: String(index + 1) + (quality === "m" ? "-" : quality === "dim" ? "°" : ""),
      chordName: chordLabel,
      harmonicRole: roles[index],
      voicingHint: substitutionGuide,
    };
  });
}

export default function ColemanTheoryRoadmap() {
  const [selectedRoot, setSelectedRoot] = useState<RootKey>("G");
  const [scaleMode, setScaleMode] = useState<SystemScaleMode>("Major");

  const roadmapData = useMemo(
    () => buildNashvilleRows(selectedRoot, scaleMode),
    [selectedRoot, scaleMode],
  );

  return (
    <div className="coleman-tool-card coleman-tool-card-wide">
      <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
        Nashville Theory Matrix
      </h2>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
            Tonic Note
          </label>
          <select
            value={selectedRoot}
            onChange={(event) => setSelectedRoot(event.target.value as RootKey)}
            className="w-full rounded-xl border border-[var(--coleman-glass-border)] bg-[var(--coleman-bg-obsidian)] p-3 text-sm font-medium text-[var(--coleman-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--coleman-champagne)]"
          >
            {ROOT_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
            Harmonic Model
          </label>
          <div className="grid grid-cols-2 rounded-xl border border-[var(--coleman-glass-border)] bg-[rgba(0,0,0,0.28)] p-1">
            {(["Major", "Minor"] as SystemScaleMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScaleMode(mode)}
                className={`rounded-lg py-2 text-xs font-medium transition ${
                  scaleMode === mode
                    ? "bg-[rgba(214,179,122,0.12)] text-[var(--coleman-champagne)] shadow-[var(--coleman-glow-gold)]"
                    : "text-[var(--coleman-text-muted)]"
                }`}
                aria-pressed={scaleMode === mode}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border border-[var(--coleman-glass-border)] bg-[rgba(0,0,0,0.28)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--coleman-border-subtle)] bg-[var(--coleman-glass-frost)] text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-muted)]">
              <th className="p-4">NNS</th>
              <th className="p-4">Roman</th>
              <th className="p-4">Chord</th>
              <th className="hidden p-4 sm:table-cell">Harmonic Role</th>
              <th className="p-4">Worship Voicing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--coleman-border-subtle)] text-sm font-medium">
            {roadmapData.map((row) => (
              <tr key={row.nns} className="transition-colors hover:bg-[var(--coleman-glass-frost)]">
                <td className="p-4 text-base font-medium text-[var(--coleman-champagne)]">{row.nns}</td>
                <td className="p-4 font-mono text-xs text-[var(--coleman-text-secondary)]">{row.numeral}</td>
                <td className="p-4 font-medium text-[var(--coleman-text-primary)]">{row.chordName}</td>
                <td className="hidden p-4 text-xs text-[var(--coleman-text-muted)] sm:table-cell">{row.harmonicRole}</td>
                <td className="p-4 font-mono text-xs text-[var(--coleman-text-muted)]">{row.voicingHint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-frost)] p-4 text-xs leading-relaxed text-[var(--coleman-text-secondary)]">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--coleman-text-primary)]">
          Live Worship Tip
        </span>
        When transposing patterns on the fly, try substituting the standard major{" "}
        <span className="font-medium text-[var(--coleman-text-primary)]">5 chord</span> for a suspended version (
        <span className="font-mono text-[var(--coleman-champagne)]">V-sus4</span>). This avoids resolving tension too
        early while maintaining an acoustic sonic wash that masks solo or vocal transitions.
      </div>
    </div>
  );
}
