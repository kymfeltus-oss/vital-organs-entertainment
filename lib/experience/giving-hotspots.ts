/** Invisible hit regions aligned to baked Vital Seed giving background art. */

export const EXPERIENCE_GIVING_MOBILE_ART = {
  width: 941,
  height: 1672,
} as const;

export type GivingHotspotRegion = {
  id: string;
  label: string;
  left: string;
  top: string;
  width: string;
  height: string;
};

export const EXPERIENCE_GIVING_DESKTOP_HOTSPOTS = {
  info: [
    { id: "info-goal", label: "Donation goal information", left: "55.2%", top: "16.0%", width: "1.2%", height: "2%" },
    { id: "info-seeds", label: "Seeds sown information", left: "60.2%", top: "15.45%", width: "1.2%", height: "2%" },
  ],
  quickGive: [
    { id: "quick-25", label: "Give $25", left: "2.8%", top: "32.05%", width: "8.6%", height: "4.8%" },
    { id: "quick-50", label: "Give $50", left: "12.6%", top: "32.05%", width: "8.6%", height: "4.8%" },
    { id: "quick-100", label: "Give $100", left: "21.9%", top: "32.05%", width: "8.6%", height: "4.8%" },
    { id: "quick-250", label: "Give $250", left: "31.3%", top: "32.05%", width: "8.6%", height: "4.8%" },
    { id: "quick-custom", label: "Custom amount", left: "40.5%", top: "32.05%", width: "9.2%", height: "4.8%" },
  ],
  keypad: [
    { id: "key-1", label: "1", left: "53.2%", top: "38.3%", width: "4.2%", height: "4.35%" },
    { id: "key-2", label: "2", left: "58.9%", top: "38.3%", width: "4.2%", height: "4.35%" },
    { id: "key-3", label: "3", left: "64.5%", top: "38.3%", width: "4.2%", height: "4.35%" },
    { id: "key-4", label: "4", left: "53.2%", top: "43.7%", width: "4.2%", height: "4.35%" },
    { id: "key-5", label: "5", left: "58.9%", top: "43.7%", width: "4.2%", height: "4.35%" },
    { id: "key-6", label: "6", left: "64.5%", top: "43.7%", width: "4.2%", height: "4.35%" },
    { id: "key-7", label: "7", left: "53.2%", top: "49.8%", width: "4.2%", height: "4.35%" },
    { id: "key-8", label: "8", left: "58.9%", top: "49.8%", width: "4.2%", height: "4.35%" },
    { id: "key-9", label: "9", left: "64.5%", top: "49.8%", width: "4.2%", height: "4.35%" },
    { id: "key-dot", label: "Decimal", left: "53.2%", top: "55.7%", width: "4.2%", height: "4.35%" },
    { id: "key-0", label: "0", left: "58.9%", top: "55.7%", width: "4.2%", height: "4.35%" },
    { id: "key-backspace", label: "Backspace", left: "64.5%", top: "55.7%", width: "4.2%", height: "4.35%" },
  ],
  misc: [
    { id: "view-activity", label: "View all activity", left: "52.0%", top: "83.0%", width: "14%", height: "2.5%" },
    { id: "view-activity-chevron", label: "View all activity", left: "92.3%", top: "82.9%", width: "2%", height: "2.5%" },
  ],
  sow: {
    id: "sow-seed",
    label: "Sow your Vital Seed",
    left: "21%",
    top: "88.9%",
    width: "58%",
    height: "7.6%",
  },
} as const;

export const EXPERIENCE_GIVING_MOBILE_HOTSPOTS = {
  info: [
    { id: "info-goal", label: "Donation goal information", left: "38%", top: "5.5%", width: "3%", height: "1.5%" },
    { id: "info-seeds", label: "Seeds sown information", left: "88%", top: "5.5%", width: "3%", height: "1.5%" },
  ],
  quickGive: [
    { id: "quick-25", label: "Give $25", left: "5%", top: "15.2%", width: "15%", height: "3.2%" },
    { id: "quick-50", label: "Give $50", left: "22%", top: "15.2%", width: "15%", height: "3.2%" },
    { id: "quick-100", label: "Give $100", left: "39%", top: "15.2%", width: "15%", height: "3.2%" },
    { id: "quick-250", label: "Give $250", left: "56%", top: "15.2%", width: "15%", height: "3.2%" },
    { id: "quick-custom", label: "Custom amount", left: "73%", top: "15.2%", width: "18%", height: "3.2%" },
  ],
  keypad: [
    { id: "key-1", label: "1", left: "8.0%", top: "37.8%", width: "7.5%", height: "3.8%" },
    { id: "key-2", label: "2", left: "17.5%", top: "37.8%", width: "7.5%", height: "3.8%" },
    { id: "key-3", label: "3", left: "27.0%", top: "37.8%", width: "7.5%", height: "3.8%" },
    { id: "key-4", label: "4", left: "8.0%", top: "42.4%", width: "7.5%", height: "3.8%" },
    { id: "key-5", label: "5", left: "17.5%", top: "42.4%", width: "7.5%", height: "3.8%" },
    { id: "key-6", label: "6", left: "27.0%", top: "42.4%", width: "7.5%", height: "3.8%" },
    { id: "key-7", label: "7", left: "8.0%", top: "47.2%", width: "7.5%", height: "3.8%" },
    { id: "key-8", label: "8", left: "17.5%", top: "47.2%", width: "7.5%", height: "3.8%" },
    { id: "key-9", label: "9", left: "27.0%", top: "47.2%", width: "7.5%", height: "3.8%" },
    { id: "key-dot", label: "Decimal", left: "8.0%", top: "52.0%", width: "7.5%", height: "3.8%" },
    { id: "key-0", label: "0", left: "17.5%", top: "52.0%", width: "7.5%", height: "3.8%" },
    { id: "key-backspace", label: "Backspace", left: "27.0%", top: "52.0%", width: "7.5%", height: "3.8%" },
  ],
  misc: [
    { id: "view-activity", label: "View all activity", left: "6%", top: "87.2%", width: "28%", height: "2%" },
    { id: "view-activity-chevron", label: "View all activity", left: "90%", top: "87.1%", width: "4%", height: "2%" },
  ],
  sow: {
    id: "sow-seed",
    label: "Sow your Vital Seed",
    left: "9%",
    top: "94.8%",
    width: "82%",
    height: "4.2%",
  },
} as const;

export function quickAmountFromHotspotId(id: string): number | "custom" | null {
  if (id === "quick-custom") return "custom";
  const match = id.match(/^quick-(\d+)$/);
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

export function keypadValueFromHotspotId(id: string): string | null {
  if (id === "key-backspace") return "backspace";
  if (id === "key-dot") return ".";
  const match = id.match(/^key-(\d)$/);
  return match ? match[1]! : null;
}
