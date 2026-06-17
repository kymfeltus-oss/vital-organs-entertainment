"use client";

import { useEffect, useState } from "react";
import type { VitalSeedOverlaySharedProps } from "@/lib/vital-seed/giving-overlay-props";
import { VITAL_SEED_OVERLAY_HIT_CLASS } from "@/lib/vital-seed/giving-overlay-props";
import SowVitalSeedButton from "@/components/vital-seed/SowVitalSeedButton";

const assetPath = "/images/vital-seed";

const liveFeedItems = [
  { icon: "pulse.png", name: "Anonymous Seed", date: "Just now", amount: "$25.00", color: "#FF2EA6" },
  { icon: "seed-icon.png", name: "Vital Partner", date: "1 minute ago", amount: "$250.00", color: "#00C8FF" },
  { icon: "people-icon.png", name: "Kingdom Gift", date: "3 minutes ago", amount: "$75.00", color: "#A855F7" },
  { icon: "pulse.png", name: "Faith Offering", date: "5 minutes ago", amount: "$100.00", color: "#FF2EA6" },
  { icon: "seed-icon.png", name: "Breakthrough Seed", date: "8 minutes ago", amount: "$50.00", color: "#00C8FF" },
];

const feedRowPositions = [
  { top: "69.4%", amountTop: "70.0%" },
  { top: "74.0%", amountTop: "74.6%" },
  { top: "78.5%", amountTop: "79.1%" },
] as const;

export default function VitalSeedOverlay({
  amountDisplay,
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSowSeed,
}: VitalSeedOverlaySharedProps) {
  const [feedStart, setFeedStart] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFeedStart((prev) => (prev + 1) % liveFeedItems.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  const visibleFeedItems = feedRowPositions.map((position, index) => ({
    ...liveFeedItems[(feedStart + index) % liveFeedItems.length],
    ...position,
  }));

  const keypadValues = [
    { value: "1", left: "53.2%", top: "38.3%" },
    { value: "2", left: "58.9%", top: "38.3%" },
    { value: "3", left: "64.5%", top: "38.3%" },
    { value: "4", left: "53.2%", top: "43.7%" },
    { value: "5", left: "58.9%", top: "43.7%" },
    { value: "6", left: "64.5%", top: "43.7%" },
    { value: "7", left: "53.2%", top: "49.8%" },
    { value: "8", left: "58.9%", top: "49.8%" },
    { value: "9", left: "64.5%", top: "49.8%" },
    { value: ".", left: "53.2%", top: "55.7%" },
    { value: "0", left: "58.9%", top: "55.7%" },
    { value: "backspace", left: "64.5%", top: "55.7%" },
  ];

  const handleKeypadClick = (value: string) => {
    if (value === "backspace") {
      onAmountChange(amountRaw.slice(0, -1));
      return;
    }

    if (value === "." && amountRaw.includes(".")) return;

    onAmountChange(`${amountRaw}${value}`);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body text-white">
      <div className="absolute left-[42.8%] top-[15.9%] w-[18%] text-center bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text font-headline text-[24px] font-semibold tracking-[0.24em] leading-none text-transparent">
        DONATION GOAL
      </div>

      <button
        type="button"
        aria-label="Donation Goal information"
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute left-[55.2%] top-[16.0%] flex h-3 w-3 items-center justify-center p-0 opacity-60`}
      >
        <img
          src={`${assetPath}/info-icon.png`}
          alt=""
          className="h-full w-full object-contain pointer-events-none"
        />
      </button>

      <div className="absolute left-[40.2%] top-[20.2%] w-[22%] text-center text-[28px] font-bold leading-none text-white">
        $20,000.00
      </div>
      <button
        type="button"
        aria-label="Seeds Sown information"
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute left-[60.2%] top-[15.45%] flex h-3 w-3 items-center justify-center p-0 opacity-60`}
      >
        <img
          src={`${assetPath}/info-icon.png`}
          alt=""
          className="h-full w-full object-contain pointer-events-none"
        />
      </button>

      <div className="absolute left-[75.7%] top-[15.9%] w-[18%] text-center font-headline text-[24px] tracking-[0.24em] text-white">
        SEEDS SOWN
      </div>

      <div className="absolute left-[75.7%] top-[20.2%] w-[18%] text-center bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[28px] font-semibold leading-none text-transparent">
        $8,540.00
      </div>

      <div className="absolute left-[3.3%] top-[28.6%] font-headline text-[13px] tracking-[0.22em] text-[#BDF4FF]">
        QUICK GIVE
      </div>

      {[
        { label: "$25", value: 25, left: "2.8%", width: "8.6%" },
        { label: "$50", value: 50, left: "12.6%", width: "8.6%" },
        { label: "$100", value: 100, left: "21.9%", width: "8.6%" },
        { label: "$250", value: 250, left: "31.3%", width: "8.6%" },
        { label: "Custom", value: "custom" as const, left: "40.5%", width: "9.2%" },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onQuickAmount(item.value)}
          className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute top-[32.05%] flex h-[4.8%] items-center justify-center text-[20px] font-bold text-white`}
          style={{ left: item.left, width: item.width }}
        >
          {item.label}
        </button>
      ))}

      <div className="absolute left-[4.9%] top-[39.8%] font-headline text-[24px] font-semibold tracking-[0.24em] leading-none text-transparent bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text">
        SEED AMOUNT SELECTED
      </div>

      <div className="absolute left-[36.9%] top-[39.3%] flex h-[3.4%] w-[9%] items-center justify-end text-[24px] font-bold text-[#FF2EA6]">
        {amountDisplay}
      </div>

     

      <div className="absolute left-[3.4%] top-[48.3%] font-headline text-[24px] tracking-[0.25em] text-[#BDF4FF]">
        SPEAK LIFE OVER YOUR SEED
      </div>

      <p className="absolute left-[3.2%] top-[53.0%] w-[22%] text-[13px] leading-relaxed text-[#B7C1D9]">
        &ldquo;Lord, I sow this seed believing for breakthrough, provision, and impact.....
      </p>

      <img
        src={`${assetPath}/pulse.png`}
        alt=""
        className="absolute left-[25.0%] top-[52.2%] w-[150px] object-contain"
      />
      <div className="absolute left-[38.0%] top-[49.2%] w-[11.5%] text-[13px] italic leading-relaxed text-white">
        &ldquo;Whoever sows generously will also reap generously.&rdquo;
        <br />
        2 Corinthians 9:6
      </div>

      <div className="absolute left-[54.5%] top-[33.25%] bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[30px] font-semibold leading-none text-transparent">
        {amountDisplay}
      </div>

      {keypadValues.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-label={item.value === "backspace" ? "Backspace" : item.value}
          onClick={() => handleKeypadClick(item.value)}
          className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute flex h-[4.35%] w-[4.2%] items-center justify-center text-[20px] font-semibold text-white`}
          style={{ left: item.left, top: item.top }}
        >
          {item.value === "backspace" ? (
            <img
              src={`${assetPath}/backspace-icon.png`}
              alt="Backspace"
              className="h-5 w-5 object-contain"
            />
          ) : (
            item.value
          )}
        </button>
      ))}

      <div className="absolute left-[78.0%] top-[32.8%] font-headline text-[24px] font-semibold tracking-[0.24em] text-white">
        PAYMENT METHOD
      </div>

      <div className="absolute left-[78.7%] top-[36.0%] text-[13px] text-[#B7C1D9]">
        Secure payments powered by
      </div>

      <img
        src={`${assetPath}/stripe-logo.png`}
        alt="Stripe"
        className="absolute left-[75.0%] top-[39.0%] w-[135px] object-contain"
      />

      <img
        src={`${assetPath}/shield-icon.png`}
        alt="Secure payment shield"
        className="absolute left-[81.0%] top-[45.1%] h-[82px] w-[82px] object-contain"
      />

      <div className="absolute left-[79.2%] top-[55.0%] w-[12%] text-center text-[12px] text-white">
        Fast. Secure. Trusted.
      </div>

      <img
        src={`${assetPath}/lock-icon.png`}
        alt="Secure lock"
        className="absolute left-[72.7%] top-[56.7%] h-12 w-12 object-contain"
      />

      <div className="absolute left-[76.0%] top-[58.7%] text-[12px] text-[#B7C1D9]">
        Your giving is secure and encrypted.
      </div>

      <div className="absolute left-[3.4%] top-[63.4%] font-headline text-[20px] tracking-[0.24em] text-[#BDF4FF]">
        YOUR GIVING JOURNEY
      </div>

      {[
        { icon: "seed-icon.png", label: "Total Seeds Sown", value: "$14,250.00", iconLeft: "5.9%", textLeft: "11.8%" },
        { icon: "people-icon.png", label: "Today", value: "$1,842", iconLeft: "23.4%", textLeft: "29.5%" },
        { icon: "calendar-icon.png", label: "Months Giving", value: "25", iconLeft: "38.1%", textLeft: "44.1%" },
      ].map((item) => (
        <div key={item.label}>
          <img
            src={`${assetPath}/${item.icon}`}
            alt={item.label}
            className="absolute top-[70.1%] h-13 w-13 object-contain"
            style={{ left: item.iconLeft }}
          />
          <div
            className="absolute top-[71.6%] text-[8px] tracking-[0.12em] text-[#BDF4FF]"
            style={{ left: item.textLeft }}
          >
            {item.label}
          </div>
          <div
            className="absolute top-[73.3%] text-[10px] font-bold text-white"
            style={{ left: item.textLeft }}
          >
            {item.value}
          </div>
        </div>
      ))}

      {visibleFeedItems.map((item, index) => (
        <div key={`${item.name}-${feedStart}-${index}`}>
          <img
            src={`${assetPath}/${item.icon}`}
            alt={item.name}
            className="absolute left-[52.3%] h-[32px] w-[32px] object-contain"
            style={{ top: item.top }}
          />
          <div
            className="absolute left-[55.0%] text-[15px] font-semibold text-white"
            style={{ top: item.top }}
          >
            {item.name}
          </div>
          <div
            className="absolute left-[55.0%] text-[12px] text-[#B7C1D9]"
            style={{ top: `calc(${item.top} + 2%)` }}
          >
            {item.date}
          </div>
          <div
            className="absolute right-[5.8%] text-[15px] font-bold"
            style={{ top: item.amountTop, color: item.color }}
          >
            {item.amount}
          </div>
        </div>
      ))}

      <button
        type="button"
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute left-[52.0%] top-[83.0%] text-[14px] text-white`}
      >
        View All Activity
      </button>

      <button
        type="button"
        aria-label="View all activity"
        className={`${VITAL_SEED_OVERLAY_HIT_CLASS} absolute right-[5.7%] top-[82.9%] flex h-[18px] w-[18px] items-center justify-center p-0`}
      >
        <img
          src={`${assetPath}/chevron-right.png`}
          alt=""
          className="h-full w-full object-contain pointer-events-none"
        />
      </button>

      <SowVitalSeedButton onSowSeed={onSowSeed} />
    </div>
  );
}
