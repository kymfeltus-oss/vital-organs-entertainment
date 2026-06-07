import type { Metadata, Viewport } from "next";
import { AudioProvider } from "@/app/context/AudioContext";
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
      <body className="min-h-screen bg-black text-white antialiased">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
