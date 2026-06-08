export type TimelineEventCategory =
  | "readiness"
  | "vmix"
  | "restream"
  | "operator"
  | "go_live"
  | "blocked"
  | "confirmation"
  | "danger";

export type TimelineEvent = {
  id: string;
  at: string;
  category: TimelineEventCategory;
  title: string;
  detail: string;
};

export function createTimelineEvent(
  category: TimelineEventCategory,
  title: string,
  detail: string,
): TimelineEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    category,
    title,
    detail,
  };
}

export function prependTimelineEvent(
  events: TimelineEvent[],
  event: TimelineEvent,
  max = 120,
): TimelineEvent[] {
  return [event, ...events].slice(0, max);
}

export function timelineCategoryTone(category: TimelineEventCategory): string {
  switch (category) {
    case "go_live":
      return "text-[#93c5fd]";
    case "blocked":
      return "text-[#f5c2e0]";
    case "danger":
      return "text-[#f5c2e0]";
    case "confirmation":
      return "text-zinc-300";
    case "vmix":
      return "text-[#93c5fd]";
    case "restream":
      return "text-[#f5c2e0]";
    default:
      return "text-zinc-400";
  }
}
