"use client";

import { useEffect, useState } from "react";
import type { VitalSeedOverlaySharedProps } from "@/lib/vital-seed/giving-overlay-props";
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
  { top: "78.8%", amountTop: "79.2%" },
  { top: "81.5%", amountTop: "81.9%" },
  { top: "84.2%", amountTop: "84.6%" },
] as const;

export default function VitalSeedMobileOverlay({
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
    { value: "1", left: "8.0%", top: "37.8%" },
    { value: "2", left: "17.5%", top: "37.8%" },
    { value: "3", left: "27.0%", top: "37.8%" },
    { value: "4", left: "8.0%", top: "42.4%" },
    { value: "5", left: "17.5%", top: "42.4%" },
    { value: "6", left: "27.0%", top: "42.4%" },
    { value: "7", left: "8.0%", top: "47.2%" },
    { value: "8", left: "17.5%", top: "47.2%" },
    { value: "9", left: "27.0%", top: "47.2%" },
    { value: ".", left: "8.0%", top: "52.0%" },
    { value: "0", left: "17.5%", top: "52.0%" },
    { value: "backspace", left: "27.0%", top: "52.0%" },
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
      <div className="absolute left-[8%] top-[5.4%] w-[36%] text-center bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text font-headline text-[14px] font-semibold tracking-[0.18em] leading-none text-transparent">
        DONATION GOAL
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/info-icon.png`}
        alt="Donation Goal information"
        className="pointer-events-auto absolute left-[38%] top-[5.5%] h-3 w-3 object-contain opacity-60"
      />

      <div className="absolute left-[6%] top-[7.2%] w-[40%] text-center text-[26px] font-bold leading-none text-white">
        $20,000.00
      </div>

      <div className="absolute left-[58%] top-[5.4%] w-[36%] text-center font-headline text-[14px] tracking-[0.18em] text-white">
        SEEDS SOWN
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/info-icon.png`}
        alt="Seeds Sown information"
        className="pointer-events-auto absolute left-[88%] top-[5.5%] h-3 w-3 object-contain opacity-60"
      />

      <div className="absolute left-[56%] top-[7.2%] w-[40%] text-center bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[26px] font-semibold leading-none text-transparent">
        $8,540.00
      </div>

      <div className="absolute left-[6%] top-[11.8%] font-headline text-[11px] tracking-[0.2em] text-[#BDF4FF]">
        QUICK GIVE
      </div>

      {[
        { label: "$25", value: 25, left: "5%", width: "15%" },
        { label: "$50", value: 50, left: "22%", width: "15%" },
        { label: "$100", value: 100, left: "39%", width: "15%" },
        { label: "$250", value: 250, left: "56%", width: "15%" },
        { label: "Custom", value: "custom" as const, left: "73%", width: "18%" },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onQuickAmount(item.value)}
          className="pointer-events-auto absolute top-[15.2%] flex h-[3.2%] items-center justify-center bg-transparent text-[14px] font-bold text-white"
          style={{ left: item.left, width: item.width }}
        >
          {item.label}
        </button>
      ))}

      <div className="absolute left-[6%] top-[19.5%] font-headline text-[13px] font-semibold tracking-[0.18em] leading-none text-transparent bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text">
        SEED AMOUNT SELECTED
      </div>

      <div className="absolute right-[10%] top-[19.2%] flex h-[3%] w-[22%] items-center justify-end text-[18px] font-bold text-[#FF2EA6]">
        {amountDisplay}
      </div>

      <div className="absolute left-[8%] top-[33.2%] bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[28px] font-semibold leading-none text-transparent">
        {amountDisplay}
      </div>

      {keypadValues.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-label={item.value === "backspace" ? "Backspace" : item.value}
          onClick={() => handleKeypadClick(item.value)}
          className="pointer-events-auto absolute flex h-[3.8%] w-[7.5%] items-center justify-center bg-transparent text-[18px] font-semibold text-white"
          style={{ left: item.left, top: item.top }}
        >
          {item.value === "backspace" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`${assetPath}/backspace-icon.png`}
              alt="Backspace"
              className="h-4 w-4 object-contain"
            />
          ) : (
            item.value
          )}
        </button>
      ))}

      <div className="absolute left-[54%] top-[33.8%] font-headline text-[13px] font-semibold tracking-[0.18em] text-white">
        PAYMENT METHOD
      </div>

      <div className="absolute left-[54%] top-[36.4%] text-[11px] text-[#B7C1D9]">
        Secure payments powered by
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/stripe-logo.png`}
        alt="Stripe"
        className="absolute left-[58%] top-[39.2%] w-[100px] object-contain"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/shield-icon.png`}
        alt="Secure payment shield"
        className="absolute left-[66%] top-[44.8%] h-10 w-10 object-contain"
      />

      <div className="absolute left-[54%] top-[50.8%] w-[36%] text-center text-[11px] text-white">
        Fast. Secure. Trusted.
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/lock-icon.png`}
        alt="Secure lock"
        className="absolute left-[54%] top-[53.8%] h-3.5 w-3.5 object-contain"
      />

      <div className="absolute left-[58%] top-[53.8%] text-[10px] text-[#B7C1D9]">
        Your giving is secure and encrypted.
      </div>

      <div className="absolute left-[6%] top-[59.8%] font-headline text-[13px] tracking-[0.2em] text-[#BDF4FF]">
        SPEAK LIFE OVER YOUR SEED
      </div>

      <p className="absolute left-[6%] top-[62.4%] w-[44%] text-[11px] leading-relaxed text-[#B7C1D9]">
        &ldquo;Lord, I sow this seed believing for breakthrough, provision, and impact.....
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/pulse.png`}
        alt=""
        className="absolute left-[48%] top-[61.8%] w-[72px] object-contain"
      />

      <div className="absolute left-[62%] top-[60.2%] w-[30%] text-[10px] italic leading-relaxed text-white">
        &ldquo;Whoever sows generously will also reap generously.&rdquo;
        <br />
        2 Corinthians 9:6
      </div>

      <div className="absolute left-[6%] top-[69.8%] font-headline text-[13px] tracking-[0.2em] text-[#BDF4FF]">
        YOUR GIVING JOURNEY
      </div>

      {[
        { icon: "seed-icon.png", label: "Total Seeds Sown", value: "$14,250.00", iconLeft: "6%", textLeft: "12%" },
        { icon: "people-icon.png", label: "Today", value: "$1,842", iconLeft: "34%", textLeft: "40%" },
        { icon: "calendar-icon.png", label: "Months Giving", value: "25", iconLeft: "62%", textLeft: "68%" },
      ].map((item) => (
        <div key={item.label}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${assetPath}/${item.icon}`}
            alt={item.label}
            className="absolute top-[72.4%] h-8 w-8 object-contain"
            style={{ left: item.iconLeft }}
          />
          <div
            className="absolute top-[73.6%] text-[8px] tracking-[0.1em] text-[#BDF4FF]"
            style={{ left: item.textLeft }}
          >
            {item.label}
          </div>
          <div
            className="absolute top-[75.0%] text-[10px] font-bold text-white"
            style={{ left: item.textLeft }}
          >
            {item.value}
          </div>
        </div>
      ))}

      {visibleFeedItems.map((item, index) => (
        <div key={`${item.name}-${feedStart}-${index}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${assetPath}/${item.icon}`}
            alt={item.name}
            className="absolute left-[6%] h-[26px] w-[26px] object-contain"
            style={{ top: item.top }}
          />
          <div
            className="absolute left-[12%] text-[13px] font-semibold text-white"
            style={{ top: item.top }}
          >
            {item.name}
          </div>
          <div
            className="absolute left-[12%] text-[10px] text-[#B7C1D9]"
            style={{ top: `calc(${item.top} + 1.4%)` }}
          >
            {item.date}
          </div>
          <div
            className="absolute right-[8%] text-[13px] font-bold"
            style={{ top: item.amountTop, color: item.color }}
          >
            {item.amount}
          </div>
        </div>
      ))}

      <div className="pointer-events-auto absolute left-[6%] top-[87.2%] cursor-pointer text-[12px] text-white">
        View All Activity
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/chevron-right.png`}
        alt="View all activity"
        className="absolute right-[8%] top-[87.1%] h-4 w-4 object-contain"
      />

      <SowVitalSeedButton variant="mobile" onSowSeed={onSowSeed} />
    </div>
  );
}
