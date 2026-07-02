import type { ChatMessage, ChatMessageRow } from "@/lib/live/types";

function titleCaseWord(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function normalizeNamePart(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

/** Display label for live chat — prefers First Last from profile, then email parsing. */
export function formatChatDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const firstName = normalizeNamePart(input.firstName);
  const lastName = normalizeNamePart(input.lastName);

  if (firstName && lastName) {
    return `${titleCaseWord(firstName)} ${titleCaseWord(lastName)}`;
  }

  if (firstName) return titleCaseWord(firstName);
  if (lastName) return titleCaseWord(lastName);

  return formatChatAuthor(input.email ?? "");
}

export function formatChatAuthor(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return "Guest";

  const parts = localPart.replace(/[._+-]/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((part) => titleCaseWord(part)).join(" ");
  }

  return titleCaseWord(localPart);
}

export function mapChatRow(
  row: ChatMessageRow,
  authorOverride?: string,
): ChatMessage {
  return {
    id: row.id,
    author: authorOverride ?? formatChatAuthor(row.email),
    body: row.content,
    createdAt: row.created_at,
  };
}

export function sortChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function mergeChatMessage(
  current: ChatMessage[],
  incoming: ChatMessage,
): ChatMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }

  return sortChatMessages([...current, incoming]);
}

export type AttendeeNameRecord = {
  firstName: string;
  lastName: string;
};

export function buildAttendeeNameLookup(
  rows: Array<{ id: string; first_name?: string | null; last_name?: string | null }>,
): Map<string, AttendeeNameRecord> {
  const lookup = new Map<string, AttendeeNameRecord>();

  for (const row of rows) {
    const firstName = normalizeNamePart(row.first_name);
    const lastName = normalizeNamePart(row.last_name);
    if (!firstName && !lastName) continue;
    lookup.set(row.id, { firstName, lastName });
  }

  return lookup;
}

export function resolveChatAuthorFromLookup(
  row: ChatMessageRow,
  lookup: Map<string, AttendeeNameRecord>,
): string {
  const names = lookup.get(row.user_id);
  return formatChatDisplayName({
    firstName: names?.firstName,
    lastName: names?.lastName,
    email: row.email,
  });
}
