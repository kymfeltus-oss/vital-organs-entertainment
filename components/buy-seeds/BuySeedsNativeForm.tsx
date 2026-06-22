"use client";

import { ChevronRight, Loader2, Lock } from "lucide-react";
import { getMerchProduct } from "@/lib/merch/catalog";
import { seedPackages, type SeedPackageId } from "@/lib/seeds/assets";

type BuySeedsNativeFormProps = {
  selectedPackageId: SeedPackageId;
  isSubmitting: boolean;
  activeProductId: string | null;
  errorMessage: string | null;
  onSelectPackage: (packageId: SeedPackageId) => void;
  onContinue: () => void;
};

function badgeClassName(badge: string): string {
  if (badge === "BEST VALUE") {
    return "text-brand-purple";
  }
  if (badge.startsWith("SAVE")) {
    return "text-brand-blue";
  }
  return "text-brand-pink";
}

function packageRowClassName(isSelected: boolean): string {
  return [
    "touch-target flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition font-ui",
    isSelected
      ? "border-brand-blue/50 bg-brand-panel shadow-[0_0_22px_rgba(0,168,255,0.22)]"
      : "border-brand-border bg-brand-panel/80 hover:border-brand-blue/30",
  ].join(" ");
}

export default function BuySeedsNativeForm({
  selectedPackageId,
  isSubmitting,
  activeProductId,
  errorMessage,
  onSelectPackage,
  onContinue,
}: BuySeedsNativeFormProps) {
  return (
    <div className="w-full space-y-3">
      <section aria-label="Choose a seed package">
        <h2 className="mb-2 text-center font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white">
          Choose a package
        </h2>

        <div role="radiogroup" aria-label="Choose a seed package" className="space-y-2">
          {seedPackages.map((pkg) => {
            const product = getMerchProduct(pkg.productId);
            const isSelected = selectedPackageId === pkg.packageId;
            const isActive = isSubmitting && activeProductId === pkg.productId;

            if (!product) {
              return null;
            }

            return (
              <button
                key={pkg.packageId}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${pkg.seeds} Seeds — ${pkg.badge} — ${pkg.price}`}
                disabled={isSubmitting}
                aria-busy={isActive}
                onClick={() => onSelectPackage(pkg.packageId)}
                className={packageRowClassName(isSelected)}
              >
                <span
                  className={[
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-brand-blue bg-brand-blue/20" : "border-brand-border bg-brand-black/40",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isSelected ? <span className="size-2 rounded-full bg-brand-blue" /> : null}
                </span>

                <span className="min-w-0 flex-1 font-body text-sm font-semibold text-white">
                  {pkg.seeds.toLocaleString()} Seeds
                </span>

                <span
                  className={`shrink-0 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] ${badgeClassName(pkg.badge)}`}
                >
                  {pkg.badge}
                </span>

                <span className="shrink-0 font-body text-sm font-bold text-white">{pkg.price}</span>
              </button>
            );
          })}
        </div>
      </section>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-lg border border-brand-pink/30 bg-brand-pink/10 px-3 py-1.5 font-body text-xs text-brand-pink"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isSubmitting || !selectedPackageId}
        aria-busy={isSubmitting}
        onClick={onContinue}
        className="touch-target inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-6 font-ui text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-blue transition hover:bg-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Preparing checkout…
          </>
        ) : (
          <>
            <Lock className="size-4" aria-hidden="true" strokeWidth={2.25} />
            Continue to Payment
            <ChevronRight className="size-4" aria-hidden="true" strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}
