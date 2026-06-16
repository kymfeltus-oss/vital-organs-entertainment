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
      ? "left-1/2 top-[88.9%] h-[7.6%] w-[58%] -translate-x-1/2"
      : "left-1/2 top-[94.8%] h-[4.2%] w-[82%] -translate-x-1/2";

  const titleClass =
    variant === "desktop"
      ? "text-[34px] tracking-[0.22em]"
      : "text-[24px] tracking-[0.16em]";

  const subtitleClass =
    variant === "desktop" ? "text-[15px]" : "text-[12px]";

  const heartClass =
    variant === "desktop" ? "h-[18px] w-[18px]" : "h-[14px] w-[14px]";

  return (
    <div
      className={`pointer-events-auto absolute ${positionClass} flex flex-col items-center justify-center text-center`}
    >
      <button
        type="button"
        className={`font-headline leading-none text-white transition-transform hover:scale-105 ${titleClass}`}
        onClick={onSowSeed}
      >
        SOW YOUR VITAL SEED
      </button>

      <div className={`mt-2 flex items-center justify-center gap-2 text-white ${subtitleClass}`}>
        <span>Thank you for partnering with us!</span>
        <img
          src="/images/vital-seed/heart-icon.png"
          alt=""
          className={`object-contain ${heartClass}`}
        />
      </div>
    </div>
  );
}