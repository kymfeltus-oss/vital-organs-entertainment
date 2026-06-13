/** PARABLE Broadcast Console brand tokens — scoped to /dashboard/broadcast. */

export const PARABLE_COLORS = {
  void: "#0B090A",
  panel: "#111111",
  blue: "#1E40AF",
  magenta: "#B0267A",
} as const;

export const PARABLE_STATUS = {
  green: {
    text: "text-green-400",
    border: "border-green-500/40",
    bg: "bg-green-500/10",
    dot: "bg-green-400",
  },
  yellow: {
    text: "text-yellow-300",
    border: "border-yellow-400/40",
    bg: "bg-yellow-400/10",
    dot: "bg-yellow-400",
  },
  orange: {
    text: "text-orange-300",
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    dot: "bg-orange-500",
  },
  red: {
    text: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
  },
  black: {
    text: "text-white",
    border: "border-black",
    bg: "bg-black",
    dot: "bg-white",
  },
} as const;

export const PARABLE_SHELL = {
  page: "min-h-dvh bg-[#0B090A] text-white",
  header: "border-b border-white/10 bg-[#111111]/90 backdrop-blur-md",
  panel: "rounded-2xl border border-white/10 bg-[#111111] p-4",
  accentBlue: "text-[#1E40AF]",
  accentMagenta: "text-[#B0267A]",
  borderBlue: "border-[#1E40AF]/40",
  borderMagenta: "border-[#B0267A]/40",
  btnPrimary:
    "border-[#B0267A]/50 bg-[#B0267A]/15 hover:bg-[#B0267A]/25 text-white",
  btnSecondary:
    "border-[#1E40AF]/40 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/20 text-white",
  muted: "text-white/65",
} as const;
