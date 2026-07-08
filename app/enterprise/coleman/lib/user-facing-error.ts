const TECHNICAL_PATTERNS = [
  /DATABASE_URL/i,
  /PrismaClient/i,
  /prisma/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /invalid `.*`/i,
  /Environment variable not found/i,
];

export function formatColemanUserError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "Something went wrong. Please try again.";
  }

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return "Service setlist is temporarily unavailable. Check database configuration.";
  }

  if (trimmed.length > 160) {
    return "Something went wrong. Please try again.";
  }

  return trimmed;
}
