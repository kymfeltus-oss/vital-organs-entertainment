export type ChatMessageRow = {
  id: string;
  user_id: string;
  email: string;
  content: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type HarvestProgressRow = {
  id: number;
  total_cents: number;
  updated_at: string;
};

export const LIVE_ROOM_CHAT_CHANNEL = "live-room-platform";
export const LIVE_ROOM_PLATFORM_CHANNEL = LIVE_ROOM_CHAT_CHANNEL;
export const LIVE_STREAM_STATE_BROADCAST_EVENT = "stream-state-sync";
export const STREAM_GRAPHICS_SYNC_EVENT = "stream-graphics-sync";
export const LIV_MICRO_BET_LAUNCH_EVENT = "liv-micro-bet-launch";
export const AI_PROP_SUGGESTED_EVENT = "ai-prop-suggested";
export const PRODUCTION_RISK_WARNING_EVENT = "production-risk-warning";
export const HARVEST_METRICS_CHANNEL = LIVE_ROOM_PLATFORM_CHANNEL;
export const STREAM_STATE_SYNC_CHANNEL = LIVE_ROOM_PLATFORM_CHANNEL;
export const LIVE_STREAM_STATE_ID = "current_event";
/** Default LIV Golf enterprise fan viewer room scope for micro-bet realtime events. */
export const LIV_GOLF_TOUR_MAIN_ROOM = "liv-golf-tour-main-room";

export type LiveMicroBetPayload = {
  bet_id: string;
  question: string;
  stake_amount: number;
  payout_amount: number;
  is_active: boolean;
  options: readonly ["Yes", "No"] | readonly ["No", "Yes"];
};
export const HARVEST_GOAL_DOLLARS = 30_000;

export type LiveStreamStateRow = {
  id: string;
  is_live: boolean;
  playback_url: string;
  active_source: "offline" | "primary" | "backup";
  primary_playback_url: string | null;
  backup_playback_url: string | null;
  primary_rtmp_ingest_url: string | null;
  backup_rtmp_ingest_url: string | null;
  updated_at: string;
  updated_by: string | null;
};
