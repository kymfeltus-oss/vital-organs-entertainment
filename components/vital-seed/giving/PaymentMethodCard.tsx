import {
  getGivingLayout,
  givingRectStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import { VITAL_SEED_GIVING_ASSETS } from "@/lib/vital-seed/giving-assets";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

type PaymentMethodCardProps = {
  variant: GivingVariant;
};

export default function PaymentMethodCard({ variant }: PaymentMethodCardProps) {
  const { panels } = getGivingLayout(variant);

  return (
    <div className="vital-giving-stripe-panel" style={givingRectStyle(panels.stripe)}>
      <p className="vital-giving-label vital-giving-panel-title">Payment Method</p>
      <div className="vital-giving-stripe-inner">
        <VitalSeedIcon
          asset="shieldIcon"
          alt="Secure payment shield"
          className="vital-giving-stripe-shield"
        />
        <p className="vital-giving-muted">Secure payments powered by</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VITAL_SEED_GIVING_ASSETS.stripeLogo}
          alt="Stripe"
          className="vital-giving-stripe-logo-img"
        />
        <p className="vital-giving-stripe-tag">Fast. Secure. Trusted.</p>
      </div>
      <p className="vital-giving-stripe-foot">
        <VitalSeedIcon
          asset="lockIcon"
          alt="Encrypted lock"
          className="vital-giving-stripe-lock"
        />
        Your giving is secure and encrypted.
      </p>
    </div>
  );
}
