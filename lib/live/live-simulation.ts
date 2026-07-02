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

/** Short, casual live-room comments — natural tone, not overly polished. */
const GOSPEL_CHAT_TEMPLATES: SimulationTemplate[] = [
  { author: "Sarah M.", body: "Amen!" },
  { author: "Marcus T.", body: "Yes!" },
  { author: "Keisha R.", body: "This live stream app is dope." },
  { author: "Daniel W.", body: "Amen!" },
  { author: "Lisa K.", body: "Yes Lord" },
  { author: "Chris P.", body: "We up!" },
  { author: "Nina J.", body: "Hallelujah" },
  { author: "Jordan A.", body: "Yes!" },
  { author: "Elena R.", body: "Amen!" },
  { author: "Tyler S.", body: "This is fire" },
  { author: "Monica H.", body: "Glory!" },
  { author: "David L.", body: "Amen!" },
  { author: "Grace W.", body: "Yes!" },
  { author: "James C.", body: "Love this" },
  { author: "Ruth B.", body: "Amen!" },
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
