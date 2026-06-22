"use client";

import { ArrowRight, Check, Loader2, Pencil } from "lucide-react";
import { givingAmounts } from "@/lib/vital-seed/giving-assets";

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
  "w-full rounded-xl border border-brand-border bg-brand-panel/80 px-4 py-3 font-body text-sm text-white outline-none transition placeholder:text-brand-muted/50 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/30";

function amountCardClassName(isSelected: boolean, isDimmed: boolean): string {
  return [
    "relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border p-3 transition touch-target font-ui",
    isSelected
      ? "border-brand-blue/50 bg-brand-panel shadow-[0_0_22px_rgba(0,168,255,0.28),0_0_28px_rgba(255,0,140,0.2)]"
      : "border-brand-border bg-brand-panel/80",
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
  const hasSelection = activePreset != null;

  return (
    <div className="w-full space-y-5">
      <section aria-label="Choose a gift amount">
        <h2 className="mb-3 text-center font-ui text-[0.62rem] font-bold uppercase tracking-[0.24em] text-white">
          Choose an amount
        </h2>

        <div role="radiogroup" aria-label="Choose a gift amount" className="grid grid-cols-2 gap-3">
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
                className={amountCardClassName(isSelected, isDimmed)}
              >
                {isSelected ? (
                  <span
                    className="absolute left-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-brand-pink text-white"
                    aria-hidden="true"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
                <span className="font-body text-xl font-bold text-white">${card.amount}</span>
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <label className="block">
        <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
          Custom amount
        </span>
        <div className="relative">
          <Pencil
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-blue"
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
            className={`${fieldClassName} pl-10`}
          />
        </div>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-brand-pink/30 bg-brand-pink/10 px-3 py-2 font-body text-sm text-brand-pink"
        >
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isLoading}
        onClick={onGiveNow}
        className="touch-target inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-6 font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-blue transition hover:bg-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
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
