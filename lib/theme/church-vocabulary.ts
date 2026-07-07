// Overwriting lib/theme/church-vocabulary.ts to reflect PΛRΛBLE Giving infrastructure

export interface ChurchVocabulary {
  // Navigation Core System Hubs (100% customizable by the local church operator)
  homeLabel: string;
  browseLabel: string;
  liveStageLabel: string;
  tokenShopLabel: string;
  supportLabel: string; // Defaults to PΛRΛBLE Giving configuration

  // Real-Time Interaction Elements
  intercessionButtonLabel: string;
  intercessionPlaceholder: string;
  intercessionSuccessNotice: string;

  // Real-Time Congregational Feed Announcements
  seedSownNotification: (username: string) => string;
  directGiftNotification: (username: string, amount: string) => string;
}

export const CURRENT_CHURCH_VOCABULARY: ChurchVocabulary = {
  // Default values for white-label church nodes.
  // NOTE: Operators can completely overwrite these labels via the Private Console Registry.
  homeLabel: "Sanctuary Home",
  browseLabel: "Sermon Archive",
  liveStageLabel: "Live Stage",
  tokenShopLabel: "Token Management",
  supportLabel: "PΛRΛBLE Giving", // Erased all legacy branding

  // Interactive Altar Prayer Panel
  intercessionButtonLabel: "Submit Prayer Request",
  intercessionPlaceholder:
    "Type your prayer request or testimony notes here for the ministry intercession team...",
  intercessionSuccessNotice:
    "Prayer request logged securely into our pending backstage intercession rows.",

  // Real-Time Congregational Feed Templates
  seedSownNotification: (username: string) =>
    `${username} contributed a digital token support token! 🌾`,
  directGiftNotification: (username: string, amount: string) =>
    `${username} supported the sanctuary with a direct offering of ${amount}! 🏺`,
};
