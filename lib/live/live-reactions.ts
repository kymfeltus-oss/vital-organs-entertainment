/** Known live reaction asset ids — includes legacy ids for safe broadcast parsing. */
export const LIVE_REACTION_ASSET_IDS = [
  "heart_reaction",
  "seed_fire",
  "praise_break",
  "praise_break_man",
  "hallelujah",
  "awakening_glow",
] as const;

export type LiveReactionAssetId = (typeof LIVE_REACTION_ASSET_IDS)[number];

export type LiveReactionDefinition = {
  assetId: LiveReactionAssetId;
  label: string;
  emoji: string;
  imageSrc: string | null;
  chatNotice: string;
  ledgerLabel: string;
  accessibilityLabel?: string;
};

const REACTION_DEFINITIONS: Record<LiveReactionAssetId, LiveReactionDefinition> = {
  heart_reaction: {
    assetId: "heart_reaction",
    label: "Heart",
    emoji: "❤️",
    imageSrc: null,
    chatNotice: "❤️ sent love to the room",
    ledgerLabel: "Heart Reaction",
  },
  seed_fire: {
    assetId: "seed_fire",
    label: "Fire",
    emoji: "🔥",
    imageSrc: null,
    chatNotice: "🔥 Fire on stage",
    ledgerLabel: "Fire Reaction",
  },
  praise_break: {
    assetId: "praise_break",
    label: "Praise Break",
    emoji: "💃🏿",
    imageSrc: "/images/emojis/praise-break-woman.png",
    chatNotice: "Praise break!",
    ledgerLabel: "Praise Break",
    accessibilityLabel: "Praise break, woman dancing",
  },
  praise_break_man: {
    assetId: "praise_break_man",
    label: "Praise Break",
    emoji: "👨🏿‍💼",
    imageSrc: "/images/emojis/praise-break-man.png",
    chatNotice: "Praise break!",
    ledgerLabel: "Praise Break",
    accessibilityLabel: "Praise break, man in suit dancing",
  },
  hallelujah: {
    assetId: "hallelujah",
    label: "Hallelujah",
    emoji: "🙌🏿",
    imageSrc: null,
    chatNotice: "🙌🏿 Hallelujah!",
    ledgerLabel: "Hallelujah",
  },
  awakening_glow: {
    assetId: "awakening_glow",
    label: "Awakening Glow",
    emoji: "✨",
    imageSrc: "/images/emojis/awakening-glow.png",
    chatNotice: "✨ Awakening Glow",
    ledgerLabel: "Awakening Glow",
  },
};

/** Primary tray shown to attendees (Heart, Fire, Praise Break ×2, Hallelujah). */
export const LIVE_REACTION_TRAY: LiveReactionDefinition[] = [
  REACTION_DEFINITIONS.heart_reaction,
  REACTION_DEFINITIONS.seed_fire,
  REACTION_DEFINITIONS.praise_break,
  REACTION_DEFINITIONS.praise_break_man,
  REACTION_DEFINITIONS.hallelujah,
];

const ASSET_ID_SET = new Set<string>(LIVE_REACTION_ASSET_IDS);

export function isLiveReactionAssetId(value: unknown): value is LiveReactionAssetId {
  return typeof value === "string" && ASSET_ID_SET.has(value);
}

/** Safely coerce broadcast payloads — never throws; defaults to fire. */
export function resolveLiveReactionAssetId(value: unknown): LiveReactionAssetId {
  if (isLiveReactionAssetId(value)) return value;
  return "seed_fire";
}

export function getLiveReactionDefinition(assetId: string): LiveReactionDefinition {
  const resolved = resolveLiveReactionAssetId(assetId);
  return REACTION_DEFINITIONS[resolved];
}

export function parseEmojiBurstPayload(payload: unknown): {
  assetId: LiveReactionAssetId;
  userId: string | null;
} {
  if (typeof payload !== "object" || payload === null) {
    return { assetId: "seed_fire", userId: null };
  }

  const record = payload as {
    assetId?: unknown;
    emojiId?: unknown;
    userId?: unknown;
  };

  const rawAsset =
    typeof record.assetId === "string"
      ? record.assetId
      : typeof record.emojiId === "string"
        ? record.emojiId
        : null;

  return {
    assetId: resolveLiveReactionAssetId(rawAsset),
    userId: typeof record.userId === "string" ? record.userId : null,
  };
}
