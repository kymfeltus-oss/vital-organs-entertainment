import type { TenantTheme } from "@/lib/theme/types";

/** Maps tenant theme to CSS custom properties on :root. */
export function themeToCssVariables(theme: TenantTheme): Record<string, string> {
  const { colors, fonts } = theme;

  return {
    "--theme-primary": colors.primary,
    "--theme-secondary": colors.secondary,
    "--theme-bg": colors.background,
    "--theme-surface": colors.surface,
    "--theme-text": colors.text,
    "--theme-text-muted": colors.textMuted,
    "--theme-accent": colors.accent,
    "--theme-border": colors.border,
    "--theme-font-headline": fonts.headline,
    "--theme-font-body": fonts.body,
    "--theme-font-ui": fonts.ui,
    "--theme-app-gradient": `linear-gradient(160deg, ${colors.background} 0%, ${colors.surface} 55%, ${colors.background} 100%)`,
    "--theme-surface-gradient": `linear-gradient(180deg, ${colors.surface} 0%, ${colors.background} 100%)`,
    /* Legacy brand token aliases — existing components keep working */
    "--color-brand-black-base": colors.background,
    "--color-brand-panel": colors.surface,
    "--color-brand-blue": colors.primary,
    "--color-brand-purple": colors.accent,
    "--color-brand-pink": colors.accent,
    "--color-brand-indigo": colors.accent,
    "--color-brand-white": colors.text,
    "--color-brand-muted": colors.textMuted,
    "--color-brand-border": colors.border,
    "--color-brand-charcoal": colors.surface,
    "--app-glossy-background": `linear-gradient(160deg, ${colors.background} 0%, ${colors.surface} 55%, ${colors.background} 100%)`,
    "--gradient-brand": `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
    "--gradient-brand-soft": `linear-gradient(90deg, color-mix(in srgb, ${colors.primary} 25%, transparent) 0%, color-mix(in srgb, ${colors.accent} 25%, transparent) 100%)`,
    "--font-headline": fonts.headline,
    "--font-body": fonts.body,
    "--font-ui": fonts.ui,
  };
}

export function applyThemeToElement(element: HTMLElement, theme: TenantTheme): void {
  const vars = themeToCssVariables(theme);
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}
