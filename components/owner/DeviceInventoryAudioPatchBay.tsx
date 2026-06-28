"use client";

import { useState } from "react";
import { useDeviceInventoryStore } from "@/hooks/use-device-inventory-store";

export default function DeviceInventoryAudioPatchBay() {
  const { microphones, hydrated, error, updateDevicePatch } = useDeviceInventoryStore();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("Sound Hub patch matrix synchronized.");

  const mutateMic = async (
    id: string,
    patch: Parameters<typeof updateDevicePatch>[1],
    pendingLabel: string,
  ) => {
    if (pendingId) return;
    setPendingId(id);
    setMessage(pendingLabel);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const result = updateDevicePatch(id, patch);
      setMessage(result.message);
    } catch {
      setMessage("Sound Hub patch update failed.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.18em] text-sky-400">
            Device Inventory Feed
          </p>
          <h2 className="font-headline text-lg uppercase tracking-[0.08em] text-slate-50">
            Sound Hub Dynamic Patch Bay
          </h2>
        </div>
        <p className="font-body text-xs text-slate-400">
          {hydrated ? `${microphones.length} mic routes loaded` : "Hydrating inventory"}
        </p>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-5 space-y-3">
        {microphones.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-body text-sm text-slate-400">
            No microphone inventory exists yet. Add microphones in Device Inventory.
          </div>
        ) : (
          microphones.map((mic) => {
            const linked = mic.healthStatus === "LINKED";
            return (
              <div
                key={mic.id}
                className={`grid gap-3 rounded-xl border p-4 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:items-center ${
                  linked
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-red-500/25 bg-red-500/5"
                }`}
              >
                <div>
                  <p className="font-ui text-sm font-bold uppercase text-slate-100">
                    PATCH: {mic.inputChannel} -&gt; {mic.manufacturer} {mic.model}
                  </p>
                  <p className="font-body text-xs text-slate-500">{mic.displayName}</p>
                  <p className={linked ? "mt-2 text-xs text-emerald-300" : "mt-2 text-xs text-red-300"}>
                    {linked ? "Sovereign Ingest ARN: active" : `Status: ${mic.healthStatus}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid={`audio-patch-mute-${mic.id}`}
                    type="button"
                    disabled={Boolean(pendingId)}
                    aria-pressed={mic.muted}
                    onClick={() => void mutateMic(mic.id, { muted: !mic.muted }, "Saving mute state...")}
                    className={`min-h-10 flex-1 rounded-lg border px-3 font-ui text-xs font-black uppercase disabled:opacity-45 ${
                      mic.muted
                        ? "border-red-400 bg-red-500/15 text-red-100"
                        : "border-slate-700 bg-slate-950/80 text-slate-300"
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    data-testid={`audio-patch-solo-${mic.id}`}
                    type="button"
                    disabled={Boolean(pendingId)}
                    aria-pressed={mic.solo}
                    onClick={() => void mutateMic(mic.id, { solo: !mic.solo }, "Saving solo state...")}
                    className={`min-h-10 flex-1 rounded-lg border px-3 font-ui text-xs font-black uppercase disabled:opacity-45 ${
                      mic.solo
                        ? "border-amber-300 bg-amber-300/15 text-amber-100"
                        : "border-slate-700 bg-slate-950/80 text-slate-300"
                    }`}
                  >
                    Solo
                  </button>
                </div>
                <label className="block">
                  <span className="font-body text-xs text-slate-500">Volume {mic.volume}%</span>
                  <input
                    data-testid={`audio-patch-volume-${mic.id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={mic.volume}
                    disabled={Boolean(pendingId)}
                    onChange={(event) =>
                      void mutateMic(
                        mic.id,
                        { volume: Number.parseInt(event.target.value, 10) },
                        "Saving channel volume...",
                      )
                    }
                    className="mt-2 w-full accent-[#8A2EFF]"
                  />
                </label>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-4 font-body text-sm text-slate-400">{message}</p>
    </section>
  );
}
