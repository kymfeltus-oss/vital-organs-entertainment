"use client";

import { Fragment } from "react";
import {
  BUY_SEEDS_CONTINUE_SLOT,
  BUY_SEEDS_ERROR_SLOT,
  BUY_SEEDS_PACKAGES,
  type BuySeedsOverlayRect,
} from "@/lib/seeds/buy-seeds-slots";
import { getMerchProduct } from "@/lib/merch/catalog";

type BuySeedsOverlayProps = {
  selectedPackageId: string;
  isSubmitting: boolean;
  activeProductId: string | null;
  errorMessage: string | null;
  onSelectPackage: (packageId: string) => void;
  onContinue: () => void;
};

function slotStyle(rect: BuySeedsOverlayRect) {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
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
        className="buy-seeds-page__actions"
        role="radiogroup"
        aria-label="Choose a seed package"
      >
        {BUY_SEEDS_PACKAGES.map((pkg) => {
          const product = getMerchProduct(pkg.productId);
          const isSelected = selectedPackageId === pkg.packageId;
          const isActive = isSubmitting && activeProductId === pkg.productId;

          if (!product) {
            return null;
          }

          return (
            <Fragment key={pkg.packageId}>
              <span
                className={`buy-seeds-page__radio${
                  isSelected
                    ? " buy-seeds-page__radio--selected"
                    : " buy-seeds-page__radio--idle"
                }`}
                style={{
                  left: pkg.radio.left,
                  top: pkg.radio.top,
                  width: pkg.radio.size,
                  height: pkg.radio.size,
                }}
                aria-hidden="true"
              >
                {isSelected ? <span className="buy-seeds-page__radio-dot" /> : null}
              </span>

              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={pkg.label}
                disabled={isSubmitting}
                aria-busy={isActive}
                onClick={() => onSelectPackage(pkg.packageId)}
                className="buy-seeds-page__action buy-seeds-page__action--row"
                style={slotStyle(pkg)}
              />
            </Fragment>
          );
        })}

        {errorMessage ? (
          <p
            className="buy-seeds-page__inline-error"
            role="alert"
            style={slotStyle(BUY_SEEDS_ERROR_SLOT)}
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
          className={`buy-seeds-page__action buy-seeds-page__action--primary${
            isSubmitting ? " buy-seeds-page__action--loading" : ""
          }`}
          style={slotStyle(BUY_SEEDS_CONTINUE_SLOT)}
        />
      </div>
    </div>
  );
}
