"use client";

import Link from "next/link";
import {
  GIVING_MOBILE_AMOUNT_SLOTS,
  GIVING_MOBILE_BACK_SLOT,
  GIVING_MOBILE_CUSTOM_AMOUNT_SLOT,
  GIVING_MOBILE_ERROR_SLOT,
  GIVING_MOBILE_GIVE_NOW_SLOT,
} from "@/lib/experience/giving-mobile-slots";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { VITAL_SEED_OVERLAY_HIT_CLASS } from "@/lib/vital-seed/giving-overlay-props";

type ExperienceGivingMobileOverlayProps = {
  selectedAmount: number | null;
  customAmount: string;
  isLoading: boolean;
  error: string | null;
  onSelectAmount: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onGiveNow: () => void;
};

function rectStyle(rect: {
  left: string;
  top: string;
  width: string;
  height: string;
}) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export default function ExperienceGivingMobileOverlay({
  selectedAmount,
  customAmount,
  isLoading,
  error,
  onSelectAmount,
  onCustomAmountChange,
  onGiveNow,
}: ExperienceGivingMobileOverlayProps) {
  const hasCustomAmount = customAmount.trim().length > 0;

  return (
    <div className="experience-giving-overlay pointer-events-none absolute inset-0 z-10">
      <Link
        href={ATTENDEE_DASHBOARD_PATH}
        aria-label={GIVING_MOBILE_BACK_SLOT.label}
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} experience-giving-hit absolute touch-target border-0 p-0`}
        style={rectStyle(GIVING_MOBILE_BACK_SLOT)}
      />

      {GIVING_MOBILE_AMOUNT_SLOTS.map((slot) => {
        const isSelected = !hasCustomAmount && selectedAmount === slot.amount;

        return (
          <button
            key={slot.amount}
            type="button"
            aria-label={`Select $${slot.amount} gift`}
            aria-pressed={isSelected}
            disabled={isLoading}
            onClick={() => onSelectAmount(slot.amount)}
            className={`${VITAL_SEED_OVERLAY_HIT_CLASS} experience-giving-hit experience-giving-amount-hit absolute touch-target border-0 p-0${
              isSelected ? " experience-giving-hit--active" : ""
            }`}
            style={rectStyle(slot)}
          />
        );
      })}

      <label
        className="experience-giving-custom-label pointer-events-auto absolute"
        style={rectStyle(GIVING_MOBILE_CUSTOM_AMOUNT_SLOT)}
      >
        <span className="sr-only">Enter custom gift amount</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Enter custom gift amount"
          placeholder=""
          disabled={isLoading}
          value={customAmount}
          onChange={(event) => onCustomAmountChange(event.target.value)}
          className="experience-giving-custom-input h-full w-full touch-target border-0 bg-transparent p-0 text-center font-ui text-[clamp(0.85rem,3.8cqw,1.05rem)] font-semibold tracking-wide text-white outline-none placeholder:text-white/40"
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
        aria-label="Give now — continue to secure checkout"
        disabled={isLoading}
        onClick={onGiveNow}
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} experience-giving-hit experience-giving-give-hit absolute touch-target border-0 p-0${
          isLoading ? " experience-giving-hit--loading" : ""
        }`}
        style={rectStyle(GIVING_MOBILE_GIVE_NOW_SLOT)}
      />
    </div>
  );
}
