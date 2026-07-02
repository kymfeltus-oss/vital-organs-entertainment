import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Bebas_Neue, Inter, Montserrat, Oswald } from "next/font/google";
import RootLayoutShell from "@/components/RootLayoutShell";
import { BROWSER_CHROME_MINIMIZE_SCRIPT } from "@/lib/mobile/browser-chrome-minimize";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});

const montserrat = Montserrat({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "300 Awakening",
  description: "Tap Into The Awakening",
  applicationName: "300 Awakening",
  appleWebApp: {
    capable: true,
    title: "300 Awakening",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020203",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${montserrat.variable} ${inter.variable} ${oswald.variable}`}
    >
      <Script id="browser-chrome-minimize" strategy="beforeInteractive">
        {BROWSER_CHROME_MINIMIZE_SCRIPT}
      </Script>
      <body className="font-body device-fit-page min-h-dvh max-w-[100vw] overflow-x-hidden bg-transparent text-[16px] text-white antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border focus:border-brand-blue/50 focus:bg-brand-panel focus:px-4 focus:py-2 focus:font-ui focus:text-xs focus:font-bold focus:uppercase focus:tracking-[0.14em] focus:text-brand-blue"
        >
          Skip to main content
        </a>
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
