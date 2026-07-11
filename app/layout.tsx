import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import RootLayoutShell from "@/components/ui/shell/RootLayoutShell";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { DEFAULT_TENANT_THEME } from "@/lib/theme/default-theme";
import "./globals.css";
import "./theme-layout.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: DEFAULT_TENANT_THEME.appName,
  description: DEFAULT_TENANT_THEME.tagline,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: DEFAULT_TENANT_THEME.appName,
  },
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body
        className="font-body min-h-dvh max-w-[100vw] overflow-x-hidden antialiased"
        style={{
          background: "var(--theme-app-gradient)",
          color: "var(--theme-text)",
          fontFamily: "var(--theme-font-body)",
        }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:border focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
          style={{
            borderColor: "var(--theme-border)",
            backgroundColor: "var(--theme-surface)",
            color: "var(--theme-primary)",
          }}
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <RootLayoutShell>{children}</RootLayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
