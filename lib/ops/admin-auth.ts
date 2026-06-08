import type { User } from "@supabase/supabase-js";

function parseAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export type OpsAdminAccessInspection = {
  allowed: boolean;
  normalizedEmail: string | null;
  allowlistCount: number;
  allowlistMatch: boolean;
  metadataOpsAdmin: boolean;
};

export function inspectOpsAdminAccess(
  user: User | null | undefined,
): OpsAdminAccessInspection {
  const allowlist = parseAdminEmailAllowlist();
  const metadataOpsAdmin = user?.user_metadata?.is_ops_admin === true;
  const normalizedEmail = user?.email?.trim().toLowerCase() ?? null;
  const allowlistMatch = normalizedEmail
    ? allowlist.includes(normalizedEmail)
    : false;

  const allowed =
    Boolean(user) &&
    (metadataOpsAdmin || (Boolean(normalizedEmail) && allowlistMatch));

  return {
    allowed,
    normalizedEmail,
    allowlistCount: allowlist.length,
    allowlistMatch,
    metadataOpsAdmin,
  };
}

export function isOpsAdminUser(user: User | null | undefined): boolean {
  return inspectOpsAdminAccess(user).allowed;
}

export function resolveOpsAdminEmail(user: User | null | undefined): string | null {
  if (!isOpsAdminUser(user)) return null;
  return user?.email?.trim().toLowerCase() ?? null;
}
