/** Mock data for Viewer POV Go Live — visual layout only, no APIs. */

export const POV_MOCK_CREATOR = {
  name: "Ian Craig",
  handle: "@IanCraigAwakening",
  initials: "IC",
  avatarGradient: "linear-gradient(135deg, #00A8FF 0%, #8A2BE2 50%, #FF008C 100%)",
  streamTitle: "300 Awakening — Live Worship & Impact",
  viewerCount: 1_247,
} as const;

export const POV_MOCK_GOAL = {
  raised: 750,
  target: 1_000,
} as const;

export const POV_MOCK_GIFT_ALERT = {
  name: "John",
  amount: 25,
} as const;

export const POV_QUICK_GIFTS = [10, 25, 50] as const;

export type PovChatMessageType = "comment" | "seed";

export type PovMockChatMessage = {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  type: PovChatMessageType;
  accent: "blue" | "pink" | "purple";
};

export const POV_MOCK_CHAT_MESSAGES: PovMockChatMessage[] = [
  {
    id: "1",
    user: "Sarah M.",
    text: "This worship is incredible 🙏",
    timestamp: "8:41 PM",
    type: "comment",
    accent: "pink",
  },
  {
    id: "2",
    user: "Marcus T.",
    text: "Glory to God!",
    timestamp: "8:41 PM",
    type: "comment",
    accent: "blue",
  },
  {
    id: "3",
    user: "Keisha R.",
    text: "sowed a seed",
    timestamp: "8:42 PM",
    type: "seed",
    accent: "purple",
  },
  {
    id: "4",
    user: "Daniel W.",
    text: "The word is hitting different tonight",
    timestamp: "8:42 PM",
    type: "comment",
    accent: "blue",
  },
  {
    id: "5",
    user: "Anonymous",
    text: "Praying with everyone right now",
    timestamp: "8:43 PM",
    type: "comment",
    accent: "pink",
  },
  {
    id: "6",
    user: "Lisa K.",
    text: "sowed a seed",
    timestamp: "8:43 PM",
    type: "seed",
    accent: "pink",
  },
  {
    id: "7",
    user: "Chris P.",
    text: "Thank you for this moment",
    timestamp: "8:44 PM",
    type: "comment",
    accent: "blue",
  },
  {
    id: "8",
    user: "Nina J.",
    text: "He is moving!",
    timestamp: "8:44 PM",
    type: "comment",
    accent: "purple",
  },
];

export function formatPovCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPovViewerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString();
}
