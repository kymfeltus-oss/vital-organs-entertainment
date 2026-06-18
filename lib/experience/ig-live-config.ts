/** Instagram-style live viewer chrome — creator + brand copy. */

export const IG_LIVE_CREATOR = {
  name: "IAN CRAIG",
  subtitle: "300 Awakening",
  avatarSrc: "/images/vital-seed/vital-seed-orb.png",
  exitHref: "/experience",
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
