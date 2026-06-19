"use client";

import { BUY_SEEDS_PACK_SLOTS } from "@/lib/seeds/buy-seeds-slots";
import {
  getMerchProduct,
  SEED_ECONOMY_PACKS,
  type MerchProduct,
} from "@/lib/merch/catalog";

type BuySeedsOverlayProps = {
  balance: number | null;
  balanceLoading: boolean;
  isSubmitting: boolean;
  activeProductId: string | null;
  errorMessage: string | null;
  onBuyPack: (product: MerchProduct) => void;
};

export default function BuySeedsOverlay({
  balance,
  balanceLoading,
  isSubmitting,
  activeProductId,
  errorMessage,
  onBuyPack,
}: BuySeedsOverlayProps) {
  return (
    <div className="buy-seeds-page__overlay" aria-label="Buy Vital Seeds">
      <div className="buy-seeds-page__balance" aria-live="polite">
        <p className="buy-seeds-page__balance-label">Your balance</p>
        <p className="buy-seeds-page__balance-value">
          {balanceLoading ? "…" : (balance ?? 0).toLocaleString("en-US")}
          <span className="sr-only"> Vital Seeds</span>
        </p>
      </div>

      <div className="buy-seeds-page__actions">
        {BUY_SEEDS_PACK_SLOTS.map((slot) => {
          const pack = SEED_ECONOMY_PACKS.find((item) => item.productId === slot.productId);
          const product = getMerchProduct(slot.productId);
          const isActive = isSubmitting && activeProductId === slot.productId;

          if (!pack || !product) {
            return null;
          }

          return (
            <button
              key={slot.productId}
              type="button"
              aria-label={slot.label}
              disabled={isSubmitting}
              aria-busy={isActive}
              onClick={() => onBuyPack(product)}
              className="buy-seeds-page__action touch-target"
              style={{
                left: slot.left,
                top: slot.top,
                width: slot.width,
                height: slot.height,
              }}
            />
          );
        })}
      </div>

      {errorMessage ? (
        <p className="buy-seeds-page__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
