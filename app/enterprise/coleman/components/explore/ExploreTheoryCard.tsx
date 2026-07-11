"use client";

import { useMemo } from "react";

import FretboardDiagram from "@/app/enterprise/coleman/components/explore/FretboardDiagram";
import { useExploreStudio } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";
import { G_MAJOR_VOICINGS } from "@/app/enterprise/coleman/components/explore/explore-voicings";
import {
  buildTheoryMatrix,
  THEORY_ROOT_KEYS,
  type ScaleMode,
  type TheoryRootKey,
} from "@/app/enterprise/coleman/lib/tools/theory-matrix";

export default function ExploreTheoryCard() {
  const { theoryKey, setTheoryKey, theoryScale, setTheoryScale } = useExploreStudio();

  const matrix = useMemo(
    () => buildTheoryMatrix(theoryKey, theoryScale),
    [theoryKey, theoryScale],
  );

  const voicings = useMemo(() => {
    return matrix.map((row, index) => {
      const preset = G_MAJOR_VOICINGS[index];
      return {
        degreeLabel: `${row.roman} (${row.chord})`,
        variants: `${row.chord} — ${row.function}`,
        markers: preset?.markers ?? (["x", "x", 0, 2, 3, "x"] as Array<number | "o" | "x">),
        fingerDots: preset?.fingerDots ?? [{ string: 3, fret: 2 }],
      };
    });
  }, [matrix]);

  return (
    <section id="theory" className="exo-card exo-outset scroll-mt-2">
      <h2 className="exo-card-title">Theory Roadmap</h2>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--exo-muted)]">Key</span>
          <select
            value={theoryKey}
            onChange={(e) => setTheoryKey(e.target.value as TheoryRootKey)}
            className="exo-outset rounded-lg border-0 bg-transparent px-2 py-2 text-[11px] font-medium outline-none"
          >
            {THEORY_ROOT_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[var(--exo-muted)]">Scale</span>
          <div className="exo-segment exo-inset">
            {(["major", "minor"] as ScaleMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheoryScale(mode)}
                className={`exo-outset-btn capitalize${theoryScale === mode ? " exo-inset is-active" : ""}`}
                aria-pressed={theoryScale === mode}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="exo-inset overflow-x-auto rounded-xl p-2">
        <table className="exo-matrix">
          <thead>
            <tr>
              <th>Row</th>
              {matrix.map((row) => (
                <th key={row.degree}>{row.degree}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Nashville #</th>
              {matrix.map((row) => (
                <td key={`n${row.degree}`}>{row.nashville}</td>
              ))}
            </tr>
            <tr>
              <th>Roman</th>
              {matrix.map((row) => (
                <td key={`r${row.degree}`}>{row.roman}</td>
              ))}
            </tr>
            <tr>
              <th>Chord</th>
              {matrix.map((row) => (
                <td key={`c${row.degree}`} className="font-semibold">
                  {row.chord}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-[var(--exo-muted)]">
          Chord Extensions & Voicings
        </p>
        <div className="exo-fret-grid">
          {voicings.map((voicing) => (
            <div key={voicing.degreeLabel} className="exo-fret-card exo-outset">
              <FretboardDiagram markers={voicing.markers} fingerDots={voicing.fingerDots} className="mx-auto" />
              <p className="mt-1 text-[7px] font-semibold leading-tight">{voicing.degreeLabel}</p>
              <p className="text-[6px] leading-tight text-[var(--exo-muted)]">{voicing.variants}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
