"use client";

import { VITAL_SEED_OVERLAY_HIT_CLASS } from "@/lib/vital-seed/giving-overlay-props";
import {
  EXPERIENCE_GIVING_DESKTOP_HOTSPOTS,
  EXPERIENCE_GIVING_MOBILE_HOTSPOTS,
  keypadValueFromHotspotId,
  quickAmountFromHotspotId,
  type GivingHotspotRegion,
} from "@/lib/experience/giving-hotspots";

type ExperienceGivingHotspotsProps = {
  variant: "desktop" | "mobile";
  onQuickAmount: (value: number | "custom") => void;
  onKeypad: (value: string) => void;
  onSowSeed: () => void;
};

function HotspotButton({
  region,
  onClick,
}: {
  region: GivingHotspotRegion;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={region.label}
      onClick={onClick}
      className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute border-0 p-0`}
      style={{
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.height,
      }}
    />
  );
}

export default function ExperienceGivingHotspots({
  variant,
  onQuickAmount,
  onKeypad,
  onSowSeed,
}: ExperienceGivingHotspotsProps) {
  const hotspots =
    variant === "desktop" ? EXPERIENCE_GIVING_DESKTOP_HOTSPOTS : EXPERIENCE_GIVING_MOBILE_HOTSPOTS;

  const handleRegionClick = (region: GivingHotspotRegion) => {
    const quickAmount = quickAmountFromHotspotId(region.id);
    if (quickAmount != null) {
      onQuickAmount(quickAmount);
      return;
    }

    const keypadValue = keypadValueFromHotspotId(region.id);
    if (keypadValue != null) {
      onKeypad(keypadValue);
      return;
    }

    if (region.id === "sow-seed") {
      onSowSeed();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden={false}>
      {hotspots.info.map((region) => (
        <HotspotButton key={region.id} region={region} onClick={() => undefined} />
      ))}

      {hotspots.quickGive.map((region) => (
        <HotspotButton
          key={region.id}
          region={region}
          onClick={() => {
            const amount = quickAmountFromHotspotId(region.id);
            if (amount != null) onQuickAmount(amount);
          }}
        />
      ))}

      {hotspots.keypad.map((region) => (
        <HotspotButton
          key={region.id}
          region={region}
          onClick={() => {
            const value = keypadValueFromHotspotId(region.id);
            if (value != null) onKeypad(value);
          }}
        />
      ))}

      {hotspots.misc.map((region) => (
        <HotspotButton key={region.id} region={region} onClick={() => undefined} />
      ))}

      <HotspotButton region={hotspots.sow} onClick={onSowSeed} />
    </div>
  );
}
