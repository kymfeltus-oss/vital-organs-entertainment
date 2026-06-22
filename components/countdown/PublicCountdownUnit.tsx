"use client";

import type { CSSProperties } from "react";
import PublicCountdownDigit from "@/components/countdown/PublicCountdownDigit";
import type { PublicCountdownUnitDef } from "@/lib/countdown/public-countdown-units";

type PublicCountdownUnitProps = {
  unit: PublicCountdownUnitDef;
  value: string;
  index: number;
};

export default function PublicCountdownUnit({ unit, value, index }: PublicCountdownUnitProps) {
  return (
    <div
      className="public-countdown-unit"
      style={{ "--public-countdown-unit-delay": `${index * 0.08}s` } as CSSProperties}
    >
      <div className={`public-countdown-unit__ring ${unit.ringClass}`} aria-hidden="true">
        <div className="public-countdown-unit__ring-glow" aria-hidden="true" />
        <div className="public-countdown-unit__core">
          <PublicCountdownDigit
            value={value}
            digitClass={unit.digitClass}
            pulse={unit.id === "seconds"}
          />
        </div>
      </div>
      <span className="public-countdown-unit__label font-ui">{unit.label}</span>
    </div>
  );
}
