/** Flyer-approved typography + spacing tokens for `/experience` dashboard */

export const DASHBOARD_FLYER_TYPE = {
  welcome: {
    font: "Bebas Neue",
    weight: 400,
    desktopSize: "84px",
    mobileSize: "54px",
    tracking: "0.22em",
    lineHeight: 0.95,
    gradient: "linear-gradient(90deg, #00A8FF 0%, #8A2EFF 50%, #FF2FAF 100%)",
    glow: "0 0 15px rgba(0,168,255,0.55), 0 0 30px rgba(255,47,175,0.35)",
  },
  tagline: {
    font: "Montserrat SemiBold",
    weight: 600,
    size: "18px",
    tracking: "0.04em",
    lineHeight: 1.2,
    color: "rgba(255,255,255,0.9)",
  },
  headline: {
    font: "Bebas Neue",
    weight: 400,
    desktopSize: "112px",
    mobileSize: "64px",
    tracking: "0.22em",
    lineHeight: 0.9,
    color: "#FFFFFF",
    glow: "0 0 15px rgba(0,168,255,0.45), 0 0 30px rgba(255,47,175,0.25)",
  },
  subtitle: {
    font: "Montserrat Light",
    weight: 300,
    size: "18px",
    tracking: "0.12em",
    color: "rgba(255,255,255,0.85)",
  },
  enterCta: {
    font: "Montserrat Medium",
    weight: 500,
    size: "42px",
    tracking: "0.10em",
    color: "#FFFFFF",
    height: "72px",
    radius: "9999px",
    borderGradient: "linear-gradient(90deg, #00A8FF 0%, #8A2EFF 50%, #FF2FAF 100%)",
    background: "rgba(7,7,10,0.78)",
  },
  watchCta: {
    font: "Montserrat Medium",
    weight: 500,
    size: "16px",
    tracking: "0.10em",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.08)",
    glow: "0 0 15px rgba(255,47,175,0.25)",
  },
  cardTitle: {
    font: "Bebas Neue",
    size: "28px",
    tracking: "0.04em",
    color: "#FFFFFF",
  },
  cardDescription: {
    font: "Inter Regular",
    size: "14px",
    color: "rgba(255,255,255,0.90)",
  },
  navLabel: {
    font: "Montserrat Medium",
    weight: 500,
    size: "14px",
    tracking: "0.18em",
    color: "#FFFFFF",
    activeGlow: "#FF2FAF",
  },
} as const;

/** @deprecated Use DASHBOARD_FLYER_TYPE — kept for existing imports */
export const DASHBOARD_PIC1 = {
  typography: {
    welcomeGradient: DASHBOARD_FLYER_TYPE.welcome.gradient,
    welcomeTracking: DASHBOARD_FLYER_TYPE.welcome.tracking,
    welcomeSize: "clamp(3.375rem, 8vw, 5.25rem)",
    headlineTracking: DASHBOARD_FLYER_TYPE.headline.tracking,
    headlineSize: "clamp(4rem, 10vw, 7rem)",
    subtitleTracking: DASHBOARD_FLYER_TYPE.subtitle.tracking,
    subtitleSize: DASHBOARD_FLYER_TYPE.subtitle.size,
  },
  colors: {
    blue: "#00A8FF",
    magenta: "#8A2EFF",
    pink: "#FF2FAF",
    black: "#07070A",
    buttonGradient: DASHBOARD_FLYER_TYPE.enterCta.borderGradient,
  },
} as const;
