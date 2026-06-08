import type { Metadata, Viewport } from "next";
import RootLayoutShell from "@/components/RootLayoutShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "300 Awakening",
  description: "Tap Into The Awakening",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh max-w-[100vw] overflow-x-hidden bg-[#0B090A] text-[16px] text-white antialiased">
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
