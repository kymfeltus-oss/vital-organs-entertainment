/**
 * Tailwind class fragments bound to CSS variables in coleman.css.
 * Never hardcode hex in home UI — logo + app must share one palette.
 */
export const cb = {
  page: "relative flex h-full min-h-0 w-full flex-col overflow-hidden coleman-luxury-canvas font-[family-name:var(--coleman-font)] text-[var(--coleman-text-primary)]",
  pageGradient:
    "relative flex h-full min-h-0 w-full flex-col overflow-hidden coleman-luxury-canvas font-[family-name:var(--coleman-font)] text-[var(--coleman-text-primary)]",
  textPrimary: "text-[var(--coleman-text-primary)]",
  textSecondary: "text-[var(--coleman-text-secondary)]",
  textMuted: "text-[var(--coleman-text-muted)]",
  accent: "text-[var(--coleman-champagne)]",
  lime: "text-[var(--coleman-accent-lime)]",
  bronze: "text-[var(--coleman-bronze)]",
  glass:
    "border border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-fill)] backdrop-blur-[var(--coleman-blur)]",
  glassShadow: "shadow-[var(--coleman-shadow-soft)]",
  glassCard:
    "rounded-[26px] border border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-fill)] shadow-[var(--coleman-shadow-soft)] backdrop-blur-[var(--coleman-blur)]",
  glassBtn:
    "inline-flex items-center justify-center rounded-full border border-[var(--coleman-glass-border)] bg-[var(--coleman-glass-fill)] shadow-[var(--coleman-shadow-soft)] backdrop-blur-[var(--coleman-blur)] transition active:scale-[0.97]",
  glowUnderline: "shadow-[0_5px_0_0_var(--coleman-glow-strong)]",
  meterFill:
    "bg-gradient-to-r from-[var(--coleman-champagne)] to-[var(--coleman-shadow-medium)]",
  logoCanvas: "bg-[var(--coleman-logo-canvas)]",
} as const;
