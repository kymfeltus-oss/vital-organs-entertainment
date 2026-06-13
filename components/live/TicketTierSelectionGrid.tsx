"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  computeTicketTierSavingsCents,
  EVENT_TICKET_TIERS,
  formatTicketPriceCents,
  getTicketTierShortLabel,
  type EventTicketTier,
} from "@/lib/merch/catalog";
import { getAppUrl } from "@/lib/client-api";

type TicketTierSelectionGridProps = {
  className?: string;
};

function tierAccentClass(tierId: string): string {
  if (tierId === "ticket-tier-vip") {
    return "border-[#B0267A]/55 shadow-[0_0_28px_rgba(176,38,122,0.35)]";
  }
  if (tierId === "ticket-tier-pro") {
    return "border-[#1E40AF]/55 shadow-[0_0_24px_rgba(30,64,175,0.3)]";
  }
  return "border-white/15";
}

function TierCard({
  tier,
  isSubmitting,
  isDisabled,
  onSelect,
}: {
  tier: EventTicketTier;
  isSubmitting: boolean;
  isDisabled: boolean;
  onSelect: (tierId: string) => void;
}) {
  const isPremium = tier.seedBonus > 0;
  const savingsCents = computeTicketTierSavingsCents(tier);
  const isLoading = isSubmitting;

  return (
    <motion.button
      type="button"
      whileTap={isDisabled || isLoading ? undefined : { scale: 0.98 }}
      onClick={() => onSelect(tier.id)}
      disabled={isDisabled || isLoading}
      className={`touch-target flex h-full flex-col rounded-2xl border bg-[#111111]/90 p-4 text-left transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 md:p-5 ${tierAccentClass(tier.id)}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {tier.id === "ticket-tier-pro" && (
          <span className="rounded-full border border-[#1E40AF]/50 bg-[#1E40AF]/15 px-2.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-[#1E40AF]">
            Popular
          </span>
        )}
        {tier.id === "ticket-tier-vip" && (
          <span className="rounded-full border border-[#B0267A]/50 bg-[#B0267A]/15 px-2.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-[#B0267A]">
            Premium
          </span>
        )}
      </div>

      <h3 className="mt-2 text-sm font-bold uppercase tracking-widest text-white md:text-base">
        {getTicketTierShortLabel(tier.id)}
      </h3>

      <p className="mt-2 text-2xl font-bold text-white">
        {formatTicketPriceCents(tier.priceInCents)}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-zinc-400">
        Full digital access to the 300 Awakening live concert stream.
      </p>

      {isPremium && (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#B0267A]">
          +{tier.seedBonus.toLocaleString("en-US")} Seeds Included
        </p>
      )}

      {savingsCents > 0 && (
        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#1E40AF]">
          Save {formatTicketPriceCents(savingsCents)} vs ticket + seed packs
        </p>
      )}

      <span className="mt-4 inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-zinc-300">
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1E40AF]" />
            Preparing Checkout...
          </>
        ) : (
          "Select Pass"
        )}
      </span>
    </motion.button>
  );
}

export default function TicketTierSelectionGrid({
  className = "",
}: TicketTierSelectionGridProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectTier = useCallback(async (productId: string) => {
    setSubmittingId(productId);
    setErrorMessage(null);

    try {
      const response = await fetch(`${getAppUrl()}/api/checkout/merch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        setErrorMessage("Sign in at the email gate before purchasing a ticket.");
        return;
      }

      if (!response.ok || !data.url) {
        setErrorMessage(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorMessage("Unable to reach checkout. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  }, []);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EVENT_TICKET_TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSubmitting={submittingId === tier.id}
            isDisabled={Boolean(submittingId && submittingId !== tier.id)}
            onSelect={(tierId) => void handleSelectTier(tierId)}
          />
        ))}
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#B0267A]/40 bg-[#B0267A]/10 px-4 py-3 text-center text-sm text-zinc-200"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
