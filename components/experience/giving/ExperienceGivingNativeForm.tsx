"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil } from "lucide-react";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

type GivingFormStep = "select" | "checkout";

type ExperienceGivingNativeFormProps = {
  activePreset: number | null;
  customAmount: string;
  isLoading: boolean;
  error: string | null;
  onSelectAmount: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onCustomAmountFocus: () => void;
  onGiveNow: () => void;
};

const fieldClassName =
  "w-full rounded-xl border border-brand-border/70 bg-black/20 px-3 py-2.5 font-body text-sm text-white outline-none transition placeholder:text-brand-muted/50 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/30";

function amountCardClassName(isSelected: boolean, isDimmed: boolean): string {
  return [
    "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border p-2 transition touch-target font-ui",
    isSelected
      ? "border-brand-blue/50 bg-black/30 shadow-[0_0_22px_rgba(0,168,255,0.28),0_0_28px_rgba(255,0,140,0.2)]"
      : "border-brand-border/70 bg-black/20",
    isDimmed ? "opacity-55" : "opacity-100",
  ].join(" ");
}

export default function ExperienceGivingNativeForm({
  activePreset,
  customAmount,
  isLoading,
  error,
  onSelectAmount,
  onCustomAmountChange,
  onCustomAmountFocus,
  onGiveNow,
}: ExperienceGivingNativeFormProps) {
  const [step, setStep] = useState<GivingFormStep>("select");
  const hasSelection = activePreset != null;
  const presetLabel =
    activePreset != null
      ? givingAmounts.find((entry) => entry.amount === activePreset)?.label
      : null;

  const goToSelect = () => setStep("select");

  const handlePresetPick = (amount: number) => {
    onSelectAmount(amount);
    setStep("checkout");
  };

  const handleCustomEntry = () => {
    onCustomAmountFocus();
    setStep("checkout");
  };

  if (step === "select") {
    return (
      <div className="vital-giving-form vital-giving-form--select flex flex-col gap-3">
        <section aria-label="Choose a gift amount">
          <div
            role="radiogroup"
            aria-label="Choose a gift amount"
            className="grid grid-cols-2 gap-2"
          >
            {givingAmounts.map((card) => {
              const isSelected = activePreset === card.amount;

              return (
                <button
                  key={card.amount}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select $${card.amount} ${card.label} gift`}
                  disabled={isLoading}
                  onClick={() => handlePresetPick(card.amount)}
                  className={amountCardClassName(isSelected, false)}
                >
                  {isSelected ? (
                    <span
                      className="absolute left-2 top-2 flex size-4 items-center justify-center rounded-full bg-brand-pink text-white"
                      aria-hidden="true"
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  ) : null}
                  <span className="font-body text-base font-bold text-white">${card.amount}</span>
                  <span className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                    {card.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleCustomEntry}
          className="touch-target font-ui text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-brand-muted transition hover:text-brand-blue"
        >
          Enter a custom amount
        </button>
      </div>
    );
  }

  return (
    <div className="vital-giving-form vital-giving-form--checkout flex flex-col gap-3">
      <button
        type="button"
        disabled={isLoading}
        onClick={goToSelect}
        className="touch-target inline-flex min-h-9 items-center gap-1.5 self-start font-ui text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-brand-muted transition hover:text-brand-blue"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Change amount
      </button>

      {hasSelection && presetLabel ? (
        <div className="rounded-xl border border-brand-blue/35 bg-black/25 px-4 py-3 text-center">
          <p className="font-ui text-[0.56rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            Your gift
          </p>
          <p className="mt-1 font-body text-2xl font-bold text-white">${activePreset}</p>
          <p className="font-ui text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-brand-blue">
            {presetLabel}
          </p>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
          {hasSelection ? "Or enter a custom amount" : "Custom amount"}
        </span>
        <div className="relative">
          <Pencil
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-blue"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Enter custom gift amount"
            placeholder="Enter amount"
            disabled={isLoading}
            value={customAmount}
            onFocus={onCustomAmountFocus}
            onClick={onCustomAmountFocus}
            onChange={(event) => onCustomAmountChange(event.target.value)}
            className={`${fieldClassName} pl-9`}
          />
        </div>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-brand-pink/30 bg-brand-pink/10 px-3 py-2 font-body text-xs text-brand-pink"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isLoading}
        onClick={onGiveNow}
        className="touch-target inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-blue transition hover:bg-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Preparing checkout…
          </>
        ) : (
          <>
            Give Now
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
