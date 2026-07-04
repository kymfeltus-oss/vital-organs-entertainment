import type { FellowshipChatMessage } from "@/lib/experience/fellowship-chat";

/** Always added on top of realtime presence count shown to attendees. */
export const LIVE_VIEWER_SIMULATION_BUFFER = 400;

/** Four hours at ten comments per hour; also bounds simulated scrollback. */
export const LIVE_CHAT_SIMULATION_MAX_VISIBLE = 40;

/** How many recent authors must pass before the same name can appear again. */
export const LIVE_CHAT_SIMULATION_AUTHOR_COOLDOWN = 12;

/** Target 40 ambient comments spread across a four-hour event. */
export const LIVE_CHAT_SIMULATION_COMMENTS_PER_HOUR = 10;
export const LIVE_CHAT_SIMULATION_TARGET_DURATION_MS = 4 * 60 * 60 * 1000;

export type SimulatedChatMessage = FellowshipChatMessage & {
  isSimulated: true;
};

export type SimulationTemplate = {
  author: string;
  body: string;
};

/** 90+ distinct First Last names for the ambient live chat feed. */
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
  "Elena Rivera",
  "Tyler Simmons",
  "Vanessa Ortiz",
  "Corey Jackson",
  "Imani Wright",
  "Donovan Reed",
  "Aaliyah Freeman",
  "Reginald Scott",
  "Octavia Dunn",
  "Hector Alvarez",
  "Simone Banks",
  "Lamar Pierce",
  "Destiny Hughes",
  "Trevor Coleman",
  "Renee Flores",
  "Jamal Owens",
  "Kiara Mitchell",
  "Clarence Boyd",
  "Yolanda Graves",
  "Derrick Watts",
  "Monique Ellis",
  "Ralph Henderson",
  "Shanice Porter",
  "Warren Gill",
  "Latrice Spencer",
  "Otis Wheeler",
  "Cherelle Dixon",
  "Marlon Tate",
  "Arielle Nash",
  "Vernon Curry",
  "Tiffany Boone",
  "Lionel Marsh",
  "Keon Barber",
  "Savannah Holt",
  "Rodney Vaughn",
  "Anika Fields",
  "Cedric Payne",
  "Janelle Rhodes",
  "Maurice Ingram",
  "Brittney Logan",
  "Harold Quinn",
  "Lena Copeland",
  "Dwayne Avery",
  "Rochelle Mays",
  "Alvin Briggs",
  "Tanisha Glenn",
  "Percy Dalton",
  "Marisa Holloway",
  "Gerald Underwood",
  "Nadia Whitfield",
  "Clayton Bowman",
  "Serena McKnight",
  "Franklin Joyce",
  "Aisha Dunlap",
  "Ruben Castillo",
  "Dominique Avery",
  "Willie Hammond",
  "Gabrielle Sutton",
  "Ernest Phelps",
  "Valerie Cross",
  "Norman Briggs",
  "Carmen Delgado",
  "Philip Gaines",
  "Trina Holloway",
  "Leonard Frost",
  "Melissa Crane",
  "Roderick Hale",
  "Janice Booker",
  "Samuel Whitaker",
  "Paula Navarro",
  "Victor Lang",
  "Danielle Kemp",
  "Harvey Sloan",
  "Renita Osborne",
  "Gordon Pierce",
  "Stacey Dalton",
  "Clifford Nash",
  "Belinda Frye",
  "Marshall Boone",
  "Loretta Vaughn",
  "Darnell Joyce",
  "Gwendolyn Tate",
  "Alton Spencer",
  "Marcella Ingram",
] as const;

/** Host / operator names — never used for ambient simulation. */
export const LIVE_CHAT_SIMULATION_BLOCKED_NAMES = [
  "Ian Craig",
  "Kym Feltus",
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

function normalizeAuthorKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildSimulationAuthorPool(excludedNames: readonly string[] = []): string[] {
  const blocked = new Set<string>([
    ...LIVE_CHAT_SIMULATION_BLOCKED_NAMES.map(normalizeAuthorKey),
    ...excludedNames.map(normalizeAuthorKey).filter(Boolean),
  ]);

  return LIVE_CHAT_SIMULATED_AUTHORS.filter(
    (author) => !blocked.has(normalizeAuthorKey(author)),
  );
}

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

/** Ten comments per hour with natural jitter around the six-minute interval. */
export function nextLiveChatSimulationDelayMs(): number {
  const averageMs = (60 * 60 * 1000) / LIVE_CHAT_SIMULATION_COMMENTS_PER_HOUR;
  const jitterMs = 60 * 1000;
  const minMs = averageMs - jitterMs;
  const maxMs = averageMs + jitterMs;
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
  private authorPool: string[];
  private authorQueue: string[];
  private usedByAuthor = new Map<string, Set<string>>();
  private recentBodies: string[] = [];
  private recentAuthors: string[] = [];

  constructor(excludedNames: readonly string[] = []) {
    this.authorPool = buildSimulationAuthorPool(excludedNames);
    if (this.authorPool.length === 0) {
      this.authorPool = [...LIVE_CHAT_SIMULATED_AUTHORS];
    }
    this.authorQueue = shuffleInPlace([...this.authorPool]);
  }

  private remember(template: SimulationTemplate): void {
    const used = this.usedByAuthor.get(template.author) ?? new Set<string>();
    used.add(template.body);
    this.usedByAuthor.set(template.author, used);

    this.recentBodies = [...this.recentBodies, template.body].slice(-RECENT_BODY_WINDOW);
    this.recentAuthors = [...this.recentAuthors, template.author].slice(
      -LIVE_CHAT_SIMULATION_AUTHOR_COOLDOWN,
    );
  }

  private refillAuthorQueue(): void {
    const leastRecent = [...this.authorPool].sort((left, right) => {
      const leftIndex = this.recentAuthors.lastIndexOf(left);
      const rightIndex = this.recentAuthors.lastIndexOf(right);
      return leftIndex - rightIndex;
    });
    this.authorQueue = shuffleInPlace(leastRecent);
  }

  nextTemplate(): SimulationTemplate {
    for (let attempt = 0; attempt < 360; attempt += 1) {
      if (this.authorQueue.length === 0) {
        this.refillAuthorQueue();
      }

      const author = this.authorQueue.shift();
      if (!author) continue;
      if (this.recentAuthors.includes(author)) continue;

      const body = pickBodyForAuthor(author, this.usedByAuthor, this.recentBodies);
      if (!body) continue;

      const template = { author, body };
      this.remember(template);
      return template;
    }

    const fallbackAuthor =
      this.authorPool[Math.floor(Math.random() * this.authorPool.length)]!;
    const fallbackBody =
      LIVE_CHAT_SIMULATED_BODIES[Math.floor(Math.random() * LIVE_CHAT_SIMULATED_BODIES.length)]!;
    const template = { author: fallbackAuthor, body: fallbackBody };
    this.remember(template);
    return template;
  }

  nextMessage(): SimulatedChatMessage {
    return createSimulatedChatMessage(this.nextTemplate());
  }

  createInitialBatch(count = 6): SimulatedChatMessage[] {
    const batch: SimulatedChatMessage[] = [];
    for (let index = 0; index < count; index += 1) {
      batch.push(this.nextMessage());
    }

    return batch.map((message, index) => ({
      ...message,
      createdAt: new Date(Date.now() - (count - index) * 45_000).toISOString(),
    }));
  }
}

export function createInitialSimulatedChatBatch(
  count = 6,
  excludedNames: readonly string[] = [],
): SimulatedChatMessage[] {
  return new LiveChatSimulationScheduler(excludedNames).createInitialBatch(count);
}

export function trimSimulatedChatMessages(
  messages: SimulatedChatMessage[],
): SimulatedChatMessage[] {
  return messages.slice(-LIVE_CHAT_SIMULATION_MAX_VISIBLE);
}

export const LIVE_CHAT_SIMULATION_STATS = {
  authorCount: LIVE_CHAT_SIMULATED_AUTHORS.length,
  bodyCount: LIVE_CHAT_SIMULATED_BODIES.length,
  eventDurationHours: 4,
  commentsPerHour: LIVE_CHAT_SIMULATION_COMMENTS_PER_HOUR,
  targetCommentCount: 40,
  minDelayMinutes: 5,
  maxDelayMinutes: 7,
  authorCooldown: LIVE_CHAT_SIMULATION_AUTHOR_COOLDOWN,
};
