import {
  scanMessageForTrouble,
  type ChatTroubleCategory,
} from "@/lib/ops/chat-scanner";

export const TROUBLE_ALERT_WINDOW_MS = 60_000;
export const TROUBLE_ALERT_COOLDOWN_MS = 60_000;
export const TROUBLE_ALERT_THRESHOLD = 2;

export type TroubleComplaint = {
  id: string;
  category: ChatTroubleCategory;
  createdAtMs: number;
};

export type TroubleAlertEvaluation = {
  issueType: ChatTroubleCategory | null;
  count: number;
  audioCount: number;
  videoCount: number;
};

export function parseTroubleCreatedAtMs(
  createdAt: string | undefined,
  fallbackMs: number = Date.now(),
): number {
  if (!createdAt) return fallbackMs;
  const parsed = new Date(createdAt).getTime();
  return Number.isNaN(parsed) ? fallbackMs : parsed;
}

/** Register a chat row; returns the matched category when newly recorded. */
export function registerTroubleComplaint(
  complaints: TroubleComplaint[],
  seenIds: Set<string>,
  messageId: string,
  body: string,
  createdAtMs: number,
): { complaints: TroubleComplaint[]; category: ChatTroubleCategory | null } {
  if (!messageId || seenIds.has(messageId)) {
    return { complaints, category: null };
  }

  seenIds.add(messageId);
  const category = scanMessageForTrouble(body);
  if (!category) {
    return { complaints, category: null };
  }

  return {
    complaints: [...complaints, { id: messageId, category, createdAtMs }],
    category,
  };
}

/** Rolling 60s window — alert only when threshold met and cooldown expired. */
export function evaluateTroubleAlert(
  complaints: TroubleComplaint[],
  nowMs: number,
  cooldownUntilMs: number,
): TroubleAlertEvaluation {
  const empty: TroubleAlertEvaluation = {
    issueType: null,
    count: 0,
    audioCount: 0,
    videoCount: 0,
  };

  if (nowMs < cooldownUntilMs) {
    return empty;
  }

  const windowStartMs = nowMs - TROUBLE_ALERT_WINDOW_MS;
  const recent = complaints.filter((complaint) => complaint.createdAtMs >= windowStartMs);

  const audioCount = recent.filter((complaint) => complaint.category === "audio").length;
  const videoCount = recent.filter((complaint) => complaint.category === "video").length;

  if (audioCount >= TROUBLE_ALERT_THRESHOLD) {
    return { issueType: "audio", count: audioCount, audioCount, videoCount };
  }

  if (videoCount >= TROUBLE_ALERT_THRESHOLD) {
    return { issueType: "video", count: videoCount, audioCount, videoCount };
  }

  return empty;
}

export function pruneTroubleComplaints(
  complaints: TroubleComplaint[],
  nowMs: number,
): TroubleComplaint[] {
  const windowStartMs = nowMs - TROUBLE_ALERT_WINDOW_MS * 2;
  return complaints.filter((complaint) => complaint.createdAtMs >= windowStartMs);
}

export function nextTroubleAlertCooldownUntil(nowMs: number = Date.now()): number {
  return nowMs + TROUBLE_ALERT_COOLDOWN_MS;
}
