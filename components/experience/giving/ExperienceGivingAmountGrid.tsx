"use client";

import {
  GIVING_MOBILE_AMOUNT_SLOTS,
  type GivingOverlayRect,
} from "@/lib/experience/giving-mobile-slots";
import { VITAL_SEED_OVERLAY_HIT_CLASS } from "@/lib/vital-seed/giving-overlay-props";

type ExperienceGivingAmountGridProps = {
  activePreset: number | null;
  isLoading: boolean;
  onSelectAmount: (amount: number) => void;
};

function slotStyle(rect: GivingOverlayRect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export default function ExperienceGivingAmountGrid({
  activePreset,
  isLoading,
  onSelectAmount,
}: ExperienceGivingAmountGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose a gift amount"
      className="experience-giving-overlay__amount-group"
    >
      {GIVING_MOBILE_AMOUNT_SLOTS.map((slot) => {
        const isSelected = activePreset === slot.amount;

        return (
          <button
            key={slot.amount}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select $${slot.amount} gift`}
            disabled={isLoading}
            onClick={() => onSelectAmount(slot.amount)}
            className={`${VITAL_SEED_OVERLAY_HIT_CLASS} experience-giving-overlay__amount-hit`}
            style={slotStyle(slot)}
          />
        );
      })}
    </div>
  );
}
