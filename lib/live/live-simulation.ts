import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";

/** Always added on top of realtime presence count shown to attendees. */
export const LIVE_VIEWER_SIMULATION_BUFFER = 400;

/** Max simulated chat lines kept in the overlay feed. */
export const LIVE_CHAT_SIMULATION_MAX_VISIBLE = 10;

/** Target ~40 ambient comments spread across a ~3 hour service window. */
export const LIVE_CHAT_SIMULATION_TARGET_DURATION_MS = 3 * 60 * 60 * 1000;

export type SimulatedChatMessage = FellowshipChatMessage & {
  isSimulated: true;
};

export type SimulationTemplate = {
  author: string;
  body: string;
};

/** 40 distinct First Last names for the ambient live chat feed. */
export const LIVE_CHAT_SIMULATED_AUTHORS = [
  "Sarah Miller",
  "Marcus Thomas",
  "Keisha Robinson",
  "Daniel Williams",
  "Lisa King",
  "Chris Parker",
  "Nina Johnson",
  "Jordan Adams",
  "Monica Harris",
  "David Lewis",
  "Grace Wilson",
  "James Carter",
  "Ruth Brooks",
  "Anthony Washington",
  "Tanya Mitchell",
  "DeAndre Foster",
  "Latoya Bennett",
  "Michael Jenkins",
  "Brianna Powell",
  "Terrence Hall",
  "Shawna Cooper",
  "Raymond Gray",
  "Candice Murphy",
  "Darius Coleman",
  "Jasmine Turner",
  "Andre Phillips",
  "Felicia Sanders",
  "Jerome Bailey",
  "Alicia Howard",
  "Kendrick Ross",
  "Denise Campbell",
  "Malik Stewart",
  "Patricia Walker",
  "Brandon Young",
  "Nicole Edwards",
  "Wesley Morris",
  "Angela Price",
  "Curtis Hayes",
  "Tamika Russell",
  "Gregory Shaw",
] as const;

/**
 * Short, universal service-room comments — natural Black church tone,
 * nothing dramatic, fits worship, word, music, or transitions.
 */
export const LIVE_CHAT_SIMULATED_BODIES = [
  "Amen",
  "Yes Lord",
  "Hallelujah",
  "Thank you Jesus",
  "Yes!",
  "Glory",
  "Glory to God",
  "Preach",
  "That's right",
  "Come on",
  "Thank you Lord",
  "Bless you",
  "We receive it",
  "So good",
  "Real good",
  "Lord have mercy",
  "That's it",
  "Say that",
  "Truth",
  "Alright now",
  "Here we go",
  "Let's go",
  "Beautiful",
  "Powerful",
  "Needed that",
  "God is good",
  "Touching my spirit",
  "Watching from home",
  "Amen amen",
  "Yes indeed",
  "Thank you",
  "So blessed",
  "Good word",
  "Receive it",
  "Yes sir",
  "My Lord",
  "Help us Lord",
  "We are blessed",
  "All the time",
  "And all the time God is good",
  "Sing",
  "Worship",
  "Take your time",
  "Okay okay",
  "Period",
  "Facts",
  "I'm tuned in",
  "Family watching too",
  "Grandma watching with us",
  "This is good",
  "Stirring me up",
  "I needed that",
  "Thank you Pastor",
  "Yes ma'am",
  "Come on now",
  "Keep going",
  "That's the word",
  "Speak Lord",
  "Have your way",
  "We hear you",
  "Understood",
  "Amen to that",
  "Yes yes",
  "Glory glory",
  "Thankful",
  "Blessed",
  "Still here",
  "Still watching",
  "Love it",
  "So peaceful",
  "What a service",
  "Good morning church",
  "Good evening church",
  "Happy to be here",
  "Logging in from work",
  "On the way home watching",
  "Praise break",
  "Hands up",
  "Clapping over here",
  "Standing with you",
  "Praying with you",
  "Lifting you up",
  "Encouraged",
  "Refreshed",
  "Filled up",
  "Ready",
  "Here for it",
  "Tuned in and locked in",
  "This word is hitting",
  "That part right there",
  "Say it again",
  "One more time",
  "Yes Lord yes",
  "Thank you thank you",
  "All glory",
  "To God be the glory",
  "He is worthy",
  "Worthy worthy",
  "Marvelous",
  "Wonderful",
  "So wonderful",
  "What a blessing",
  "Grateful heart",
  "Heart full",
  "Spirit is full",
  "Amen and amen",
] as const;

const RECENT_BODY_WINDOW = 3;
const AUTHOR_POOL_SIZE = LIVE_CHAT_SIMULATED_AUTHORS.length;
const BODY_POOL_SIZE = LIVE_CHAT_SIMULATED_BODIES.length;

let simulationCounter = 0;

function nextSimulationId(): string {
  simulationCounter += 1;
  return `live-sim-${Date.now()}-${simulationCounter}`;
}

function authorSlug(author: string): string {
  return author.toLowerCase().replace(/[^a-z]+/g, "-");
}

export function createSimulatedChatMessage(template: SimulationTemplate): SimulatedChatMessage {
  const slug = authorSlug(template.author);
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

/** ~4.5 min average — paced for a ~3 hour service with 40+ voices in rotation. */
export function nextLiveChatSimulationDelayMs(): number {
  const minMs = 3 * 60 * 1000;
  const maxMs = 6 * 60 * 1000;
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
  return items;
}

function bodyRecentlyUsed(recentBodies: readonly string[], body: string): boolean {
  return recentBodies.slice(-RECENT_BODY_WINDOW).includes(body);
}

function pickBodyForAuthor(
  author: string,
  usedByAuthor: Map<string, Set<string>>,
  recentBodies: readonly string[],
): string | null {
  const used = usedByAuthor.get(author) ?? new Set<string>();
  const candidates = LIVE_CHAT_SIMULATED_BODIES.filter(
    (body) => !used.has(body) && !bodyRecentlyUsed(recentBodies, body),
  );

  if (candidates.length === 0) {
    const relaxed = LIVE_CHAT_SIMULATED_BODIES.filter(
      (body) => !bodyRecentlyUsed(recentBodies, body),
    );
    if (relaxed.length === 0) return null;
    return relaxed[Math.floor(Math.random() * relaxed.length)]!;
  }

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export class LiveChatSimulationScheduler {
  private authorQueue: string[];
  private usedByAuthor = new Map<string, Set<string>>();
  private recentBodies: string[] = [];
  private recentAuthors: string[] = [];

  constructor() {
    this.authorQueue = shuffleInPlace([...LIVE_CHAT_SIMULATED_AUTHORS]);
  }

  private remember(template: SimulationTemplate): void {
    const used = this.usedByAuthor.get(template.author) ?? new Set<string>();
    used.add(template.body);
    this.usedByAuthor.set(template.author, used);

    this.recentBodies = [...this.recentBodies, template.body].slice(-RECENT_BODY_WINDOW);
    this.recentAuthors = [...this.recentAuthors, template.author].slice(-4);
  }

  private refillAuthorQueue(): void {
    const leastRecent = [...LIVE_CHAT_SIMULATED_AUTHORS].sort((left, right) => {
      const leftIndex = this.recentAuthors.lastIndexOf(left);
      const rightIndex = this.recentAuthors.lastIndexOf(right);
      return leftIndex - rightIndex;
    });
    this.authorQueue = shuffleInPlace(leastRecent);
  }

  nextTemplate(): SimulationTemplate {
    for (let attempt = 0; attempt < 240; attempt += 1) {
      if (this.authorQueue.length === 0) {
        this.refillAuthorQueue();
      }

      const author = this.authorQueue.shift();
      if (!author) continue;

      const body = pickBodyForAuthor(author, this.usedByAuthor, this.recentBodies);
      if (!body) continue;

      const template = { author, body };
      this.remember(template);
      return template;
    }

    const fallbackAuthor =
      LIVE_CHAT_SIMULATED_AUTHORS[
        Math.floor(Math.random() * LIVE_CHAT_SIMULATED_AUTHORS.length)
      ]!;
    const fallbackBody =
      LIVE_CHAT_SIMULATED_BODIES[Math.floor(Math.random() * LIVE_CHAT_SIMULATED_BODIES.length)]!;
    const template = { author: fallbackAuthor, body: fallbackBody };
    this.remember(template);
    return template;
  }

  nextMessage(): SimulatedChatMessage {
    return createSimulatedChatMessage(this.nextTemplate());
  }

  createInitialBatch(count = 2): SimulatedChatMessage[] {
    const batch: SimulatedChatMessage[] = [];
    for (let index = 0; index < count; index += 1) {
      batch.push(this.nextMessage());
    }

    return batch.map((message, index) => ({
      ...message,
      createdAt: new Date(Date.now() - (count - index) * nextLiveChatSimulationDelayMs()).toISOString(),
    }));
  }
}

export function createInitialSimulatedChatBatch(count = 2): SimulatedChatMessage[] {
  return new LiveChatSimulationScheduler().createInitialBatch(count);
}

export function trimSimulatedChatMessages(
  messages: SimulatedChatMessage[],
): SimulatedChatMessage[] {
  return messages.slice(-LIVE_CHAT_SIMULATION_MAX_VISIBLE);
}

export const LIVE_CHAT_SIMULATION_STATS = {
  authorCount: AUTHOR_POOL_SIZE,
  bodyCount: BODY_POOL_SIZE,
  minDelayMinutes: 3,
  maxDelayMinutes: 6,
};
