"use client";

import {
  Calendar,
  Delete,
  Heart,
  Pencil,
  Sprout,
  Users,
} from "lucide-react";
import {
  appendKeypadKey,
  formatKeypadAmountDisplay,
  KEYPAD_ROWS,
} from "@/lib/vital-seed/custom-amount";
import {
  givingPointStyle,
  VITAL_GIVING_POSITIONS,
} from "@/lib/experience/giving-layout-slots";

type ExperienceGivingContentOverlayProps = {
  amountRaw: string;
  onAmountChange: (next: string) => void;
  onQuickAmount: (value: number | "custom") => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
};

const QUICK_BUTTONS = [
  { label: "$25", value: 25 as const, point: VITAL_GIVING_POSITIONS.quick25 },
  { label: "$50", value: 50 as const, point: VITAL_GIVING_POSITIONS.quick50 },
  { label: "$100", value: 100 as const, point: VITAL_GIVING_POSITIONS.quick100 },
  { label: "$250", value: 250 as const, point: VITAL_GIVING_POSITIONS.quick250 },
  { label: "Custom", value: "custom" as const, point: VITAL_GIVING_POSITIONS.quickCustom },
] as const;

const KEYPAD = VITAL_GIVING_POSITIONS.calculatorKeypad;

export default function ExperienceGivingContentOverlay({
  amountRaw,
  onAmountChange,
  onQuickAmount,
  onSubmit,
  isSubmitting,
  error,
}: ExperienceGivingContentOverlayProps) {
  const amountDisplay = formatKeypadAmountDisplay(amountRaw);
  const seedAmountDisplay = formatKeypadAmountDisplay(amountRaw);

  return (
    <div className="vital-giving-overlay" aria-label="Vital Seed giving content">
      {/* Hero */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.heroAvailableLabel)}>
        Available Impact
      </p>
      <p className="vital-giving-hero-main" style={givingPointStyle(VITAL_GIVING_POSITIONS.heroAvailableAmount)}>
        $1,245.00
      </p>
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.heroSeedsLabel)}>
        Seeds Sown This Month
      </p>
      <p className="vital-giving-hero-secondary" style={givingPointStyle(VITAL_GIVING_POSITIONS.heroSeedsAmount)}>
        $8,540.00
      </p>

      {/* Quick give */}
      {QUICK_BUTTONS.map((item) => (
        <button
          key={item.label}
          type="button"
          className="vital-giving-quick-btn vital-giving-hit touch-target"
          style={givingPointStyle(item.point)}
          onClick={() => onQuickAmount(item.value)}
        >
          {item.label}
        </button>
      ))}

      {/* Seed amount row */}
      <span className="vital-giving-seed-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.seedLabel)}>
        Seed Amount Selected
      </span>
      <span className="vital-giving-pink-amount" style={givingPointStyle(VITAL_GIVING_POSITIONS.seedValue)}>
        {seedAmountDisplay}
      </span>
      <Pencil
        className="vital-giving-seed-edit vital-giving-hit"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.seedPencil)}
        strokeWidth={1.75}
        aria-hidden="true"
      />

      {/* Speak life */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.speakLifeTitle)}>
        Speak Life Over Your Seed
      </p>
      <p className="vital-giving-body" style={givingPointStyle(VITAL_GIVING_POSITIONS.speakLifeDeclaration)}>
        Lord, I sow this seed believing for breakthrough, provision, and impact...
      </p>
      <p className="vital-giving-scripture" style={givingPointStyle(VITAL_GIVING_POSITIONS.speakLifeScripture)}>
        2 Corinthians 9:10
      </p>

      {/* Calculator */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.calculatorTitle)}>
        Custom Amount
      </p>
      <p
        className="vital-giving-calculator-amount"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.calculatorAmount)}
      >
        {amountDisplay}
      </p>
      <div
        className="vital-giving-keypad-grid vital-giving-hit"
        style={{
          position: "absolute",
          left: `${KEYPAD.left}%`,
          top: `${KEYPAD.top}%`,
          width: `${KEYPAD.width}%`,
          height: `${KEYPAD.height}%`,
        }}
      >
        {KEYPAD_ROWS.flat().map((key) => (
          <button
            key={key}
            type="button"
            className="vital-giving-keypad-btn touch-target"
            aria-label={
              key === "backspace"
                ? "Backspace"
                : key === "."
                  ? "Decimal"
                  : `Digit ${key}`
            }
            onClick={() => onAmountChange(appendKeypadKey(amountRaw, key))}
          >
            {key === "backspace" ? (
              <Delete className="h-[1em] w-[1em]" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Payment method */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.stripeTitle)}>
        Payment Method
      </p>
      <p className="vital-giving-muted" style={givingPointStyle(VITAL_GIVING_POSITIONS.stripeSub)}>
        Secure payments powered by
      </p>
      <p className="vital-giving-stripe-logo" style={givingPointStyle(VITAL_GIVING_POSITIONS.stripeLogo)}>
        Stripe
      </p>
      <p className="vital-giving-stripe-tag" style={givingPointStyle(VITAL_GIVING_POSITIONS.stripeTag)}>
        Fast. Secure. Trusted.
      </p>
      <p className="vital-giving-muted" style={givingPointStyle(VITAL_GIVING_POSITIONS.stripeFoot)}>
        Your giving is secure and encrypted.
      </p>

      {/* Giving journey */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyTitle)}>
        Your Giving Journey
      </p>
      <Sprout
        className="vital-giving-metric-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric1Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-metric-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric1Label)}>
        Total Seeds Sown
      </span>
      <span className="vital-giving-metric-value" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric1Value)}>
        $14,250.00
      </span>
      <Users
        className="vital-giving-metric-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric2Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-metric-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric2Label)}>
        Lives Impacted
      </span>
      <span className="vital-giving-metric-value" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric2Value)}>
        1,842
      </span>
      <Calendar
        className="vital-giving-metric-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric3Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-metric-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric3Label)}>
        Months Giving
      </span>
      <span className="vital-giving-metric-value" style={givingPointStyle(VITAL_GIVING_POSITIONS.journeyMetric3Value)}>
        18
      </span>

      {/* Recent activity */}
      <p className="vital-giving-label" style={givingPointStyle(VITAL_GIVING_POSITIONS.activityTitle)}>
        Recent Activity
      </p>
      <Sprout
        className="vital-giving-activity-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity1Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-activity-title" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity1Title)}>
        Vital Seed
      </span>
      <span className="vital-giving-activity-date" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity1Date)}>
        Today
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity1Amount)}
      >
        $100.00
      </span>
      <Heart
        className="vital-giving-activity-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity2Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-activity-title" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity2Title)}>
        Tithe
      </span>
      <span className="vital-giving-activity-date" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity2Date)}>
        Jan 15, 2025
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity2Amount)}
      >
        $250.00
      </span>
      <Users
        className="vital-giving-activity-icon"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity3Icon)}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="vital-giving-activity-title" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity3Title)}>
        Outreach
      </span>
      <span className="vital-giving-activity-date" style={givingPointStyle(VITAL_GIVING_POSITIONS.activity3Date)}>
        Jan 10, 2025
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(VITAL_GIVING_POSITIONS.activity3Amount)}
      >
        $50.00
      </span>

      {/* Bottom CTA */}
      <button
        type="button"
        className="vital-giving-cta-hit vital-giving-hit touch-target"
        style={{
          position: "absolute",
          left: `${VITAL_GIVING_POSITIONS.ctaHit.left}%`,
          top: `${VITAL_GIVING_POSITIONS.ctaHit.top}%`,
          width: `${VITAL_GIVING_POSITIONS.ctaHit.width}%`,
          height: `${VITAL_GIVING_POSITIONS.ctaHit.height}%`,
        }}
        disabled={isSubmitting}
        onClick={onSubmit}
        aria-label="Sow your vital seed"
      />
      <p className="vital-giving-cta-title" style={givingPointStyle(VITAL_GIVING_POSITIONS.ctaTitle)}>
        Sow Your Vital Seed
      </p>
      <p className="vital-giving-cta-sub" style={givingPointStyle(VITAL_GIVING_POSITIONS.ctaSub)}>
        Thank you for partnering with us!
        <Heart className="vital-giving-cta-heart" strokeWidth={1.75} aria-hidden="true" />
      </p>

      {error ? (
        <p className="vital-giving-inline-error font-body" role="status" style={givingPointStyle({ left: 50, top: 96, centerX: true })}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
