"use client";

import type { CSSProperties } from "react";
import { GIVING_MOBILE_AMOUNT_SLOTS } from "@/lib/experience/giving-mobile-slots";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

type ExperienceGivingAmountGridProps = {
  activePreset: number | null;
  isLoading: boolean;
  onSelectAmount: (amount: number) => void;
};

const CARD_IMAGE_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "fill",
};

function slotStyle(slot: {
  left: string;
  top: string;
  width: string;
  height: string;
}): CSSProperties {
  return {
    position: "absolute",
    left: slot.left,
    top: slot.top,
    width: slot.width,
    height: slot.height,
  };
}

/** Maps givingAmounts card PNGs into the measured 2×2 grid on mobile-main-background.png. */
export default function ExperienceGivingAmountGrid({
  activePreset,
  isLoading,
  onSelectAmount,
}: ExperienceGivingAmountGridProps) {
  const cards = GIVING_MOBILE_AMOUNT_SLOTS.filter((slot) =>
    givingAmounts.some((entry) => entry.amount === slot.amount),
  );

  return (
    <div
      role="radiogroup"
      aria-label="Choose a gift amount"
      className="experience-giving-overlay__amount-group"
    >
      {cards.map((card) => {
        const isSelected = activePreset === card.amount;

        return (
          <div
            key={card.amount}
            className="experience-giving-overlay__amount-slot"
            style={slotStyle(card)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt={`$${card.amount} ${card.label}`}
              className="experience-giving-overlay__amount-card-img"
              style={CARD_IMAGE_STYLE}
              loading="eager"
              decoding="async"
              draggable={false}
            />
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select $${card.amount} ${card.label} gift`}
              disabled={isLoading}
              onClick={() => onSelectAmount(card.amount)}
              className="experience-giving-overlay__amount-hit"
            />
          </div>
        );
      })}
    </div>
  );
}
