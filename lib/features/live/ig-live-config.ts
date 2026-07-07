/** Instagram-style live viewer chrome — creator + brand copy. */

import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";

import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const IG_LIVE_CREATOR = {
  name: "Host",
  subtitle: PLATFORM_APP_NAME,
  avatarSrc: null as string | null,
  exitHref: ATTENDEE_DASHBOARD_PATH,
} as const;

export type IgLiveSheetAction = "prayer" | "give" | "program" | "polls" | "more" | null;

export const IG_LIVE_SHEET_TITLES: Record<
  Exclude<IgLiveSheetAction, null | "more">,
  string
> = {
  prayer: "Prayer",
  give: "Give Seeds",
  program: "Event Program",
  polls: "Live Polls",
};
