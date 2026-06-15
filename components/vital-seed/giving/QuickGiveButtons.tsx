import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";

type QuickGiveButtonsProps = {
  variant: GivingVariant;
  onQuickAmount: (value: number | "custom") => void;
};

const QUICK_ITEMS = [
  { label: "$25", value: 25 as const, key: "quick25" as const },
  { label: "$50", value: 50 as const, key: "quick50" as const },
  { label: "$100", value: 100 as const, key: "quick100" as const },
  { label: "$250", value: 250 as const, key: "quick250" as const },
  { label: "Custom", value: "custom" as const, key: "quickCustom" as const },
] as const;

export default function QuickGiveButtons({
  variant,
  onQuickAmount,
}: QuickGiveButtonsProps) {
  const { positions } = getGivingLayout(variant);

  return (
    <>
      {QUICK_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          className="vital-giving-quick-btn vital-giving-hit touch-target"
          style={givingPointStyle(positions[item.key])}
          onClick={() => onQuickAmount(item.value)}
        >
          {item.label}
        </button>
      ))}
    </>
  );
}
