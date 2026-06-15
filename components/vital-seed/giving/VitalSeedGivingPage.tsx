"use client";

import { useCallback, useState } from "react";
import VitalSeedBackground from "@/components/vital-seed/giving/VitalSeedBackground";
import VitalSeedGivingOverlay from "@/components/vital-seed/giving/VitalSeedGivingOverlay";
import {
  formatKeypadAmountDisplay,
  parseAmountDollars,
} from "@/lib/vital-seed/custom-amount";

export default function VitalSeedGivingPage() {
  const [amountRaw, setAmountRaw] = useState("250");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAmount = useCallback((value: number | "custom") => {
    if (value === "custom") {
      setAmountRaw("");
      return;
    }
    setAmountRaw(String(value));
  }, []);

  const handleSowSeed = useCallback(() => {
    const dollars = parseAmountDollars(amountRaw);
    const display = formatKeypadAmountDisplay(amountRaw);
    setIsSubmitting(true);
    console.log("Sow Vital Seed amount:", dollars ?? display, { amountRaw, dollars });
    setIsSubmitting(false);
  }, [amountRaw]);

  const overlayProps = {
    amountRaw,
    onAmountChange: setAmountRaw,
    onQuickAmount: handleQuickAmount,
    onSowSeed: handleSowSeed,
    isSubmitting,
  } as const;

  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black">
      <div className="vital-giving-stage">
        <VitalSeedBackground variant="mobile">
          <VitalSeedGivingOverlay variant="mobile" {...overlayProps} />
        </VitalSeedBackground>
        <VitalSeedBackground variant="desktop">
          <VitalSeedGivingOverlay variant="desktop" {...overlayProps} />
        </VitalSeedBackground>
      </div>
    </main>
  );
}
