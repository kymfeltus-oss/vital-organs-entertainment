export type VoicingDiagram = {
  degreeLabel: string;
  variants: string;
  markers: Array<number | "o" | "x">;
  fingerDots: Array<{ string: number; fret: number }>;
};

export const G_MAJOR_VOICINGS: VoicingDiagram[] = [
  {
    degreeLabel: "I (G)",
    variants: "G — G/B — G/D",
    markers: [3, 2, 0, 0, 0, 3],
    fingerDots: [
      { string: 0, fret: 3 },
      { string: 1, fret: 2 },
      { string: 5, fret: 3 },
    ],
  },
  {
    degreeLabel: "ii (Am)",
    variants: "Am — Am/C — Am/E",
    markers: ["x", 0, 2, 2, 1, 0],
    fingerDots: [
      { string: 2, fret: 2 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
    ],
  },
  {
    degreeLabel: "iii (Bm)",
    variants: "Bm — Bm/D — Bm/F#",
    markers: ["x", 2, 4, 4, 3, 2],
    fingerDots: [
      { string: 1, fret: 2 },
      { string: 2, fret: 4 },
      { string: 3, fret: 4 },
      { string: 4, fret: 3 },
    ],
  },
  {
    degreeLabel: "IV (C)",
    variants: "C — C/E — C/G",
    markers: ["x", 3, 2, 0, 1, 0],
    fingerDots: [
      { string: 1, fret: 3 },
      { string: 2, fret: 2 },
      { string: 4, fret: 1 },
    ],
  },
  {
    degreeLabel: "V (D)",
    variants: "D — D/F# — D/A",
    markers: ["x", "x", 0, 2, 3, 2],
    fingerDots: [
      { string: 3, fret: 2 },
      { string: 4, fret: 3 },
      { string: 5, fret: 2 },
    ],
  },
  {
    degreeLabel: "vi (Em)",
    variants: "Em — Em/G — Em/B",
    markers: [0, 2, 2, 0, 0, 0],
    fingerDots: [
      { string: 1, fret: 2 },
      { string: 2, fret: 2 },
    ],
  },
  {
    degreeLabel: "vii° (F#dim)",
    variants: "F#dim — F#dim/A — F#dim/C",
    markers: ["x", "x", 1, 2, 1, 2],
    fingerDots: [
      { string: 2, fret: 1 },
      { string: 3, fret: 2 },
      { string: 4, fret: 1 },
      { string: 5, fret: 2 },
    ],
  },
];

export function noteWithOctave(note: string, hz: number): string {
  if (note === "—" || hz <= 0) return "—";
  const midi = Math.round(12 * Math.log2(hz / 440) + 69);
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}
