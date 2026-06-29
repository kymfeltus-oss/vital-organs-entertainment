"use client";

import { useState } from "react";
import { useDeviceInventoryStore } from "@/hooks/use-device-inventory-store";

export default function DeviceInventoryPreShowPanel() {
  const { cameras, hydrated, error, updateDevicePatch } = useDeviceInventoryStore();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("Device monitor waiting for inventory sync.");

  const handleToggleActive = async (id: string, active: boolean) => {
    if (pendingId) return;
    const device = cameras.find((camera) => camera.id === id);
    if (!device) {
      setMessage("Selected camera is no longer in inventory.");
      return;
    }
    if (device.healthStatus !== "LINKED" && active) {
      setMessage(`${device.displayName} cannot activate because it is ${device.healthStatus}.`);
      return;
    }
    setPendingId(id);
    setMessage("Updating pre-show device monitor...");
    try {
      const result = await updateDevicePatch(id, { preShowActive: active });
      setMessage(result.message);
    } catch {
      setMessage("Pre-show device activation failed.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:mx-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.18em] text-sky-400">
            Device Inventory Feed
          </p>
          <h2 className="font-headline text-lg uppercase tracking-[0.08em] text-slate-50">
            Preshow Control Hub - Device Monitor
          </h2>
        </div>
        <p className="font-body text-xs text-slate-400">
          {hydrated ? `${cameras.length} camera routes loaded` : "Hydrating inventory"}
        </p>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cameras.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-body text-sm text-slate-400">
            No camera inventory exists yet. Add cameras in Device Inventory.
          </div>
        ) : (
          cameras.map((camera) => {
            const linked = camera.healthStatus === "LINKED";
            return (
              <div
                key={camera.id}
                className={`rounded-xl border p-4 ${
                  linked
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <p className="font-ui text-sm font-bold uppercase text-slate-100">
                  {camera.displayName}
                </p>
                <p className="mt-1 font-body text-xs text-slate-500">
                  VIDEO HUB - Camera {camera.inputChannel}
                </p>
                <p className={linked ? "mt-3 text-sm text-emerald-300" : "mt-3 text-sm text-red-300"}>
                  {linked ? "[ LINKED ]" : `[ ${camera.healthStatus} ]`}
                </p>
                <button
                  data-testid={`pre-show-device-active-${camera.id}`}
                  type="button"
                  disabled={Boolean(pendingId) || !linked}
                  aria-pressed={camera.preShowActive}
                  onClick={() => void handleToggleActive(camera.id, !camera.preShowActive)}
                  className={`mt-4 min-h-10 w-full rounded-lg border px-3 font-ui text-xs font-black uppercase disabled:opacity-45 ${
                    camera.preShowActive
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-100"
                      : "border-slate-700 bg-slate-950/80 text-slate-300"
                  }`}
                >
                  {pendingId === camera.id
                    ? "Syncing"
                    : camera.preShowActive
                      ? "Active"
                      : "Activate"}
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="mt-4 font-body text-sm text-slate-400">{message}</p>
    </section>
  );
}
