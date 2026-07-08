import type { Metadata, Viewport } from "next";
import "./coleman.css";
import "./coleman-home-premium.css";
import "./coleman-home-material-system.css";
import "./coleman-stage-audio.css";

export const metadata: Metadata = {
  title: "COLEMAN",
  description:
    "Worship tools for the stage — tuner, setlist, and music theory for church musicians.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function ColemanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="coleman-root antialiased">
      <div className="coleman-mobile-shell">
        <div className="coleman-mobile-frame coleman-luxury-canvas">
          <main id="main-content" className="coleman-mobile-screen">
            <div id="coleman-key-finder-live-root" aria-live="polite" aria-atomic="true" role="status">
              <span id="coleman-key-finder-status">Key Finder ready</span>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
