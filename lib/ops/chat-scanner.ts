export type ChatTroubleCategory = "audio" | "video";

const TROUBLE_KEYWORDS: Record<ChatTroubleCategory, readonly string[]> = {
  audio: [
    "cant hear",
    "can't hear",
    "no sound",
    "muted",
    "no audio",
    "cannot hear",
    "cant hear anything",
    "can't hear anything",
    "audio not working",
  ],
  video: [
    "cant see",
    "can't see",
    "black screen",
    "frozen",
    "blurry",
    "cannot see",
    "no video",
    "blank screen",
    "video not working",
  ],
};

/** Normalize attendee chat for loose keyword matching (case + apostrophe variants). */
export function normalizeChatTroubleText(text: string): string {
  return text.toLowerCase().replace(/['’]/g, "");
}

/**
 * Scan fellowship / live-room chat for common technical complaint phrases.
 * Returns `audio`, `video`, or null when no trouble pattern matches.
 */
export function scanMessageForTrouble(text: string): ChatTroubleCategory | null {
  const cleanText = normalizeChatTroubleText(text);

  if (TROUBLE_KEYWORDS.audio.some((keyword) => cleanText.includes(keyword))) {
    return "audio";
  }

  if (TROUBLE_KEYWORDS.video.some((keyword) => cleanText.includes(keyword))) {
    return "video";
  }

  return null;
}
