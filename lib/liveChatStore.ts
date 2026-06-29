"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { getClientAppUrl } from "@/lib/client-api";
import { LIVE_REACTION_TYPES, type LiveReactionType } from "@/lib/experience/live-reactions";
import {
  attachRealtimeChannelErrorGuard,
  subscribeChannelWithResilience,
} from "@/lib/live/realtime-subscribe";
import { getSupabase } from "@/lib/supabase/client";

export type LiveChatMessageColor = "pink" | "cyan" | "purple" | "green" | "blue";

export type LiveChatMessage = {
  id: string;
  userName: string;
  initials: string;
  color: LiveChatMessageColor;
  text: string;
  createdAt: number;
  type: "message" | "seed" | "prayer";
  likeCount?: number;
  seedAmount?: number;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  email: string;
  content: string;
  created_at: string;
  deleted_at?: string | null;
};

type Subscriber = (messages: LiveChatMessage[]) => void;
type ReactionInput = LiveReactionType | Uppercase<LiveReactionType>;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 500;
const CHAT_HISTORY_LIMIT = 50;
const CHAT_CHANNEL_NAME = "attendee-floating-live-chat";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeContent(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim() || "Guest";
  return localPart
    .replace(/^guest[_-]?/i, "Guest ")
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "GU";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function colorForText(seed: string): LiveChatMessageColor {
  const colors: LiveChatMessageColor[] = ["pink", "cyan", "purple", "green", "blue"];
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length] ?? "cyan";
}

function inferType(content: string): LiveChatMessage["type"] {
  const normalized = content.toLowerCase();
  if (normalized.includes("sowed a seed") || normalized.includes("seed gift")) return "seed";
  if (normalized.includes("prayer request") || normalized.includes("praying")) return "prayer";
  return "message";
}

function inferSeedAmount(content: string): number | undefined {
  const match = content.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!match?.[1]) return undefined;
  const amount = Number.parseFloat(match[1]);
  return Number.isFinite(amount) ? Math.round(amount) : undefined;
}

function mapRowToMessage(row: ChatMessageRow): LiveChatMessage {
  const userName = displayNameFromEmail(row.email);
  const text = sanitizeContent(row.content);
  const type = inferType(text);

  return {
    id: row.id,
    userName,
    initials: initialsFromName(userName),
    color: type === "seed" ? "purple" : type === "prayer" ? "green" : colorForText(row.email),
    text,
    createdAt: new Date(row.created_at).getTime(),
    type,
    seedAmount: type === "seed" ? inferSeedAmount(text) : undefined,
  };
}

function sortAndTrim(messages: LiveChatMessage[]): LiveChatMessage[] {
  const unique = new Map<string, LiveChatMessage>();
  for (const message of messages) {
    unique.set(message.id, message);
  }

  return [...unique.values()]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_MESSAGES);
}

function normalizeReactionType(type: ReactionInput): LiveReactionType | null {
  const normalized = type.toLowerCase() as LiveReactionType;
  if (LIVE_REACTION_TYPES.includes(normalized)) {
    return normalized;
  }
  return null;
}

class LiveChatStore {
  private messages: LiveChatMessage[] = [];

  private subscribers = new Set<Subscriber>();

  private channel: RealtimeChannel | null = null;

  private loadingPromise: Promise<void> | null = null;

  private activeStreamId: string | null = null;

  subscribe(streamId: string, listener: Subscriber): () => void {
    this.activeStreamId = streamId;
    this.subscribers.add(listener);
    listener(this.messages);
    void this.ensureConnected().catch(() => {
      this.notify();
    });

    return () => {
      this.subscribers.delete(listener);
      if (this.subscribers.size === 0) {
        void this.disconnect();
      }
    };
  }

  getMessages(): LiveChatMessage[] {
    return this.messages;
  }

  async sendUserMessage(input: {
    userName: string;
    initials: string;
    color: LiveChatMessageColor;
    text: string;
  }): Promise<LiveChatMessage | null> {
    return this.persistMessage(input.text);
  }

  async sendSeedMessage(
    userName: string,
    _initials: string,
    seedAmount: number,
  ): Promise<LiveChatMessage | null> {
    const safeAmount = Number.isFinite(seedAmount) ? Math.max(0, Math.round(seedAmount)) : 0;
    if (safeAmount <= 0) return null;
    return this.persistMessage(`${userName || "Guest"} sowed a seed gift of $${safeAmount}.`);
  }

  async sendPrayerMessage(userName: string): Promise<LiveChatMessage | null> {
    return this.persistMessage(`${userName || "Guest"} sent a prayer request.`);
  }

  async deleteChatMessagePermanently(messageId: string): Promise<boolean> {
    const cleanMessageId = messageId.trim();
    if (!UUID_PATTERN.test(cleanMessageId)) {
      throw new Error("Invalid chat message id.");
    }

    const previousMessages = this.messages;
    this.messages = previousMessages.filter((message) => message.id !== cleanMessageId);
    this.notify();

    try {
      const response = await fetch(`${getClientAppUrl()}/api/moderation/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageId: cleanMessageId }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error ?? "Unable to moderate chat message.");
      }

      return true;
    } catch (error) {
      this.messages = previousMessages;
      this.notify();
      throw error;
    }
  }

  async emitLiveStreamReaction(
    reactionType: ReactionInput,
    userId?: string,
    eventId = "300-awakening",
  ): Promise<boolean> {
    const normalized = normalizeReactionType(reactionType);
    if (!normalized) {
      throw new Error("Invalid live reaction type.");
    }

    if (userId !== undefined && userId.trim().length === 0) {
      throw new Error("Authenticated user id is required for telemetry.");
    }

    const response = await fetch(`${getClientAppUrl()}/api/experience/live-reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        reactionType: normalized,
        eventId,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      reaction?: unknown;
      error?: string;
    };

    if (!response.ok || !payload.reaction) {
      throw new Error(payload.error ?? "Unable to send reaction.");
    }

    return true;
  }

  private async ensureConnected(): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, user_id, email, content, created_at, deleted_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(CHAT_HISTORY_LIMIT);

      if (error) {
        this.loadingPromise = null;
        throw new Error(error.message);
      }

      this.messages = sortAndTrim((data ?? []).map((row) => mapRowToMessage(row as ChatMessageRow)));
      this.notify();

      if (this.channel) return;

      const channel = supabase
        .channel(CHAT_CHANNEL_NAME)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          (payload) => {
            const row = payload.new as ChatMessageRow | null;
            if (!row || row.deleted_at) return;
            this.addMessage(mapRowToMessage(row));
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chat_messages" },
          () => {
            void this.reloadHistory();
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "chat_messages" },
          () => {
            void this.reloadHistory();
          },
        );

      this.channel = attachRealtimeChannelErrorGuard(channel);
      subscribeChannelWithResilience(this.channel, CHAT_CHANNEL_NAME, {
        onStale: () => {
          if (this.channel !== channel) return;
          this.channel = null;

          if (this.subscribers.size > 0) {
            void this.ensureConnected().catch(() => {
              this.notify();
            });
          }
        },
      });
    })().finally(() => {
      this.loadingPromise = null;
    });

    return this.loadingPromise;
  }

  private async reloadHistory(): Promise<void> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, user_id, email, content, created_at, deleted_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(CHAT_HISTORY_LIMIT);

      if (error) throw new Error(error.message);

      this.messages = sortAndTrim((data ?? []).map((row) => mapRowToMessage(row as ChatMessageRow)));
      this.notify();
    } catch {
      this.notify();
    }
  }

  private async persistMessage(rawContent: string): Promise<LiveChatMessage | null> {
    const content = sanitizeContent(rawContent);
    if (!content || content.length > MAX_CONTENT_LENGTH) return null;

    try {
      await this.ensureConnected();

      const response = await fetch(`${getClientAppUrl()}/api/live/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          streamId: this.activeStreamId,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        message?: ChatMessageRow;
        error?: string;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? "Unable to send message.");
      }

      const message = mapRowToMessage(payload.message);
      this.addMessage(message);
      return message;
    } catch {
      return null;
    }
  }

  private addMessage(message: LiveChatMessage): void {
    this.messages = sortAndTrim([...this.messages, message]);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.subscribers) {
      listener(this.messages);
    }
  }

  private async disconnect(): Promise<void> {
    const channel = this.channel;
    this.channel = null;
    if (!channel) return;

    const supabase = getSupabase();
    await supabase.removeChannel(channel);
  }
}

export const liveChatStore = new LiveChatStore();

type LiveChatStoreState = {
  isModerating: boolean;
  isSendingReaction: boolean;
  error: string | null;
  deleteChatMessagePermanently: (messageId: string) => Promise<boolean>;
  emitLiveStreamReaction: (
    reactionType: ReactionInput,
    userId?: string,
    eventId?: string,
  ) => Promise<boolean>;
  clearError: () => void;
};

export const useLiveChatStore = create<LiveChatStoreState>((set) => ({
  isModerating: false,
  isSendingReaction: false,
  error: null,

  deleteChatMessagePermanently: async (messageId: string) => {
    set({ isModerating: true, error: null });
    try {
      const success = await liveChatStore.deleteChatMessagePermanently(messageId);
      set({ isModerating: false });
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to moderate chat message.";
      set({ isModerating: false, error: message });
      throw error;
    }
  },

  emitLiveStreamReaction: async (
    reactionType: ReactionInput,
    userId?: string,
    eventId?: string,
  ) => {
    set({ isSendingReaction: true, error: null });
    try {
      const success = await liveChatStore.emitLiveStreamReaction(reactionType, userId, eventId);
      set({ isSendingReaction: false });
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send reaction.";
      set({ isSendingReaction: false, error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
