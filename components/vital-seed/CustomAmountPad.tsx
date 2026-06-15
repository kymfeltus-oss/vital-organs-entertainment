import { appendKeypadKey, type KeypadKey } from "@/lib/vital-seed/custom-amount";

type CustomAmountPadProps = {
  variant: "desktop" | "mobile";
  amountRaw: string;
  onAmountChange: (next: string) => void;
};

const KEYS: KeypadKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

export default function CustomAmountPad({
  variant,
  amountRaw,
  onAmountChange,
}: CustomAmountPadProps) {
  const isDesktop = variant === "desktop";
  const containerClass = isDesktop
    ? "absolute left-[51.3%] top-[43.0%] h-[17.8%] w-[15.1%]"
    : "absolute left-[6.5%] top-[59.4%] h-[17.5%] w-[36%]";

  return (
    <div className={`${containerClass} pointer-events-auto grid grid-cols-3`}>
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className="touch-target flex items-center justify-center text-[19px] font-medium transition-colors hover:text-[#00C8FF]"
          aria-label={key === "." ? "Decimal" : `Digit ${key}`}
          onClick={() => onAmountChange(appendKeypadKey(amountRaw, key))}
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        className="touch-target flex items-center justify-center"
        aria-label="Backspace"
        onClick={() => onAmountChange(appendKeypadKey(amountRaw, "backspace"))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vital-seed/backspace-icon.png"
          alt=""
          className="h-[22px] w-[22px] object-contain"
        />
      </button>
    </div>
  );
}
