import type { MonetizationReminderCtaKind } from "@/lib/owner/graphics-monetization-reminders";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";

const BUY_SEEDS_PATH = "/buy-seeds";
const GIVING_PATH = "/giving";

export function buildMonetizationReminderHref(ctaKind: MonetizationReminderCtaKind): string | null {
  switch (ctaKind) {
    case "buy_seeds":
      return `${BUY_SEEDS_PATH}?from=${encodeURIComponent(EXPERIENCE_LIVE_PATH)}`;
    case "give":
    case "support_ian":
      return `${GIVING_PATH}?from=${encodeURIComponent(EXPERIENCE_LIVE_PATH)}`;
    case "sow_seeds":
      return null;
    default:
      return null;
  }
}

export function monetizationReminderUsesInLiveAction(
  ctaKind: MonetizationReminderCtaKind,
): boolean {
  return ctaKind === "sow_seeds";
}
