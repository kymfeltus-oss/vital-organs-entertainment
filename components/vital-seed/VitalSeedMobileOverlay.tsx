import type { VitalSeedOverlaySharedProps } from "@/lib/vital-seed/giving-overlay-props";
import CustomAmountPad from "@/components/vital-seed/CustomAmountPad";
import QuickGiveButtons from "@/components/vital-seed/QuickGiveButtons";
import SowVitalSeedButton from "@/components/vital-seed/SowVitalSeedButton";

export default function VitalSeedMobileOverlay({
  amountDisplay,
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSowSeed,
}: VitalSeedOverlaySharedProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body text-white">
      <div className="absolute left-[8%] top-[5.4%] font-headline text-[12px] tracking-[0.24em]">
        AVAILABLE IMPACT
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/info-icon.png"
        alt="Available impact information"
        className="pointer-events-auto absolute left-[52%] top-[5.2%] h-4 w-4 object-contain"
      />
      <div className="absolute left-[8%] top-[7.8%] text-[42px] font-bold leading-none">$1,245.00</div>

      <div className="absolute left-[58%] top-[5.4%] font-headline text-[11px] tracking-[0.24em]">
        SEEDS SOWN THIS MONTH
      </div>
      <div className="absolute left-[58%] top-[7.8%] text-[22px] font-bold text-[#00C8FF]">$8,540.00</div>

      <div className="absolute left-[6.5%] top-[14.2%] font-headline text-[12px] tracking-[0.22em] text-[#BDF4FF]">
        QUICK GIVE
      </div>
      <QuickGiveButtons variant="mobile" onQuickAmount={onQuickAmount} />

      <div className="absolute left-[6.5%] top-[22.8%] text-[13px] text-[#B7C1D9]">Seed Amount Selected</div>
      <div className="absolute left-[52%] top-[22.4%] text-[20px] font-bold text-[#FF2EA6]" aria-live="polite">
        {amountDisplay}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/pencil-icon.png"
        alt="Edit selected amount"
        className="pointer-events-auto absolute left-[78%] top-[22.8%] h-4 w-4 object-contain"
      />

      <div className="absolute left-[6.5%] top-[28.8%] font-headline text-[12px] tracking-[0.25em] text-[#BDF4FF]">
        SPEAK LIFE
      </div>
      <p className="absolute left-[6.5%] top-[31.8%] w-[87%] text-[12px] leading-relaxed text-[#B7C1D9]">
        &ldquo;I declare that my seed is vital, productive, and brings forth a harvest of blessing in
        every area of my life...&rdquo;
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/wave-divider.png"
        alt=""
        className="absolute left-[6.5%] top-[36.8%] w-[56px] object-contain"
      />
      <div className="absolute left-[6.5%] top-[38.8%] w-[84%] text-[12px] italic leading-relaxed">
        &ldquo;He who supplies seed to the sower...&rdquo; — 2 Cor 9:10
      </div>

      <div className="absolute left-[6.5%] top-[44.8%] font-headline text-[12px] tracking-[0.24em] text-[#BDF4FF]">
        ENTER CUSTOM AMOUNT
      </div>
      <div
        className="absolute left-[6.5%] top-[47.2%] bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[34px] font-semibold leading-none text-transparent"
        aria-live="polite"
      >
        {amountDisplay}
      </div>
      <CustomAmountPad
        variant="mobile"
        amountRaw={amountRaw}
        onAmountChange={onAmountChange}
      />

      <div className="absolute left-[6.5%] top-[78.2%] font-headline text-[12px] tracking-[0.24em] text-[#BDF4FF]">
        PAYMENT METHOD
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/stripe-logo.svg"
        alt="Stripe"
        className="absolute left-[28%] top-[80.8%] w-[96px] object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vital-seed/shield-icon.png"
        alt="Secure payment shield"
        className="absolute left-[42%] top-[84.8%] h-8 w-8 object-contain"
      />
      <div className="absolute left-[22%] top-[87.8%] text-[13px]">Fast. Secure. Trusted.</div>

      <SowVitalSeedButton variant="mobile" onSowSeed={onSowSeed} />
    </div>
  );
}
