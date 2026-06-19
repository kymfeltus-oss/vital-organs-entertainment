/** Invisible PNG artboard hit targets — no visible chrome. */
export const VITAL_SEED_OVERLAY_HIT_CLASS = "artboard-hit-target";

export type VitalSeedOverlaySharedProps = {
  amountRaw: string;
  amountDisplay: string;
  onAmountChange: (next: string) => void;
  onQuickAmount: (value: number | "custom") => void;
  onSowSeed: () => void;
};
