import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

type SelectedAmountBarProps = {
  variant: GivingVariant;
  amountDisplay: string;
};

export default function SelectedAmountBar({
  variant,
  amountDisplay,
}: SelectedAmountBarProps) {
  const { positions } = getGivingLayout(variant);

  return (
    <>
      <span
        className="vital-giving-seed-label"
        style={givingPointStyle(positions.seedLabel)}
      >
        Selected Amount
      </span>
      <span
        className="vital-giving-pink-amount"
        style={givingPointStyle(positions.seedValue)}
        aria-live="polite"
      >
        <span className="sr-only">Selected amount </span>
        {amountDisplay}
      </span>
      <VitalSeedIcon
        asset="pencilIcon"
        alt="Edit selected amount"
        className="vital-giving-seed-edit vital-giving-hit"
        style={givingPointStyle(positions.seedPencil)}
      />
    </>
  );
}
