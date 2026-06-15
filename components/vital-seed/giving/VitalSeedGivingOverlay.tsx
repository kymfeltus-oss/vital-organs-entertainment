import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import { formatKeypadAmountDisplay } from "@/lib/vital-seed/custom-amount";
import QuickGiveButtons from "@/components/vital-seed/giving/QuickGiveButtons";
import SelectedAmountBar from "@/components/vital-seed/giving/SelectedAmountBar";
import CustomAmountPad from "@/components/vital-seed/giving/CustomAmountPad";
import PaymentMethodCard from "@/components/vital-seed/giving/PaymentMethodCard";
import SpeakLifeCard from "@/components/vital-seed/giving/SpeakLifeCard";
import GivingJourneyCard from "@/components/vital-seed/giving/GivingJourneyCard";
import RecentActivityCard from "@/components/vital-seed/giving/RecentActivityCard";
import SowVitalSeedButton from "@/components/vital-seed/giving/SowVitalSeedButton";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

type VitalSeedGivingOverlayProps = {
  variant: GivingVariant;
  amountRaw: string;
  onAmountChange: (next: string) => void;
  onQuickAmount: (value: number | "custom") => void;
  onSowSeed: () => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export default function VitalSeedGivingOverlay({
  variant,
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSowSeed,
  isSubmitting = false,
  error = null,
}: VitalSeedGivingOverlayProps) {
  const { positions } = getGivingLayout(variant);
  const amountDisplay = formatKeypadAmountDisplay(amountRaw);

  return (
    <div
      className={`vital-giving-overlay vital-giving-overlay--${variant}`}
      aria-label="Vital Seed giving content"
    >
      <p
        className="vital-giving-label"
        style={givingPointStyle(positions.heroAvailableLabel)}
      >
        Available Impact
      </p>
      <VitalSeedIcon
        asset="infoIcon"
        alt="Available impact information"
        className="vital-giving-info-icon vital-giving-hit"
        style={givingPointStyle(positions.heroAvailableInfo)}
      />
      <p
        className="vital-giving-hero-main"
        style={givingPointStyle(positions.heroAvailableAmount)}
      >
        $1,245.00
      </p>
      <p
        className="vital-giving-label"
        style={givingPointStyle(positions.heroSeedsLabel)}
      >
        Seeds Sown This Month
      </p>
      <p
        className="vital-giving-hero-secondary"
        style={givingPointStyle(positions.heroSeedsAmount)}
      >
        $8,540.00
      </p>

      <QuickGiveButtons variant={variant} onQuickAmount={onQuickAmount} />
      <SelectedAmountBar variant={variant} amountDisplay={amountDisplay} />
      <SpeakLifeCard variant={variant} />
      <CustomAmountPad
        variant={variant}
        amountRaw={amountRaw}
        onAmountChange={onAmountChange}
      />
      <PaymentMethodCard variant={variant} />
      <GivingJourneyCard variant={variant} />
      <RecentActivityCard variant={variant} />
      <SowVitalSeedButton
        variant={variant}
        disabled={isSubmitting}
        onClick={onSowSeed}
      />

      {error ? (
        <p
          className="vital-giving-inline-error font-body"
          role="status"
          style={givingPointStyle(positions.inlineError)}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
