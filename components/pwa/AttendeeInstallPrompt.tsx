"use client";

import { useEffect, useState } from "react";

const DISMISSAL_KEY = "awakening:pwa-install-dismissed:v1";
const DISMISSAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type PromptMode = "browser" | "ios" | null;

function isRunningStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  );
}

function wasRecentlyDismissed() {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSAL_KEY));
    return (
      Number.isFinite(dismissedAt) &&
      dismissedAt > Date.now() - DISMISSAL_WINDOW_MS
    );
  } catch {
    return false;
  }
}

export default function AttendeeInstallPrompt() {
  const [mode, setMode] = useState<PromptMode>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isRunningStandalone() || wasRecentlyDismissed()) {
      return;
    }

    const userAgent = window.navigator.userAgent;
    const isIos =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);

    let revealTimer: number | undefined;

    if (isIos) {
      revealTimer = window.setTimeout(() => setMode("ios"), 1200);
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => setMode("browser"), 1200);
    };

    const handleInstalled = () => {
      window.clearTimeout(revealTimer);
      setMode(null);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
    } catch {
      // The banner can still be dismissed when storage is unavailable.
    }

    setMode(null);
    setInstallPrompt(null);
  };

  const install = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "dismissed") {
      try {
        window.localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
      } catch {
        // The prompt should still close when storage is unavailable.
      }
    }

    setMode(null);
    setInstallPrompt(null);
  };

  if (!mode) {
    return null;
  }

  return (
    <aside
      aria-label="Install 300 Awakening"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/15 bg-black/90 p-4 font-ui text-white shadow-2xl backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        &times;
      </button>

      <div className="pr-9">
        <p className="text-sm font-semibold tracking-wide">Keep Awakening close</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          {mode === "ios"
            ? "Tap Share, then Add to Home Screen for a full-screen experience."
            : "Install the app for quick access and a full-screen experience."}
        </p>
      </div>

      {mode === "browser" && installPrompt ? (
        <button
          type="button"
          onClick={install}
          className="mt-3 min-h-11 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Install app
        </button>
      ) : null}
    </aside>
  );
}
