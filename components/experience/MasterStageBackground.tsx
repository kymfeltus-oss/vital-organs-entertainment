"use client";

import { ACTUAL_ASSET_MAP } from "@/lib/experience/hub-design-tokens";

/** Single cohesive stage — dvh-safe artboard; portrait/landscape rules in awakening.css */
export default function MasterStageBackground() {
  return (
    <div className="master-stage-shell pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="master-stage-scene-box pointer-events-none" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          aria-hidden="true"
          src={ACTUAL_ASSET_MAP.masterStageBackground}
          decoding="async"
          fetchPriority="high"
          className="master-stage-plate select-none"
        />
      </div>
    </div>
  );
}
