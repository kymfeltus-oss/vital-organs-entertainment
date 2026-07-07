"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyThemeToElement } from "@/lib/theme/apply-theme-vars";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import { getEnterpriseThemeOverride } from "@/lib/theme/enterprise/workspace-overrides";
import {
  hasCustomThemeOverrides,
  mergeTenantTheme,
  type TenantThemePatch,
} from "@/lib/theme/merge-theme";
import {
  resolveEffectiveTenantTheme,
  type ThemeResolutionSource,
} from "@/lib/theme/resolve-effective-theme";
import {
  clearStoredTenantTheme,
  loadStoredTenantTheme,
  saveStoredTenantTheme,
} from "@/lib/theme/theme-storage";
import type { TenantTheme } from "@/lib/theme/types";

type ThemeContextValue = {
  theme: TenantTheme;
  hasCustomTheme: boolean;
  isHydrated: boolean;
  isEnterpriseLocked: boolean;
  themeSource: ThemeResolutionSource;
  setTheme: (patch: TenantThemePatch) => void;
  replaceTheme: (theme: TenantTheme) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  theme?: TenantTheme;
};

export default function ThemeProvider({
  children,
  theme: initialTheme = DEFAULT_TENANT_THEME,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<TenantTheme>(initialTheme);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEnterpriseLocked, setIsEnterpriseLocked] = useState(false);
  const [themeSource, setThemeSource] = useState<ThemeResolutionSource>("default");

  useEffect(() => {
    const enterpriseTheme = getEnterpriseThemeOverride();
    if (enterpriseTheme) {
      const resolved = resolveEffectiveTenantTheme();
      setThemeState(resolved.theme);
      setIsEnterpriseLocked(true);
      setThemeSource("enterprise-override");
    } else {
      const stored = loadStoredTenantTheme();
      const resolved = resolveEffectiveTenantTheme({ dynamicPatch: stored });
      setThemeState(resolved.theme);
      setIsEnterpriseLocked(false);
      setThemeSource(resolved.source);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    applyThemeToElement(document.documentElement, theme);
    if (!isEnterpriseLocked) {
      saveStoredTenantTheme(theme);
    }
  }, [theme, isHydrated, isEnterpriseLocked]);

  const setTheme = useCallback(
    (patch: TenantThemePatch) => {
      if (isEnterpriseLocked) return;
      setThemeState((current) => mergeTenantTheme(current, patch));
      setThemeSource("dynamic");
    },
    [isEnterpriseLocked],
  );

  const replaceTheme = useCallback(
    (next: TenantTheme) => {
      if (isEnterpriseLocked) return;
      setThemeState(mergeTenantTheme(DEFAULT_TENANT_THEME, next));
      setThemeSource("dynamic");
    },
    [isEnterpriseLocked],
  );

  const resetTheme = useCallback(() => {
    if (isEnterpriseLocked) return;
    clearStoredTenantTheme();
    setThemeState(DEFAULT_TENANT_THEME);
    setThemeSource("default");
  }, [isEnterpriseLocked]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      hasCustomTheme: hasCustomThemeOverrides(theme),
      isHydrated,
      isEnterpriseLocked,
      themeSource,
      setTheme,
      replaceTheme,
      resetTheme,
    }),
    [
      theme,
      isHydrated,
      isEnterpriseLocked,
      themeSource,
      setTheme,
      replaceTheme,
      resetTheme,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
