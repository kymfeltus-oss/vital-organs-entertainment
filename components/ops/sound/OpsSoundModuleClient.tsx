"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AudioMixer from "@/components/broadcast/AudioMixer";
import AudioMonitorPanel from "@/components/ops/AudioMonitorPanel";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { audioLevelsToChannels } from "@/lib/ops/ops-audio-channels";
import {
  buildOpsModuleHref,
  normalizeOpsView,
  OPS_MODULE_ROUTES,
  OPS_SOUND_VIEWS,
} from "@/lib/ops/ops-module-nav";

function OpsSoundModuleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeOpsView(searchParams.get("view"), OPS_SOUND_VIEWS, "mixer");
  const { stream, opsState } = useOpsStreamStateRealtime();

  useEffect(() => {
    if (searchParams.get("view")) return;
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.sound, "mixer"));
  }, [router, searchParams]);

  const channels = useMemo(
    () => audioLevelsToChannels(opsState?.audioLevels),
    [opsState?.audioLevels],
  );

  const viewTabs = OPS_SOUND_VIEWS.map((id) => ({
    id,
    label: id,
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.sound, id),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-brand-border px-4 py-4 md:px-6">
        <h1 className="font-headline text-fluid-section uppercase tracking-[0.1em]">Sound</h1>
        <p className="mt-1 font-body text-sm text-brand-muted">Audio orchestration core</p>
        <div className="mt-4">
          <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Sound module views" />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {view === "mixer" ? (
          <AudioMixer channels={channels} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AudioMonitorPanel audioLevels={opsState?.audioLevels ?? null} />
            <section className="glass-panel rounded-2xl border border-brand-border p-5">
              <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Output Routing
              </h2>
              <dl className="mt-4 space-y-3 font-ui text-sm">
                <div className="flex justify-between gap-4 border-b border-brand-border pb-2">
                  <dt className="text-brand-muted">Active source</dt>
                  <dd className="font-bold uppercase text-white">
                    {stream?.activeSource ?? "offline"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-brand-border pb-2">
                  <dt className="text-brand-muted">Live</dt>
                  <dd className="font-bold uppercase text-white">
                    {stream?.isLive ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-brand-muted">Studio engine</dt>
                  <dd className="font-bold uppercase text-white">
                    {stream?.studioEngineMode ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OpsSoundModuleClient() {
  return (
    <Suspense fallback={null}>
      <OpsSoundModuleInner />
    </Suspense>
  );
}
