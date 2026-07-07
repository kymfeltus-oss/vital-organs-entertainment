import type { TenantTheme } from "@/lib/theme/types";

export type EnterpriseWorkspaceProfile = {
  workspaceId: string;
  label: string;
  theme: TenantTheme;
};

/**
 * Hardcoded enterprise workspace profiles.
 * When a profile exists for the active workspace, dynamic dashboard theme
 * patches are skipped and this raw theme payload wins.
 */
export const ENTERPRISE_WORKSPACE_PROFILES: readonly EnterpriseWorkspaceProfile[] = [];

export function getActiveWorkspaceId(): string {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_WORKSPACE_ID?.trim() || "default";
  }
  return "default";
}

export function getEnterpriseThemeOverride(
  workspaceId: string = getActiveWorkspaceId(),
): TenantTheme | null {
  const profile = ENTERPRISE_WORKSPACE_PROFILES.find(
    (entry) => entry.workspaceId === workspaceId,
  );
  return profile?.theme ?? null;
}

export function isEnterpriseThemeLocked(
  workspaceId: string = getActiveWorkspaceId(),
): boolean {
  return getEnterpriseThemeOverride(workspaceId) !== null;
}
