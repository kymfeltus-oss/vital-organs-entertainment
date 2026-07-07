import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { applyThemeToElement } from "@/lib/theme/apply-theme-vars";
import {
  getEnterpriseThemeOverride,
  getActiveWorkspaceId,
} from "@/lib/theme/enterprise/workspace-overrides";
import { mergeTenantTheme, type TenantThemePatch } from "@/lib/theme/merge-theme";
import type { TenantTheme } from "@/lib/theme/types";

export type ThemeResolutionSource = "enterprise-override" | "dynamic" | "default";

export type ResolvedTenantTheme = {
  theme: TenantTheme;
  source: ThemeResolutionSource;
  isEnterpriseLocked: boolean;
  workspaceId: string;
};

type ResolveEffectiveThemeOptions = {
  workspaceId?: string;
  dynamicPatch?: TenantThemePatch | TenantTheme | null;
};

/**
 * Intercept layer: enterprise hardcoded profiles take precedence over
 * self-service dashboard configurations.
 */
export function resolveEffectiveTenantTheme(
  options: ResolveEffectiveThemeOptions = {},
): ResolvedTenantTheme {
  const workspaceId = options.workspaceId ?? getActiveWorkspaceId();
  const enterpriseTheme = getEnterpriseThemeOverride(workspaceId);

  if (enterpriseTheme) {
    return {
      theme: enterpriseTheme,
      source: "enterprise-override",
      isEnterpriseLocked: true,
      workspaceId,
    };
  }

  if (options.dynamicPatch) {
    return {
      theme: mergeTenantTheme(DEFAULT_TENANT_THEME, options.dynamicPatch),
      source: "dynamic",
      isEnterpriseLocked: false,
      workspaceId,
    };
  }

  return {
    theme: DEFAULT_TENANT_THEME,
    source: "default",
    isEnterpriseLocked: false,
    workspaceId,
  };
}

export function resolveAndApplyThemeToElement(
  element: HTMLElement,
  options: ResolveEffectiveThemeOptions = {},
): ResolvedTenantTheme {
  const resolved = resolveEffectiveTenantTheme(options);
  applyThemeToElement(element, resolved.theme);
  return resolved;
}
