import {
  getGivingLayout,
  givingRectStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import {
  appendKeypadKey,
  formatKeypadAmountDisplay,
  KEYPAD_ROWS,
} from "@/lib/vital-seed/custom-amount";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

type CustomAmountPadProps = {
  variant: GivingVariant;
  amountRaw: string;
  onAmountChange: (next: string) => void;
};

export default function CustomAmountPad({
  variant,
  amountRaw,
  onAmountChange,
}: CustomAmountPadProps) {
  const { panels } = getGivingLayout(variant);
  const amountDisplay = formatKeypadAmountDisplay(amountRaw);

  return (
    <>
      <div
        className="vital-giving-calc-header"
        style={givingRectStyle(panels.calculatorHeader)}
      >
        <p className="vital-giving-label vital-giving-panel-title">Custom Amount</p>
        <p className="vital-giving-calculator-amount" aria-live="polite">
          <span className="sr-only">Custom amount </span>
          {amountDisplay}
        </p>
      </div>
      <div
        className="vital-giving-calc-keypad vital-giving-hit"
        style={givingRectStyle(panels.calculatorKeypad)}
      >
        <div className="vital-giving-keypad-grid">
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
                <VitalSeedIcon
                  asset="backspaceIcon"
                  alt=""
                  className="vital-giving-keypad-backspace"
                />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
