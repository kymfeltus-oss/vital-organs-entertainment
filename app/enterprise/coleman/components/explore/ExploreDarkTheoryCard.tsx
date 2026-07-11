"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";

import FretboardDiagram from "@/app/enterprise/coleman/components/explore/FretboardDiagram";
import { useExploreStudio } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";
import { G_MAJOR_VOICINGS } from "@/app/enterprise/coleman/components/explore/explore-voicings";
import {
  buildTheoryMatrix,
  THEORY_ROOT_KEYS,
  type ScaleMode,
  type TheoryRootKey,
} from "@/app/enterprise/coleman/lib/tools/theory-matrix";

function cleanTheoryText(value: string) {
  return value.replaceAll("Â°", "\u00b0").replaceAll("â€”", "-");
}

export default function ExploreDarkTheoryCard() {
  const { theoryKey, setTheoryKey, theoryScale, setTheoryScale } = useExploreStudio();

  const matrix = useMemo(
    () => buildTheoryMatrix(theoryKey, theoryScale),
    [theoryKey, theoryScale],
  );

  const voicings = useMemo(() => {
    return matrix.map((row, index) => {
      const preset = G_MAJOR_VOICINGS[index];
      return {
        degreeLabel: `${cleanTheoryText(row.roman)} (${row.chord})`,
        variants: preset?.variants
          ? cleanTheoryText(preset.variants)
          : `${row.chord} - ${row.function}`,
        markers: preset?.markers ?? (["x", "x", 0, 2, 3, "x"] as Array<number | "o" | "x">),
        fingerDots: preset?.fingerDots ?? [{ string: 3, fret: 2 }],
      };
    });
  }, [matrix]);

  return (
    <section id="theory" className="exo-card exo-theory-card scroll-mt-2">
      <div className="exo-card-heading exo-theory-heading">
        <div>
          <BookOpen size={25} strokeWidth={1.25} />
          <h2 className="exo-card-title">Theory Roadmap</h2>
        </div>

        <div className="exo-theory-controls">
          <label>
            <span>Key</span>
            <select
              value={theoryKey}
              onChange={(e) => setTheoryKey(e.target.value as TheoryRootKey)}
              className="exo-select"
            >
              {THEORY_ROOT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <div className="exo-scale-control">
            <span>Scale</span>
            <div className="exo-segment">
              {(["major", "minor"] as ScaleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheoryScale(mode)}
                  className={theoryScale === mode ? "is-active" : ""}
                  aria-pressed={theoryScale === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="exo-theory-table-wrap">
        <table className="exo-matrix">
          <thead>
            <tr>
              <th>Degree</th>
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
              <th>Roman Numeral</th>
              {matrix.map((row) => (
                <td key={`r${row.degree}`}>{cleanTheoryText(row.roman)}</td>
              ))}
            </tr>
            <tr>
              <th>Chord</th>
              {matrix.map((row) => (
                <td key={`c${row.degree}`}>{row.chord}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="exo-voicing-section">
        <div className="exo-voicing-title">
          <span>Chord Extensions &amp; Voicings</span>
          <strong>
            {theoryKey} {theoryScale}
          </strong>
        </div>

        <div className="exo-fret-grid">
          {voicings.map((voicing) => (
            <div key={voicing.degreeLabel} className="exo-fret-card">
              <p>{voicing.degreeLabel}</p>
              <span>{voicing.variants}</span>
              <FretboardDiagram markers={voicing.markers} fingerDots={voicing.fingerDots} className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
