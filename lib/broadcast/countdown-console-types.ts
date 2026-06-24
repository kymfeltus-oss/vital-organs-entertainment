/** Shared types for the countdown hero production command console. */

export type OpsStreamTelemetryView = {
  isLive: boolean;
  ingestStatus?: "connected" | "disconnected" | "error";
  resolutionLabel?: string;
  resolution?: string;
  droppedFramesPercent?: number;
  latencySeconds?: number;
  bitrateMbps?: number;
  fatalError?: string | null;
};

export type HeroCopyFormState = {
  eyebrow: string;
  headline: string;
  subtitle: string;
  statusLabel: string;
  showDate: string;
  showTime: string;
  timezone: string;
};

export type RealtimeAttendeeChatRow = {
  id: string;
  username: string | null;
  message: string | null;
  created_at: string;
};

export type TroubleAlertType = "audio" | "video";

export type TroubleAlert = {
  type: TroubleAlertType;
  count: number;
  message: string;
  fix: string;
};

export type UserRole = "admin" | "producer" | "broadcast_operator" | "viewer";

export type RoleGateResult = {
  role: UserRole;
  canEdit: boolean;
  canSave: boolean;
  canGoLive: boolean;
  canClearAlerts: boolean;
  isReadOnly: boolean;
};

export const HERO_FIELD_LIMITS = {
  eyebrow: 80,
  headline: 120,
  subtitle: 120,
  statusLabel: 40,
} as const;

export type HeroCopyFieldKey = keyof typeof HERO_FIELD_LIMITS;

export const DEFAULT_HERO_COPY_FORM: HeroCopyFormState = {
  eyebrow: "300 Awakening",
  headline: "LIVE. EMPOWER. TRANSFORM.",
  subtitle: "A Global Movement of Worship & Revival",
  statusLabel: "Rehearsal Mode",
  showDate: "",
  showTime: "",
  timezone: "America/New_York",
};

export const TROUBLE_ALERT_COPY: Record<
  TroubleAlertType,
  Pick<TroubleAlert, "message" | "fix">
> = {
  audio: {
    message:
      "Multiple viewers are reporting they CANNOT HEAR the broadcast right now!",
    fix: "Check your audio levels on the mixing board or vMix audio uploads.",
  },
  video: {
    message:
      "Multiple viewers are reporting they CANNOT SEE the broadcast right now!",
    fix: "Check the camera output, vMix program feed, and encoder video signal.",
  },
};
