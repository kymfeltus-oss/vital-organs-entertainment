import {
  getGivingLayout,
  givingRectStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";

type SowVitalSeedButtonProps = {
  variant: GivingVariant;
  disabled?: boolean;
  onClick: () => void;
};

export default function SowVitalSeedButton({
  variant,
  disabled = false,
  onClick,
}: SowVitalSeedButtonProps) {
  const { panels } = getGivingLayout(variant);

  return (
    <div
      className="vital-giving-cta-zone vital-giving-hit"
      style={givingRectStyle(panels.ctaHit)}
    >
      <button
        type="button"
        className="vital-giving-cta-hit touch-target"
        disabled={disabled}
        onClick={onClick}
      >
        <span className="vital-giving-cta-title">SOW YOUR VITAL SEED</span>
        <span className="vital-giving-cta-sub">Thank you for partnering with us!</span>
      </button>
    </div>
  );
}
