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

type Subscriber = (messages: LiveChatMessage[]) => void;

const MAX_MESSAGES = 50;

const INITIAL_MESSAGES: LiveChatMessage[] = [
  {
    id: "seed-1",
    userName: "Sarah M.",
    initials: "SM",
    color: "pink",
    text: "This worship is incredible 🙏",
    createdAt: Date.now() - 18_000,
    type: "message",
    likeCount: 3,
  },
  {
    id: "seed-2",
    userName: "Marcus T.",
    initials: "MT",
    color: "cyan",
    text: "Glory to God!",
    createdAt: Date.now() - 15_000,
    type: "message",
    likeCount: 1,
  },
  {
    id: "seed-3",
    userName: "Keisha R.",
    initials: "KR",
    color: "purple",
    text: "✨ sowed a seed",
    createdAt: Date.now() - 12_000,
    type: "seed",
    seedAmount: 100,
  },
  {
    id: "seed-4",
    userName: "Daniel W.",
    initials: "DW",
    color: "blue",
    text: "The word is hitting different tonight",
    createdAt: Date.now() - 9_000,
    type: "message",
  },
  {
    id: "seed-5",
    userName: "Anonymous",
    initials: "AN",
    color: "green",
    text: "Praying with everyone right now",
    createdAt: Date.now() - 6_000,
    type: "prayer",
  },
  {
    id: "seed-6",
    userName: "Lisa K.",
    initials: "LK",
    color: "pink",
    text: "✨ sowed a seed",
    createdAt: Date.now() - 3_000,
    type: "seed",
    seedAmount: 300,
  },
  {
    id: "seed-7",
    userName: "Chris P.",
    initials: "CP",
    color: "cyan",
    text: "Thank you for this moment",
    createdAt: Date.now() - 1_000,
    type: "message",
    likeCount: 2,
  },
];

const MOCK_INCOMING: Array<Omit<LiveChatMessage, "id" | "createdAt">> = [
  {
    userName: "Jordan A.",
    initials: "JA",
    color: "blue",
    text: "Amen! 🔥",
    type: "message",
    likeCount: 1,
  },
  {
    userName: "Elena R.",
    initials: "ER",
    color: "purple",
    text: "✨ sowed a seed",
    type: "seed",
    seedAmount: 100,
  },
  {
    userName: "Tyler S.",
    initials: "TS",
    color: "green",
    text: "Praying for everyone tuning in",
    type: "prayer",
  },
];

class LiveChatStore {
  private messages: LiveChatMessage[] = [...INITIAL_MESSAGES];

  private subscribers = new Set<Subscriber>();

  private mockTimers = new Map<string, ReturnType<typeof setInterval>>();

  subscribe(streamId: string, listener: Subscriber): () => void {
    this.subscribers.add(listener);
    listener(this.messages);

    if (!this.mockTimers.has(streamId)) {
      const timer = setInterval(() => {
        const template = MOCK_INCOMING[Math.floor(Math.random() * MOCK_INCOMING.length)];
        this.addMessage({
          ...template,
          id: `${streamId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
        });
      }, 4_500);
      this.mockTimers.set(streamId, timer);
    }

    return () => {
      this.subscribers.delete(listener);
      const timer = this.mockTimers.get(streamId);
      if (timer && this.subscribers.size === 0) {
        clearInterval(timer);
        this.mockTimers.delete(streamId);
      }
    };
  }

  getMessages(): LiveChatMessage[] {
    return this.messages;
  }

  addMessage(message: LiveChatMessage): void {
    this.messages = [...this.messages, message].slice(-MAX_MESSAGES);
    this.notify();
  }

  sendUserMessage(input: {
    userName: string;
    initials: string;
    color: LiveChatMessageColor;
    text: string;
  }): LiveChatMessage {
    const message: LiveChatMessage = {
      id: `user-${Date.now()}`,
      userName: input.userName,
      initials: input.initials,
      color: input.color,
      text: input.text,
      createdAt: Date.now(),
      type: "message",
    };
    this.addMessage(message);
    return message;
  }

  sendSeedMessage(userName: string, initials: string, seedAmount: number): LiveChatMessage {
    const message: LiveChatMessage = {
      id: `seed-user-${Date.now()}`,
      userName,
      initials,
      color: "purple",
      text: "✨ sowed a seed",
      createdAt: Date.now(),
      type: "seed",
      seedAmount,
    };
    this.addMessage(message);
    return message;
  }

  sendPrayerMessage(userName: string, initials: string): LiveChatMessage {
    const message: LiveChatMessage = {
      id: `prayer-user-${Date.now()}`,
      userName,
      initials,
      color: "green",
      text: "You sent a prayer request 🙏",
      createdAt: Date.now(),
      type: "prayer",
    };
    this.addMessage(message);
    return message;
  }

  private notify(): void {
    for (const listener of this.subscribers) {
      listener(this.messages);
    }
  }
}

export const liveChatStore = new LiveChatStore();
