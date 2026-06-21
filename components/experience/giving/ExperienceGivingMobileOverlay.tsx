"use client";

import { Loader2 } from "lucide-react";
import {
  GIVING_MOBILE_CUSTOM_AMOUNT_SLOT,
  GIVING_MOBILE_ERROR_SLOT,
  GIVING_MOBILE_GIVE_NOW_SLOT,
  GIVING_MOBILE_PRESET_SLOTS,
} from "@/lib/experience/giving-mobile-slots";
import type { CSSProperties } from "react";

type ExperienceGivingMobileOverlayProps = {
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
}): CSSProperties {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export default function ExperienceGivingMobileOverlay({
  activePreset,
  customAmount,
  isLoading,
  error,
  onSelectAmount,
  onCustomAmountChange,
  onCustomAmountFocus,
  onGiveNow,
}: ExperienceGivingMobileOverlayProps) {
  const submitCurrentForm = (form: HTMLFormElement | null) => {
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  return (
    <form
      className="experience-giving-overlay-form pointer-events-none absolute inset-0 z-2 size-full"
      aria-label="Giving controls"
      onSubmit={(event) => {
        event.preventDefault();
        onGiveNow();
      }}
    >
      {GIVING_MOBILE_PRESET_SLOTS.map((slot) => {
        const isSelected = activePreset === slot.amount;

        return (
          <button
            key={slot.amount}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select $${slot.amount} ${slot.label} gift`}
            disabled={isLoading}
            onClick={() => onSelectAmount(slot.amount)}
            className="auth-attendee-hit auth-attendee-action-hit pointer-events-auto"
            style={rectStyle(slot)}
          />
        );
      })}

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
        className="auth-attendee-field pointer-events-auto"
        style={rectStyle(GIVING_MOBILE_CUSTOM_AMOUNT_SLOT)}
      />

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
        onClick={(event) => submitCurrentForm(event.currentTarget.form)}
        className="auth-attendee-hit auth-attendee-action-hit pointer-events-auto"
        style={rectStyle(GIVING_MOBILE_GIVE_NOW_SLOT)}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
        ) : null}
      </button>
    </form>
  );
}
