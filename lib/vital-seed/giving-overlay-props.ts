/** Shared class for invisible artboard buttons — press feedback + touch. */
export const VITAL_SEED_OVERLAY_HIT_CLASS =
  "vital-seed-overlay-hit pointer-events-auto bg-transparent";

export type VitalSeedOverlaySharedProps = {
  amountRaw: string;
  amountDisplay: string;
  onAmountChange: (next: string) => void;
  onQuickAmount: (value: number | "custom") => void;
  onSowSeed: () => void;
};
