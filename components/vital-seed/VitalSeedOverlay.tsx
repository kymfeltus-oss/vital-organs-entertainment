import type { VitalSeedOverlaySharedProps } from "@/lib/vital-seed/giving-overlay-props";
import CustomAmountPad from "@/components/vital-seed/CustomAmountPad";
import QuickGiveButtons from "@/components/vital-seed/QuickGiveButtons";
import SowVitalSeedButton from "@/components/vital-seed/SowVitalSeedButton";

export default function VitalSeedOverlay({
  amountDisplay,
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSowSeed,
}: VitalSeedOverlaySharedProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body text-white">
      {/* Hero Card */}
      <div className="absolute left-[45.2%] top-[16.4%] font-headline text-[14px] tracking-[0.24em]">
        AVAILABLE IMPACT
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/info-icon.png"
        alt="Available impact information"
        className="pointer-events-auto absolute left-[55.8%] top-[16.1%] h-4 w-4 cursor-pointer object-contain"
      />
      <div
        className="absolute left-[44.6%] top-[18.6%] text-[58px] font-bold leading-none"
        aria-label={`Available impact ${amountDisplay}`}
      >
        $1,245.00
      </div>

      <div className="absolute left-[69.2%] top-[18.8%] font-headline text-[14px] tracking-[0.24em]">
        SEEDS SOWN THIS MONTH
      </div>
      <div className="absolute left-[71.4%] top-[21.4%] text-[30px] font-bold text-[#00C8FF]">
        $8,540.00
      </div>

      {/* Quick Give */}
      <div className="absolute left-[3.3%] top-[30.6%] font-headline text-[13px] tracking-[0.22em] text-[#BDF4FF]">
        QUICK GIVE
      </div>
      <QuickGiveButtons variant="desktop" onQuickAmount={onQuickAmount} />

      {/* Selected Amount */}
      <div className="absolute left-[4.2%] top-[41.8%] text-[14px] text-[#B7C1D9]">Seed Amount Selected</div>
      <div
        className="absolute left-[38.6%] top-[41.3%] text-[24px] font-bold text-[#FF2EA6]"
        aria-live="polite"
      >
        <span className="sr-only">Selected amount </span>
        {amountDisplay}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/pencil-icon.png"
        alt="Edit selected amount"
        className="pointer-events-auto absolute left-[45.8%] top-[41.7%] h-5 w-5 cursor-pointer object-contain"
      />

      {/* Speak Life */}
      <div className="absolute left-[3.4%] top-[50.3%] font-headline text-[14px] tracking-[0.25em] text-[#BDF4FF]">
        SPEAK LIFE
      </div>
      <p className="absolute left-[6.7%] top-[55.3%] w-[24%] text-[13px] leading-relaxed text-[#B7C1D9]">
        &ldquo;I declare that my seed is vital, productive, and brings forth a harvest of blessing in
        every area of my life...&rdquo;
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/wave-divider.png"
        alt=""
        className="absolute left-[30.0%] top-[55.3%] w-[70px] object-contain"
      />
      <div className="absolute left-[36.8%] top-[52.7%] w-[11.5%] text-[13px] italic leading-relaxed">
        &ldquo;He who supplies seed to the sower...&rdquo; — 2 Cor 9:10
      </div>

      {/* Custom Amount */}
      <div className="absolute left-[54.2%] top-[32.8%] font-headline text-[14px] tracking-[0.24em] text-[#BDF4FF]">
        ENTER CUSTOM AMOUNT
      </div>
      <div
        className="absolute left-[53.4%] top-[36.2%] bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[44px] font-semibold leading-none text-transparent"
        aria-live="polite"
      >
        <span className="sr-only">Custom amount </span>
        {amountDisplay}
      </div>
      <CustomAmountPad
        variant="desktop"
        amountRaw={amountRaw}
        onAmountChange={onAmountChange}
      />

      {/* Payment Method */}
      <div className="absolute left-[69.7%] top-[32.8%] font-headline text-[14px] tracking-[0.24em] text-[#BDF4FF]">
        PAYMENT METHOD
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/stripe-logo.svg"
        alt="Stripe"
        className="absolute left-[75.4%] top-[39.2%] w-[120px] object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/shield-icon.png"
        alt="Secure payment shield"
        className="absolute left-[78.6%] top-[49.4%] h-[42px] w-[42px] object-contain"
      />
      <div className="absolute left-[74.6%] top-[55.0%] text-[15px]">Fast. Secure. Trusted.</div>

      <SowVitalSeedButton onSowSeed={onSowSeed} />
    </div>
  );
}
