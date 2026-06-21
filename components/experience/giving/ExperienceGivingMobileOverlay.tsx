"use client";

import { ArrowRight } from "lucide-react";
import ExperienceGivingAmountGrid from "@/components/experience/giving/ExperienceGivingAmountGrid";
import {
  GIVING_MOBILE_BAKED_CONTROLS_MASK,
  GIVING_MOBILE_CUSTOM_AMOUNT_SLOT,
  GIVING_MOBILE_ERROR_SLOT,
  GIVING_MOBILE_GIVE_NOW_SLOT,
  GIVING_MOBILE_GRID_PANEL,
} from "@/lib/experience/giving-mobile-slots";
import type { CSSProperties } from "react";

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
      style={
        {
          "--giving-baked-mask-top": GIVING_MOBILE_BAKED_CONTROLS_MASK.top,
          "--giving-baked-mask-height": GIVING_MOBILE_BAKED_CONTROLS_MASK.height,
          "--giving-grid-panel-top": GIVING_MOBILE_GRID_PANEL.top,
          "--giving-grid-panel-height": GIVING_MOBILE_GRID_PANEL.height,
        } as CSSProperties
      }
    >
      <div className="experience-giving-overlay__baked-mask" aria-hidden="true" />

      <div className="experience-giving-overlay__grid-panel pointer-events-auto">
        <ExperienceGivingAmountGrid
          activePreset={activePreset}
          isLoading={isLoading}
          onSelectAmount={onSelectAmount}
        />
      </div>

      <label
        className="experience-giving-custom-amount pointer-events-auto"
        style={rectStyle(GIVING_MOBILE_CUSTOM_AMOUNT_SLOT)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vital seed/pencil-icon.png"
          alt=""
          className="experience-giving-custom-amount__icon"
          draggable={false}
        />
        <span className="sr-only">Enter custom gift amount</span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Enter custom gift amount"
          placeholder="$ OTHER AMOUNT"
          disabled={isLoading}
          value={customAmount}
          onFocus={onCustomAmountFocus}
          onClick={onCustomAmountFocus}
          onChange={(event) => onCustomAmountChange(event.target.value)}
          className="experience-giving-custom-amount__control font-ui"
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
        style={rectStyle(GIVING_MOBILE_GIVE_NOW_SLOT)}
        className={`experience-giving-give-now-btn pointer-events-auto font-ui${
          isLoading ? " experience-giving-give-now-btn--loading" : ""
        }`}
      >
        <span className="experience-giving-give-now-btn__label">Give Now</span>
        <ArrowRight
          className="experience-giving-give-now-btn__icon"
          aria-hidden="true"
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
