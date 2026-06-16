import type { VitalSeedOverlaySharedProps } from "@/lib/vital-seed/giving-overlay-props";
import SowVitalSeedButton from "@/components/vital-seed/SowVitalSeedButton";

const assetPath = "/images/vital-seed";

export default function VitalSeedMobileOverlay({
  amountDisplay,
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSowSeed,
}: VitalSeedOverlaySharedProps) {
  const keypadValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];

  const handleKeypadClick = (value: string) => {
    if (value === "backspace") {
      onAmountChange(amountRaw.slice(0, -1));
      return;
    }

    if (value === "." && amountRaw.includes(".")) {
      return;
    }

    onAmountChange(`${amountRaw}${value}`);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body text-white">
      <div className="absolute left-[38%] top-[18.7%] font-headline text-[12px] tracking-[0.2em] text-white">
        AVAILABLE IMPACT
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/info-icon.png`}
        alt="Available impact information"
        className="pointer-events-auto absolute left-[60%] top-[18.4%] h-3.5 w-3.5 object-contain"
      />

      <div className="absolute left-[31%] top-[20.6%] text-[42px] font-bold leading-none text-white">
        $1,245.00
      </div>

      <div className="absolute left-[36%] top-[25.8%] font-headline text-[11px] tracking-[0.2em] text-white">
        SEEDS SOWN THIS MONTH
      </div>

      <div className="absolute left-[38%] top-[27.6%] text-[22px] font-bold text-[#00C8FF]">
        $8,540.00
      </div>

      {[
        { label: "$25", value: 25, left: "8%", width: "13%" },
        { label: "$50", value: 50, left: "25%", width: "13%" },
        { label: "$100", value: 100, left: "43%", width: "13%" },
        { label: "$250", value: 250, left: "61%", width: "13%" },
        { label: "Custom", value: "custom" as const, left: "79%", width: "15%" },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onQuickAmount(item.value)}
          className="pointer-events-auto absolute top-[37.5%] flex h-[3.2%] items-center justify-center bg-transparent text-[14px] font-bold text-white"
          style={{ left: item.left, width: item.width }}
        >
          {item.label}
        </button>
      ))}

      <div className="absolute left-[7%] top-[43.9%] text-[12px] text-[#B7C1D9]">
        Seed Amount Selected
      </div>

      <div className="absolute right-[12%] top-[43.6%] text-[18px] font-bold text-[#FF2EA6]">
        {amountDisplay}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/pencil-icon.png`}
        alt="Edit selected amount"
        className="pointer-events-auto absolute right-[7%] top-[43.8%] h-4 w-4 object-contain"
      />

      <div className="absolute left-[8%] top-[52.1%] font-headline text-[12px] tracking-[0.2em] text-[#BDF4FF]">
        CUSTOM AMOUNT
      </div>

      <div className="absolute left-[8%] top-[54.0%] bg-gradient-to-r from-[#00C8FF] via-[#A855F7] to-[#FF2EA6] bg-clip-text text-[34px] font-semibold leading-none text-transparent">
        {amountDisplay}
      </div>

      <div className="pointer-events-auto absolute left-[6.5%] top-[59.4%] grid h-[17.5%] w-[36%] grid-cols-3 gap-y-[8%]">
        {keypadValues.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={value === "backspace" ? "Backspace" : value}
            onClick={() => handleKeypadClick(value)}
            className="flex h-full w-full items-center justify-center bg-transparent text-[20px] font-semibold text-white"
          >
            {value === "backspace" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`${assetPath}/backspace-icon.png`}
                alt="Backspace"
                className="h-4 w-4 object-contain"
              />
            ) : (
              value
            )}
          </button>
        ))}
      </div>

      <div className="absolute left-[55%] top-[52.1%] font-headline text-[12px] tracking-[0.2em] text-[#BDF4FF]">
        PAYMENT METHOD
      </div>

      <div className="absolute left-[55%] top-[55.0%] text-[11px] text-[#B7C1D9]">
        Secure payments powered by
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/stripe-logo.svg`}
        alt="Stripe"
        className="absolute left-[62%] top-[59.0%] w-[100px] object-contain"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/shield-icon.png`}
        alt="Secure payment shield"
        className="absolute left-[66%] top-[66.0%] h-9 w-9 object-contain"
      />

      <div className="absolute left-[56%] top-[70.5%] text-[13px] text-white">
        Fast. Secure. Trusted.
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/lock-icon.png`}
        alt="Secure lock"
        className="absolute left-[55%] top-[74.0%] h-3.5 w-3.5 object-contain"
      />

      <div className="absolute left-[59%] top-[74.0%] text-[10px] text-[#B7C1D9]">
        Your giving is secure and encrypted.
      </div>

      <div className="absolute left-[6%] top-[78.4%] font-headline text-[12px] tracking-[0.2em] text-[#BDF4FF]">
        SPEAK LIFE OVER YOUR SEED
      </div>

      <p className="absolute left-[8%] top-[81.0%] w-[48%] text-[12px] leading-relaxed text-[#B7C1D9]">
        Lord, I sow this seed believing for breakthrough, provision, and impact.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/wave-divider.png`}
        alt=""
        className="absolute left-[57%] top-[81.5%] w-[54px] object-contain"
      />

      <div className="absolute left-[69%] top-[80.0%] w-[24%] text-[10px] italic leading-relaxed text-white">
        &ldquo;Whoever sows generously will also reap generously.&rdquo;
        <br />
        2 Corinthians 9:6
      </div>

      <div className="absolute left-[6%] top-[89.2%] font-headline text-[12px] tracking-[0.2em] text-[#BDF4FF]">
        YOUR GIVING JOURNEY
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/seed-icon.png`}
        alt="Total Seeds Sown"
        className="absolute left-[7%] top-[92%] h-[38px] w-[38px] object-contain"
      />

      <div className="absolute left-[17%] top-[92%] text-[10px] text-[#BDF4FF]">
        Total Seeds Sown
      </div>

      <div className="absolute left-[17%] top-[93.7%] text-[16px] font-bold text-white">
        $14,250.00
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${assetPath}/people-icon.png`}
        alt="Lives Impacted"
        className="absolute left-[7%] top-[96%] h-[38px] w-[38px] object-contain"
      />

      <div className="absolute left-[17%] top-[96%] text-[10px] text-[#BDF4FF]">
        Lives Impacted
      </div>

      <div className="absolute left-[17%] top-[97.7%] text-[16px] font-bold text-white">
        1,842
      </div>

      <SowVitalSeedButton variant="mobile" onSowSeed={onSowSeed} />
    </div>
  );
}
