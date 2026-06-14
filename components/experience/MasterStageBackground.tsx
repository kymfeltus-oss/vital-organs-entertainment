"use client";

import { ACTUAL_ASSET_MAP } from "@/lib/experience/hub-design-tokens";

/**
 * Responsive master stage — dedicated mobile portrait template + desktop artboard.
 * Mobile: 853×1844 plate. Desktop: 1535×1024 plate. Layout rules in awakening.css.
 */
export default function MasterStageBackground() {
  return (
    <div className="master-stage-shell pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="master-stage-scene-box pointer-events-none" aria-hidden="true">
        <picture>
          <source
            media="(max-width: 767px) and (orientation: portrait)"
            srcSet={ACTUAL_ASSET_MAP.masterStageBackgroundMobile}
            type="image/webp"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            src={ACTUAL_ASSET_MAP.masterStageBackground}
            decoding="async"
            fetchPriority="high"
            className="master-stage-plate select-none"
          />
        </picture>
      </div>
    </div>
  );
}
