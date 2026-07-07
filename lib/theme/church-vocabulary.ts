export interface ChurchVocabulary {
  // Navigation Shell Targets
  homeLabel: string;
  browseLabel: string;
  liveStageLabel: string;
  tokenShopLabel: string;
  supportLabel: string;

  // Real-Time Interaction Elements
  intercessionButtonLabel: string;
  intercessionPlaceholder: string;
  intercessionSuccessNotice: string;

  // Real-Time Fellowship Feed Announcements
  seedSownNotification: (username: string) => string;
  directGiftNotification: (username: string, amount: string) => string;
}

export const CURRENT_CHURCH_VOCABULARY: ChurchVocabulary = {
  // Navigation Labels
  homeLabel: "Sanctuary Home",
  browseLabel: "Sermon Archive",
  liveStageLabel: "Live Stage",
  tokenShopLabel: "Seed Wallet",
  supportLabel: "Tithes & Offerings",

  // Interactive Altar Prayer Panel
  intercessionButtonLabel: "Submit Prayer Request",
  intercessionPlaceholder:
    "Type your prayer request or testimony notes here for the ministry intercession team...",
  intercessionSuccessNotice:
    "Prayer request logged securely into our pending backstage intercession rows.",

  // Real-Time Congregational Feed Templates (Scrubbed of all non-ministry context)
  seedSownNotification: (username: string) => `${username} sowed a Seed of Faith! 🌾`,
  directGiftNotification: (username: string, amount: string) =>
    `${username} supported the ministry with a direct offering of ${amount}! 🏺`,
};
