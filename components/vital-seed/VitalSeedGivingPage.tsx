"use client";

import { useCallback, useState } from "react";
import VitalSeedMobileOverlay from "@/components/vital-seed/VitalSeedMobileOverlay";
import VitalSeedOverlay from "@/components/vital-seed/VitalSeedOverlay";
import {
  formatKeypadAmountDisplay,
  parseAmountDollars,
} from "@/lib/vital-seed/custom-amount";

export default function VitalSeedGivingPage() {
  const [amountRaw, setAmountRaw] = useState("250");

  const amountDisplay = formatKeypadAmountDisplay(amountRaw);

  const handleQuickAmount = useCallback((value: number | "custom") => {
    if (value === "custom") {
      setAmountRaw("");
      return;
    }
    setAmountRaw(String(value));
  }, []);

  const handleSowSeed = useCallback(() => {
    const dollars = parseAmountDollars(amountRaw);
    console.log("Sow Vital Seed amount:", dollars ?? amountDisplay, { amountRaw, dollars });
  }, [amountRaw, amountDisplay]);

  const overlayProps = {
    amountRaw,
    amountDisplay,
    onAmountChange: setAmountRaw,
    onQuickAmount: handleQuickAmount,
    onSowSeed: handleSowSeed,
  };

  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center overflow-x-hidden bg-[#02030A]">
      {/* Desktop */}
      <div className="relative mx-auto hidden aspect-[1536/1024] w-full max-w-[1536px] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vital-seed/desktop-background.png"
          className="absolute inset-0 z-0 h-full w-full object-contain"
          alt=""
        />
        <VitalSeedOverlay {...overlayProps} />
      </div>

      {/* Mobile */}
      <div className="relative mx-auto block aspect-[768/1536] w-full max-w-[768px] lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vital-seed/mobile-background.png"
          className="absolute inset-0 z-0 h-full w-full object-contain"
          alt=""
        />
        <VitalSeedMobileOverlay {...overlayProps} />
      </div>
    </main>
  );
}
