type SowVitalSeedButtonProps = {
  variant?: "desktop" | "mobile";
  onSowSeed: () => void;
};

export default function SowVitalSeedButton({
  variant = "desktop",
  onSowSeed,
}: SowVitalSeedButtonProps) {
  const positionClass =
    variant === "desktop"
      ? "left-1/2 top-[90.4%] -translate-x-1/2"
      : "left-1/2 top-[92.4%] -translate-x-1/2";

  return (
    <div className={`pointer-events-auto absolute ${positionClass} flex flex-col items-center`}>
      <button
        type="button"
        className="touch-target font-headline text-[34px] tracking-[0.22em] text-white transition-transform hover:scale-105"
        onClick={onSowSeed}
      >
        SOW YOUR VITAL SEED
      </button>
      <div className="mt-2 flex items-center gap-2 text-[15px] text-white">
        Thank you for partnering with us!
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vital-seed/heart-icon.png"
          alt=""
          className="h-[18px] w-[18px] object-contain"
        />
      </div>
    </div>
  );
}
