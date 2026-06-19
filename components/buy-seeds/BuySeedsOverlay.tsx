"use client";

import {
  BUY_SEEDS_CONTINUE_SLOT,
  BUY_SEEDS_ERROR_SLOT,
  seedPackages,
  type SeedPackageId,
} from "@/lib/seeds/assets";
import { getMerchProduct } from "@/lib/merch/catalog";

type BuySeedsOverlayProps = {
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

export default function BuySeedsOverlay({
  selectedPackageId,
  isSubmitting,
  activeProductId,
  errorMessage,
  onSelectPackage,
  onContinue,
}: BuySeedsOverlayProps) {
  return (
    <div className="buy-seeds-page__overlay" aria-label="Buy Vital Seeds">
      <div
        className="buy-seeds-page__native-layer"
        role="radiogroup"
        aria-label="Choose a seed package"
      >
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
              className={`buy-seeds-package-row touch-target${
                isSelected ? " buy-seeds-package-row--selected" : ""
              }`}
              style={{
                left: pkg.left,
                top: pkg.top,
                width: pkg.width,
                height: pkg.height,
              }}
            >
              <span
                className={
                  isSelected
                    ? "buy-seeds-package-row__radio buy-seeds-package-row__radio--selected"
                    : "buy-seeds-package-row__radio buy-seeds-package-row__radio--idle"
                }
                aria-hidden="true"
              >
                {isSelected ? <span className="buy-seeds-package-row__radio-dot" /> : null}
              </span>

              <span className="buy-seeds-package-row__seeds font-ui">
                {pkg.seeds.toLocaleString()} Seeds
              </span>

              <span
                className={`buy-seeds-package-row__badge font-ui uppercase tracking-wide ${badgeClassName(pkg.badge)}`}
              >
                {pkg.badge}
              </span>

              <span className="buy-seeds-package-row__price font-ui">{pkg.price}</span>
            </button>
          );
        })}

        {errorMessage ? (
          <p
            className="buy-seeds-page__inline-error font-body"
            role="alert"
            style={{
              left: BUY_SEEDS_ERROR_SLOT.left,
              top: BUY_SEEDS_ERROR_SLOT.top,
              width: BUY_SEEDS_ERROR_SLOT.width,
              height: BUY_SEEDS_ERROR_SLOT.height,
            }}
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          aria-label={BUY_SEEDS_CONTINUE_SLOT.label}
          disabled={isSubmitting || !selectedPackageId}
          aria-busy={isSubmitting}
          onClick={onContinue}
          className={`buy-seeds-continue-btn touch-target font-ui${
            isSubmitting ? " buy-seeds-continue-btn--loading" : ""
          }`}
          style={{
            left: BUY_SEEDS_CONTINUE_SLOT.left,
            top: BUY_SEEDS_CONTINUE_SLOT.top,
            width: BUY_SEEDS_CONTINUE_SLOT.width,
            height: BUY_SEEDS_CONTINUE_SLOT.height,
          }}
        >
          <span className="buy-seeds-continue-btn__label">Continue to Payment</span>
        </button>
      </div>
    </div>
  );
}
