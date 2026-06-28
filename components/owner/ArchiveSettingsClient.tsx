"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RecordingSettingsSubmodule from "@/components/owner/RecordingSettingsSubmodule";

type ShowSetupResponse = {
  ok?: boolean;
  state?: {
    showTitle?: string;
    targetDateTime?: string;
  };
  error?: string;
};

function buildShowId(showTitle: string, targetDateTime: string): string {
  const raw = `${showTitle}-${targetDateTime}`.toLowerCase();
  return raw.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "active-show";
}

export default function ArchiveSettingsClient() {
  const [showTitle, setShowTitle] = useState("The Awakening Experience");
  const [showId, setShowId] = useState("active-show");
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadShowSetup() {
      setSetupLoading(true);
      try {
        const response = await fetch("/api/owner/show-setup", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as ShowSetupResponse;
        if (!response.ok || !data.state) {
          throw new Error(data.error ?? "Unable to load active show setup.");
        }
        if (!cancelled) {
          const title = data.state.showTitle?.trim() || "The Awakening Experience";
          const targetDateTime = data.state.targetDateTime || new Date().toISOString();
          setShowTitle(title);
          setShowId(buildShowId(title, targetDateTime));
          setSetupError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSetupError(loadError instanceof Error ? loadError.message : "Show setup load failed.");
        }
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }
    void loadShowSetup();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#050505] px-5 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80" aria-hidden="true">
        <div className="absolute left-[12%] top-[12%] h-80 w-80 rounded-full bg-[#8A2EFF]/12 blur-[110px]" />
        <div className="absolute right-[10%] top-[18%] h-80 w-80 rounded-full bg-[#29A7FF]/12 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-[1420px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#22E66B]">
              Cloud DVR & Media Archival Synthesis
            </p>
            <h1 className="font-headline text-4xl uppercase tracking-[0.04em] text-white md:text-5xl">
              Live Replay <span className="text-white/45">& Archive</span>{" "}
              <span className="text-[#7DCBFF]">Settings</span>
            </h1>
            <p className="mt-2 font-body text-sm text-white/55">
              Active show: {showTitle} | Vault key: {showId}
            </p>
          </div>
          <Link
            data-testid="archive-back-to-show-setup-link"
            href="/owner/show-setup"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#8A2EFF]/60 px-4 font-ui text-xs font-black uppercase text-[#E8D5FF] shadow-[0_0_18px_rgba(138,46,255,0.35)]"
          >
            Back to Show Setup
          </Link>
        </header>

        {setupError ? (
          <div
            data-testid="archive-error-alert"
            className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200"
          >
            {setupError}
          </div>
        ) : null}

        {setupLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 font-body text-sm text-white/55">
            Hydrating archive control plane...
          </div>
        ) : (
          <RecordingSettingsSubmodule showId={showId} showTitle={showTitle} />
        )}
      </div>
    </main>
  );
}
