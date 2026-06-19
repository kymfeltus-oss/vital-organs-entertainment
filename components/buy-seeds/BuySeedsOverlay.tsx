"use client";

import Link from "next/link";
import {
  BUY_SEEDS_BACK_SLOT,
  BUY_SEEDS_CONTINUE_SLOT,
  BUY_SEEDS_ERROR_SLOT,
  BUY_SEEDS_PACK_SLOTS,
} from "@/lib/seeds/buy-seeds-slots";
import {
  getMerchProduct,
  SEED_ECONOMY_PACKS,
} from "@/lib/merch/catalog";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

type BuySeedsOverlayProps = {
  selectedSlotIndex: number;
  isSubmitting: boolean;
  activeProductId: string | null;
  errorMessage: string | null;
  onSelectPack: (slotIndex: number, productId: string) => void;
  onContinue: () => void;
};

export default function BuySeedsOverlay({
  selectedSlotIndex,
  isSubmitting,
  activeProductId,
  errorMessage,
  onSelectPack,
  onContinue,
}: BuySeedsOverlayProps) {
  const hitClassName = "buy-seeds-page__action touch-target";

  return (
    <div className="buy-seeds-page__overlay" aria-label="Buy Vital Seeds">
      <Link
        href={ATTENDEE_DASHBOARD_PATH}
        aria-label={BUY_SEEDS_BACK_SLOT.label}
        className={hitClassName}
        style={{
          left: BUY_SEEDS_BACK_SLOT.left,
          top: BUY_SEEDS_BACK_SLOT.top,
          width: BUY_SEEDS_BACK_SLOT.width,
          height: BUY_SEEDS_BACK_SLOT.height,
        }}
      />

      <div className="buy-seeds-page__actions">
        {BUY_SEEDS_PACK_SLOTS.map((slot, index) => {
          const pack = SEED_ECONOMY_PACKS.find((item) => item.productId === slot.productId);
          const product = getMerchProduct(slot.productId);
          const isSelected = selectedSlotIndex === index;
          const isActive = isSubmitting && activeProductId === slot.productId;

          if (!pack || !product) {
            return null;
          }

          return (
            <button
              key={`${slot.productId}-${index}`}
              type="button"
              aria-label={slot.label}
              aria-pressed={isSelected}
              disabled={isSubmitting}
              aria-busy={isActive}
              onClick={() => onSelectPack(index, slot.productId)}
              className={`${hitClassName}${isSelected ? " buy-seeds-page__action--selected" : ""}`}
              style={{
                left: slot.left,
                top: slot.top,
                width: slot.width,
                height: slot.height,
              }}
            />
          );
        })}

        {errorMessage ? (
          <p
            className="buy-seeds-page__inline-error"
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
          disabled={isSubmitting || selectedSlotIndex < 0}
          aria-busy={isSubmitting}
          onClick={onContinue}
          className={`${hitClassName} buy-seeds-page__action--primary${
            isSubmitting ? " buy-seeds-page__action--loading" : ""
          }`}
          style={{
            left: BUY_SEEDS_CONTINUE_SLOT.left,
            top: BUY_SEEDS_CONTINUE_SLOT.top,
            width: BUY_SEEDS_CONTINUE_SLOT.width,
            height: BUY_SEEDS_CONTINUE_SLOT.height,
          }}
        />
      </div>
    </div>
  );
}
