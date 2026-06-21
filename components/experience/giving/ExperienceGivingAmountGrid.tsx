"use client";

import { Check } from "lucide-react";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

type ExperienceGivingAmountGridProps = {
  activePreset: number | null;
  isLoading: boolean;
  onSelectAmount: (amount: number) => void;
};

/** Fully native preset amount grid — no PNG cards or absolute hotspot mapping. */
export default function ExperienceGivingAmountGrid({
  activePreset,
  isLoading,
  onSelectAmount,
}: ExperienceGivingAmountGridProps) {
  const hasSelection = activePreset != null;

  return (
    <section
      className="experience-giving-amount-section"
      aria-labelledby="experience-giving-amount-heading"
    >
      <h3
        id="experience-giving-amount-heading"
        className="experience-giving-amount-section__headline font-ui"
      >
        Choose an amount
      </h3>

      <div
        role="radiogroup"
        aria-label="Choose a gift amount"
        className="experience-giving-amount-section__grid"
      >
        {givingAmounts.map((card) => {
          const isSelected = activePreset === card.amount;
          const isDimmed = hasSelection && !isSelected;

          return (
            <button
              key={card.amount}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select $${card.amount} ${card.label} gift`}
              disabled={isLoading}
              onClick={() => onSelectAmount(card.amount)}
              className={[
                "experience-giving-amount-card touch-target font-ui",
                isSelected ? "experience-giving-amount-card--selected" : "",
                isDimmed ? "experience-giving-amount-card--dimmed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isSelected ? (
                <span className="experience-giving-amount-card__check" aria-hidden="true">
                  <Check className="experience-giving-amount-card__check-icon" strokeWidth={3} />
                </span>
              ) : null}

              <span className="experience-giving-amount-card__value">${card.amount}</span>
              <span className="experience-giving-amount-card__label">{card.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
