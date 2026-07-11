import type { Metadata } from "next";
import "./liv-golf.css";

export const metadata: Metadata = {
  title: "PARABLE Enterprise × LIV Golf",
  description:
    "One platform for streaming, fan engagement, commerce, sponsorship, and audience ownership.",
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
      }}
    >
      {children}
    </div>
  );
}
