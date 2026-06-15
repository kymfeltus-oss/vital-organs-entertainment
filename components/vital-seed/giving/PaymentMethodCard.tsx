import {
  getGivingLayout,
  givingRectStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";

type PaymentMethodCardProps = {
  variant: GivingVariant;
};

export default function PaymentMethodCard({ variant }: PaymentMethodCardProps) {
  const { panels } = getGivingLayout(variant);

  return (
    <div className="vital-giving-stripe-panel" style={givingRectStyle(panels.stripe)}>
      <p className="vital-giving-label vital-giving-panel-title">Payment Method</p>
      <div className="vital-giving-stripe-inner">
        <p className="vital-giving-muted">Secure payments powered by</p>
        <p className="vital-giving-stripe-logo-text" aria-label="Stripe">
          Stripe
        </p>
        <p className="vital-giving-stripe-tag">Fast. Secure. Trusted.</p>
      </div>
      <p className="vital-giving-stripe-foot">Your giving is secure and encrypted.</p>
    </div>
  );
}
