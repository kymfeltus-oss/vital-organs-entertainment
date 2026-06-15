type QuickGiveButtonsProps = {
  variant: "desktop" | "mobile";
  onQuickAmount: (value: number | "custom") => void;
};

const DESKTOP_BUTTONS = [
  { label: "$25", value: 25 as const, className: "left-[13.5%] top-[33.2%]" },
  { label: "$50", value: 50 as const, className: "left-[22.5%] top-[33.2%]" },
  { label: "$100", value: 100 as const, className: "left-[31.5%] top-[33.2%]" },
  { label: "$250", value: 250 as const, className: "left-[40.5%] top-[33.2%]" },
  { label: "Custom", value: "custom" as const, className: "left-[48.5%] top-[33.2%]" },
] as const;

const MOBILE_BUTTONS = [
  { label: "$25", value: 25 as const, className: "left-[6.5%] top-[16.8%]" },
  { label: "$50", value: 50 as const, className: "left-[22%] top-[16.8%]" },
  { label: "$100", value: 100 as const, className: "left-[37%] top-[16.8%]" },
  { label: "$250", value: 250 as const, className: "left-[52%] top-[16.8%]" },
  { label: "Custom", value: "custom" as const, className: "left-[67%] top-[16.8%]" },
] as const;

export default function QuickGiveButtons({ variant, onQuickAmount }: QuickGiveButtonsProps) {
  const buttons = variant === "desktop" ? DESKTOP_BUTTONS : MOBILE_BUTTONS;

  return (
    <>
      {buttons.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`pointer-events-auto absolute touch-target text-[18px] font-semibold transition-colors hover:text-[#00C8FF] ${item.className}`}
          onClick={() => onQuickAmount(item.value)}
        >
          {item.label}
        </button>
      ))}
    </>
  );
}
