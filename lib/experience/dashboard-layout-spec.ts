/** Flyer-approved typography + spacing tokens for `/experience` dashboard */

export const DASHBOARD_FLYER_TYPE = {
  welcome: {
    font: "Bebas Neue",
    weight: 400,
    desktopSize: "84px",
    mobileSize: "54px",
    tracking: "0.12em",
    lineHeight: 0.95,
    gradient: "linear-gradient(90deg, #FF4BDB 0%, #D86BFF 50%, #4B8CFF 100%)",
    glow: "0 0 20px rgba(255,75,219,0.55), 0 0 40px rgba(75,140,255,0.35)",
  },
  tagline: {
    font: "Montserrat Medium",
    weight: 500,
    size: "18px",
    tracking: "0.45em",
    lineHeight: 1.2,
    color: "rgba(255,255,255,0.85)",
  },
  headline: {
    font: "Bebas Neue",
    weight: 400,
    desktopSize: "112px",
    mobileSize: "64px",
    tracking: "0.08em",
    lineHeight: 0.9,
    color: "#FFFFFF",
    glow: "0 0 12px rgba(255,255,255,0.35), 0 0 28px rgba(255,255,255,0.15)",
  },
  subtitle: {
    font: "Montserrat Medium",
    weight: 500,
    size: "18px",
    tracking: "0.45em",
    color: "rgba(255,255,255,0.85)",
  },
  enterCta: {
    font: "Bebas Neue",
    weight: 400,
    size: "42px",
    tracking: "0.16em",
    color: "#FFFFFF",
    height: "72px",
    radius: "9999px",
    borderGradient: "linear-gradient(90deg, #1E40AF 0%, #7D3AFF 50%, #FF145F 100%)",
    background: "rgba(0,0,0,0.75)",
  },
  watchCta: {
    font: "Montserrat SemiBold",
    weight: 600,
    size: "16px",
    tracking: "0.06em",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.75)",
    glow: "0 0 16px rgba(255,75,219,0.25)",
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
    activeGlow: "#FF4BDB",
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
    blue: "#1E40AF",
    magenta: "#B0267A",
    pink: "#FF145F",
    black: "#0B090A",
    buttonGradient: DASHBOARD_FLYER_TYPE.enterCta.borderGradient,
  },
} as const;
