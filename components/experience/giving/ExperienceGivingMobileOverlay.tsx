"use client";

import ExperienceGivingAmountGrid from "@/components/experience/giving/ExperienceGivingAmountGrid";
import {
  GIVING_MOBILE_CUSTOM_AMOUNT_SLOT,
  GIVING_MOBILE_ERROR_SLOT,
  GIVING_MOBILE_GIVE_NOW_SLOT,
} from "@/lib/experience/giving-mobile-slots";
import { VITAL_SEED_OVERLAY_HIT_CLASS } from "@/lib/vital-seed/giving-overlay-props";

type ExperienceGivingMobileOverlayProps = {
  selectedAmount: number | null;
  activePreset: number | null;
  customAmount: string;
  isLoading: boolean;
  error: string | null;
  onSelectAmount: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onCustomAmountFocus: () => void;
  onGiveNow: () => void;
};

function rectStyle(rect: {
  left: string;
  top: string;
  width: string;
  height: string;
}) {
  return {
    position: "absolute" as const,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export default function ExperienceGivingMobileOverlay({
  selectedAmount,
  activePreset,
  customAmount,
  isLoading,
  error,
  onSelectAmount,
  onCustomAmountChange,
  onCustomAmountFocus,
  onGiveNow,
}: ExperienceGivingMobileOverlayProps) {
  return (
    <div
      className="experience-giving-overlay pointer-events-none absolute inset-0 z-2 size-full"
      aria-label="Giving controls"
    >
      <ExperienceGivingAmountGrid
        activePreset={activePreset}
        isLoading={isLoading}
        onSelectAmount={onSelectAmount}
      />

      <label
        className="artboard-field-slot experience-giving-custom-label"
        style={rectStyle(GIVING_MOBILE_CUSTOM_AMOUNT_SLOT)}
      >
        <span className="sr-only">Enter custom gift amount</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Enter custom gift amount"
          placeholder=" "
          disabled={isLoading}
          value={customAmount}
          onFocus={onCustomAmountFocus}
          onClick={onCustomAmountFocus}
          onChange={(event) => onCustomAmountChange(event.target.value)}
          className="artboard-field-slot__control experience-giving-custom-input font-ui text-[clamp(0.85rem,3.8cqw,1.05rem)] font-semibold tracking-wide"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="experience-giving-inline-error pointer-events-none absolute m-0 text-center font-body text-[clamp(0.62rem,2.6cqw,0.75rem)] leading-tight text-brand-pink"
          style={rectStyle(GIVING_MOBILE_ERROR_SLOT)}
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        aria-label={
          selectedAmount != null && selectedAmount > 0
            ? `Give now — $${selectedAmount} secure checkout`
            : "Give now — continue to secure checkout"
        }
        disabled={isLoading}
        onClick={onGiveNow}
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS}${
          isLoading ? " experience-giving-hit--loading" : ""
        }`}
        style={rectStyle(GIVING_MOBILE_GIVE_NOW_SLOT)}
      />
    </div>
  );
}
