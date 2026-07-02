import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";

/** Always added on top of realtime presence count shown to attendees. */
export const LIVE_VIEWER_SIMULATION_BUFFER = 400;

/** Max simulated chat lines kept in the overlay feed. */
export const LIVE_CHAT_SIMULATION_MAX_VISIBLE = 10;

export type SimulatedChatMessage = FellowshipChatMessage & {
  isSimulated: true;
};

type SimulationTemplate = {
  author: string;
  body: string;
};

/** Short, gospel-appropriate ambient comments — kept minimal and respectful. */
const GOSPEL_CHAT_TEMPLATES: SimulationTemplate[] = [
  { author: "Sarah M.", body: "Beautiful worship tonight" },
  { author: "Marcus T.", body: "Amen" },
  { author: "Keisha R.", body: "Glory to God" },
  { author: "Daniel W.", body: "This is blessing my heart" },
  { author: "Lisa K.", body: "Praying with everyone" },
  { author: "Chris P.", body: "Thank you Lord" },
  { author: "Nina J.", body: "He is worthy" },
  { author: "Jordan A.", body: "Amen" },
  { author: "Elena R.", body: "Hallelujah" },
  { author: "Tyler S.", body: "God is good" },
  { author: "Monica H.", body: "What a moment" },
  { author: "David L.", body: "Bless this worship" },
  { author: "Grace W.", body: "Amen" },
  { author: "James C.", body: "Praise Him" },
  { author: "Ruth B.", body: "So grateful to be here" },
];

let simulationCounter = 0;

function nextSimulationId(): string {
  simulationCounter += 1;
  return `live-sim-${Date.now()}-${simulationCounter}`;
}

function pickRandomTemplate(): SimulationTemplate {
  return GOSPEL_CHAT_TEMPLATES[Math.floor(Math.random() * GOSPEL_CHAT_TEMPLATES.length)]!;
}

export function createSimulatedChatMessage(
  template: SimulationTemplate = pickRandomTemplate(),
): SimulatedChatMessage {
  const slug = template.author.toLowerCase().replace(/[^a-z]+/g, "-");
  return {
    id: nextSimulationId(),
    userId: `sim-${slug}`,
    author: template.author,
    body: template.body,
    createdAt: new Date().toISOString(),
    isPinned: false,
    isSimulated: true,
  };
}

/** Sporadic interval — slow enough to feel natural, not spammy. */
export function nextLiveChatSimulationDelayMs(): number {
  return 14_000 + Math.floor(Math.random() * 28_000);
}

export function createInitialSimulatedChatBatch(count = 2): SimulatedChatMessage[] {
  const used = new Set<string>();
  const batch: SimulatedChatMessage[] = [];

  while (batch.length < count) {
    const template = pickRandomTemplate();
    const key = `${template.author}:${template.body}`;
    if (used.has(key)) continue;
    used.add(key);
    batch.push(
      createSimulatedChatMessage({
        ...template,
      }),
    );
  }

  return batch.map((message, index) => ({
    ...message,
    createdAt: new Date(Date.now() - (count - index) * 22_000).toISOString(),
  }));
}

export function trimSimulatedChatMessages(
  messages: SimulatedChatMessage[],
): SimulatedChatMessage[] {
  return messages.slice(-LIVE_CHAT_SIMULATION_MAX_VISIBLE);
}
