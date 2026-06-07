"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  MERCH_PRODUCTS,
  MERCH_SIZES,
  type MerchProduct,
} from "@/lib/merch/catalog";

export default function MerchPage() {
  const [activeProduct, setActiveProduct] = useState<MerchProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openProductDrawer = useCallback((product: MerchProduct) => {
    setActiveProduct(product);
    setSelectedSize("");
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedSize("");
  }, []);

  const requiresSize = activeProduct?.requiresSize ?? false;
  const canCheckout = Boolean(activeProduct) && (!requiresSize || selectedSize);

  const handleBuyNow = useCallback(async () => {
    if (!activeProduct) return;

    const customerEmail = localStorage.getItem("awakening_user_email");

    if (!customerEmail) {
      window.alert(
        "We need your email on file before checkout. Please complete the email gate first.",
      );
      return;
    }

    if (activeProduct.requiresSize && !selectedSize) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/checkout/merch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: activeProduct.id,
            selectedSize: selectedSize || null,
            customerEmail,
          }),
        },
      );

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        window.alert(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      window.alert("Unable to reach checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProduct, selectedSize]);

  return (
    <main className="min-h-screen w-full bg-[#0B090A] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md px-6 pb-24 pt-safe">
        <header className="pb-6 pt-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Tab 3
          </p>
          <h1 className="mt-2 text-xl font-bold uppercase tracking-widest">
            Awakening Merch
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Official event night apparel and album pre-orders.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {MERCH_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="flex flex-col rounded-2xl border border-white/15 bg-[#111111] p-3 shadow-[0_0_20px_rgba(176,38,122,0.1)]"
            >
              <div className="relative mx-auto mb-3 aspect-square w-full max-w-[120px] overflow-hidden rounded-xl border border-[#1E40AF]/30 bg-black">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  unoptimized
                  className="object-contain p-2"
                />
              </div>
              <h2 className="text-[0.65rem] font-bold uppercase leading-snug tracking-[0.12em]">
                {product.title}
              </h2>
              <p className="mt-2 text-sm font-bold text-[#1E40AF]">
                ${product.price}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => openProductDrawer(product)}
                className="mt-3 w-full rounded-xl border border-[#B0267A]/50 bg-[#B0267A]/10 px-2 py-2 text-[0.6rem] font-bold uppercase tracking-[0.15em] transition hover:border-[#B0267A]"
              >
                View Details
              </motion.button>
            </article>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && activeProduct && (
          <>
            <motion.button
              type="button"
              aria-label="Close product details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-black/70"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border-t border-[#1E40AF]/40 bg-[#111111] px-6 pb-safe pt-6 shadow-[0_-12px_40px_rgba(176,38,122,0.25)]"
            >
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/20" />

              <h2 className="text-sm font-bold uppercase tracking-[0.2em]">
                {activeProduct.title}
              </h2>
              <p className="mt-2 text-lg font-bold text-[#1E40AF]">
                ${activeProduct.price}
              </p>

              {activeProduct.requiresSize && (
                <div className="mt-6">
                  <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-zinc-400">
                    Select Size
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {MERCH_SIZES.map((size) => {
                      const isActive = selectedSize === size;

                      return (
                        <motion.button
                          key={size}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-xl border py-3 text-xs font-bold uppercase transition ${
                            isActive
                              ? "border-[#B0267A] bg-[#B0267A]/10 text-white shadow-[0_0_18px_rgba(176,38,122,0.45)]"
                              : "border-white/15 bg-[#0B090A] text-white/80 hover:border-[#1E40AF]/60"
                          }`}
                        >
                          {size}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresSize && !selectedSize && (
                <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#B0267A]">
                  Select a size to continue
                </p>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={!canCheckout || isSubmitting}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Preparing Checkout..." : "Buy Now 💳"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
