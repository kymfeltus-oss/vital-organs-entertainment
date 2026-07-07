import type { Metadata } from "next";
import "./liv-golf.css";

export const metadata: Metadata = {
  title: "PARABLE Enterprise × LIV Golf — Executive Command Center",
  description:
    "Unified visibility across streaming, commerce, sponsorship, tournaments, and fan engagement.",
};

export default function LivGolfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-dvh w-full text-white antialiased"
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, #00030d 0%, transparent 55%), #000000",
      }}
    >
      {children}
    </div>
  );
}
