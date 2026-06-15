"use client";

import { useEffect, useRef } from "react";
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
  givingRectStyle,
  VITAL_GIVING_PANELS,
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
  const ctaZoneRef = useRef<HTMLDivElement>(null);
  const calcKeypadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = ctaZoneRef.current;
    if (!zone) return;

    const measure = () => {
      const rect = zone.getBoundingClientRect();
      const overlay = zone.offsetParent as HTMLElement | null;
      const overlayRect = overlay?.getBoundingClientRect();
      if (!overlayRect) return;

      const zoneTopPct = ((rect.top - overlayRect.top) / overlayRect.height) * 100;
      const zoneHeightPct = (rect.height / overlayRect.height) * 100;

      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "baf5b9",
        },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "cta-fix-v2",
          hypothesisId: "CTA",
          location: "ExperienceGivingContentOverlay.tsx",
          message: "cta-zone-bounds",
          data: {
            zoneTopPct: Number(zoneTopPct.toFixed(2)),
            zoneHeightPct: Number(zoneHeightPct.toFixed(2)),
            zoneCenterPct: Number((zoneTopPct + zoneHeightPct / 2).toFixed(2)),
            zoneHPx: Math.round(rect.height),
            expectedTop: VITAL_GIVING_POSITIONS.ctaHit.top,
            expectedHeight: VITAL_GIVING_POSITIONS.ctaHit.height,
            pngInnerCenter: 88.92,
            nudge: "top+0.9%, pad-top",
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(zone);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const keypad = calcKeypadRef.current;
    const overlay = keypad?.offsetParent as HTMLElement | null;
    if (!keypad || !overlay) return;

    const measure = () => {
      const rect = keypad.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const firstBtn = keypad.querySelector("button");
      const btnRect = firstBtn?.getBoundingClientRect();

      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "baf5b9",
        },
        body: JSON.stringify({
          sessionId: "baf5b9",
          runId: "calc-fix-v3",
          hypothesisId: "KEYPAD",
          location: "ExperienceGivingContentOverlay.tsx",
          message: "keypad-zone-bounds",
          data: {
            keypadTopPct: Number((((rect.top - overlayRect.top) / overlayRect.height) * 100).toFixed(2)),
            keypadHeightPct: Number(((rect.height / overlayRect.height) * 100).toFixed(2)),
            keypadHPx: Math.round(rect.height),
            btnHPx: btnRect ? Math.round(btnRect.height) : -1,
            expectedTop: VITAL_GIVING_PANELS.calculatorKeypad.top,
            expectedHeight: VITAL_GIVING_PANELS.calculatorKeypad.height,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(keypad);
    return () => observer.disconnect();
  }, []);

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

      {/* Calculator — split header (title + amount) and keypad zones */}
      <div
        className="vital-giving-calc-header"
        style={givingRectStyle(VITAL_GIVING_PANELS.calculatorHeader)}
      >
        <p className="vital-giving-label vital-giving-panel-title">Custom Amount</p>
        <p className="vital-giving-calculator-amount">{amountDisplay}</p>
      </div>
      <div
        ref={calcKeypadRef}
        className="vital-giving-calc-keypad vital-giving-hit"
        style={givingRectStyle(VITAL_GIVING_PANELS.calculatorKeypad)}
      >
        <div className="vital-giving-keypad-grid">
          {KEYPAD_ROWS.flat().map((key) => (
            <button
              key={key}
              type="button"
              className="vital-giving-keypad-btn"
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
      </div>

      {/* Payment method — panel-contained layout */}
      <div
        className="vital-giving-stripe-panel"
        style={givingRectStyle(VITAL_GIVING_PANELS.stripe)}
      >
        <p className="vital-giving-label vital-giving-panel-title">Payment Method</p>
        <div className="vital-giving-stripe-inner">
          <p className="vital-giving-muted">Secure payments powered by</p>
          <p className="vital-giving-stripe-logo" aria-label="Stripe">
            Stripe
          </p>
          <p className="vital-giving-stripe-tag">Fast. Secure. Trusted.</p>
        </div>
        <p className="vital-giving-stripe-foot">Your giving is secure and encrypted.</p>
      </div>

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

      {/* Bottom CTA — title + subtitle stacked inside neon pill */}
      <div
        ref={ctaZoneRef}
        className="vital-giving-cta-zone vital-giving-hit"
        style={givingRectStyle(VITAL_GIVING_POSITIONS.ctaHit)}
      >
        <button
          type="button"
          className="vital-giving-cta-hit touch-target"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          <span className="vital-giving-cta-title">Sow Your Vital Seed</span>
          <span className="vital-giving-cta-sub">
            Thank you for partnering with us!
            <Heart className="vital-giving-cta-heart" strokeWidth={1.75} aria-hidden="true" />
          </span>
        </button>
      </div>

      {error ? (
        <p className="vital-giving-inline-error font-body" role="status" style={givingPointStyle({ left: 50, top: 96, centerX: true })}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
