export type VitalSeedOverlaySharedProps = {
  amountRaw: string;
  amountDisplay: string;
  onAmountChange: (next: string) => void;
  onQuickAmount: (value: number | "custom") => void;
  onSowSeed: () => void;
};
