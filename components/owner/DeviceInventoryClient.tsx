"use client";

import { useMemo, useState } from "react";
import { Camera, Mic, Plus, Save, Trash2 } from "lucide-react";
import { useDeviceInventoryStore } from "@/hooks/use-device-inventory-store";
import {
  buildSovereignIngestArn,
  normalizeLinkedHub,
  type DeviceDraft,
  type DeviceHealthStatus,
  type DeviceKind,
  type LinkedHub,
  type PersistedDevice,
} from "@/lib/owner/device-inventory";

const EMPTY_DRAFT: DeviceDraft = {
  displayName: "",
  deviceKind: "MIC",
  linkedHub: "SOUND HUB",
  inputChannel: 1,
  manufacturer: "",
  model: "",
  sovereignIngestArn: "",
  healthStatus: "LINKED",
};

function deviceToDraft(device: PersistedDevice): DeviceDraft {
  return {
    displayName: device.displayName,
    deviceKind: device.deviceKind,
    linkedHub: device.linkedHub,
    inputChannel: device.inputChannel,
    manufacturer: device.manufacturer,
    model: device.model,
    sovereignIngestArn: device.sovereignIngestArn,
    healthStatus: device.healthStatus,
  };
}

function statusClass(status: DeviceHealthStatus): string {
  if (status === "LINKED") return "text-[#22E66B]";
  if (status === "DISCONNECTED") return "text-red-300";
  return "text-amber-300";
}

export default function DeviceInventoryClient() {
  const {
    devices,
    microphones,
    cameras,
    hydrated,
    error,
    upsertDevice,
    updateDevicePatch,
    removeDevice,
  } = useDeviceInventoryStore();
  const [draft, setDraft] = useState<DeviceDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState("Inventory state plane ready.");
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  const patchDraft = (patch: Partial<DeviceDraft>) => {
    setDraft((current) => {
      const nextKind = patch.deviceKind ?? current.deviceKind;
      const nextHub = normalizeLinkedHub(nextKind, patch.linkedHub ?? current.linkedHub);
      const nextChannel = patch.inputChannel ?? current.inputChannel;
      return {
        ...current,
        ...patch,
        linkedHub: nextHub,
        sovereignIngestArn:
          patch.deviceKind || patch.inputChannel
            ? buildSovereignIngestArn({ deviceKind: nextKind, inputChannel: nextChannel })
            : (patch.sovereignIngestArn ?? current.sovereignIngestArn),
      };
    });
  };

  const runMutation = async (actionId: string, mutation: () => { ok: boolean; message: string }) => {
    if (pendingAction) return;
    setPendingAction(actionId);
    setTone("info");
    setMessage("Syncing device routing matrix...");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      const result = mutation();
      setTone(result.ok ? "success" : "error");
      setMessage(result.message);
      if (result.ok && (actionId === "save-device" || actionId === "delete-device")) {
        setDraft(EMPTY_DRAFT);
        setEditingId(null);
      }
    } catch {
      setTone("error");
      setMessage("Device inventory update failed.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveDevice = () => {
    void runMutation("save-device", () => upsertDevice(draft, editingId));
  };

  const handleEditDevice = (device: PersistedDevice) => {
    setEditingId(device.id);
    setDraft(deviceToDraft(device));
    setTone("info");
    setMessage(`${device.displayName} loaded for in-place patching.`);
  };

  const activePatchSummary = useMemo(
    () =>
      devices
        .filter((device) => device.healthStatus === "LINKED")
        .map((device) => `PATCH: ${device.inputChannel} -> ${device.manufacturer} ${device.model}`)
        .join(" | ") || "No linked devices are currently routed.",
    [devices],
  );

  return (
    <main className="min-h-dvh overflow-hidden bg-[#07070A] px-5 py-5 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70" aria-hidden="true">
        <div className="absolute left-[12%] top-[16%] h-80 w-80 rounded-full bg-[#8A2EFF]/10 blur-[100px]" />
        <div className="absolute right-[8%] top-[20%] h-72 w-72 rounded-full bg-[#29A7FF]/10 blur-[100px]" />
      </div>
      <div className="relative mx-auto max-w-[1480px]">
        <header className="mb-4 flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-ui text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#22E66B]">
              Live Mode State Plane
            </p>
            <h1 className="font-headline text-4xl uppercase tracking-[0.03em] text-white md:text-5xl">
              Device Inventory <span className="text-white/45">(Module 4)</span>{" "}
              <span className="text-[#7DCBFF]">Propagation Logic</span>
            </h1>
          </div>
          <div className="rounded-xl border border-[#8A2EFF]/40 bg-[#8A2EFF]/15 px-4 py-3 font-ui text-xs font-black uppercase text-[#E8D5FF] shadow-[0_0_24px_rgba(138,46,255,0.35)]">
            Global State Plane: {hydrated ? "Active" : "Hydrating"}
          </div>
        </header>

        <div className="mb-4 rounded-lg border border-[#F4C542]/30 bg-[#F4C542]/10 px-4 py-3 font-body text-sm text-[#FFE8A3]">
          [ Configuration Alert ] {activePatchSummary}
        </div>

        <section className="grid gap-4 xl:grid-cols-[1fr_22rem]">
          <div className="rounded-2xl border border-white/15 bg-[#111117]/90 p-4">
            <div className="grid grid-cols-[1.3fr_0.45fr_1fr_0.75fr_0.8fr] gap-3 border-b border-[#8A2EFF]/40 pb-3 font-ui text-xs font-black uppercase text-white/65">
              <span>Device Name</span>
              <span>Type</span>
              <span>Hub Link</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-white/10">
              {devices.length === 0 ? (
                <div className="py-12 text-center font-body text-sm text-white/55">
                  No devices are stored yet. Add the first external device to establish routing.
                </div>
              ) : (
                devices.map((device) => (
                  <div
                    key={device.id}
                    className="grid grid-cols-[1.3fr_0.45fr_1fr_0.75fr_0.8fr] items-center gap-3 py-4"
                  >
                    <div>
                      <p className="font-ui text-sm font-black uppercase text-white">
                        {device.displayName}
                      </p>
                      <p className="font-body text-xs text-white/45">{device.sovereignIngestArn}</p>
                    </div>
                    <p className={device.deviceKind === "MIC" ? "text-[#78F08F]" : "text-[#58A9FF]"}>
                      [ {device.deviceKind} ]
                    </p>
                    <p className="font-body text-sm text-white/80">
                      {device.linkedHub} - Channel {device.inputChannel}
                    </p>
                    <div className="flex items-center gap-2">
                      <select
                        data-testid={`device-inventory-health-${device.id}`}
                        disabled={Boolean(pendingAction)}
                        value={device.healthStatus}
                        onChange={(event) =>
                          void runMutation(`health-${device.id}`, () =>
                            updateDevicePatch(device.id, {
                              healthStatus: event.target.value as DeviceHealthStatus,
                            }),
                          )
                        }
                        className={`rounded-md border border-white/15 bg-white/[0.06] px-2 py-2 font-ui text-xs font-black uppercase outline-none ${statusClass(device.healthStatus)}`}
                      >
                        <option value="LINKED">LINKED</option>
                        <option value="DISCONNECTED">DISCONNECTED</option>
                        <option value="ERROR">ERROR</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        data-testid={`device-inventory-edit-${device.id}`}
                        type="button"
                        disabled={Boolean(pendingAction)}
                        onClick={() => handleEditDevice(device)}
                        className="rounded-md border border-[#8A2EFF]/70 px-3 py-2 font-ui text-xs font-black uppercase text-[#E8D5FF] disabled:opacity-45"
                      >
                        Edit
                      </button>
                      <button
                        data-testid={`device-inventory-delete-${device.id}`}
                        type="button"
                        disabled={Boolean(pendingAction)}
                        onClick={() =>
                          void runMutation("delete-device", () => removeDevice(device.id))
                        }
                        className="rounded-md border border-red-400/50 px-3 py-2 text-red-200 disabled:opacity-45"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#A855F7]/35 bg-[#151518]/95 p-4 shadow-[0_0_28px_rgba(168,85,247,0.25)]">
            <h2 className="font-ui text-sm font-black uppercase">
              {editingId ? "Patch Existing Device" : "Add New External Device"}
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-body text-xs text-white/55">Device Name</span>
                <input
                  data-testid="device-inventory-name-input"
                  value={draft.displayName}
                  disabled={Boolean(pendingAction)}
                  onChange={(event) => patchDraft({ displayName: event.target.value })}
                  className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none focus:border-[#A855F7]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-body text-xs text-white/55">Type</span>
                  <select
                    data-testid="device-inventory-kind-select"
                    value={draft.deviceKind}
                    disabled={Boolean(pendingAction)}
                    onChange={(event) => patchDraft({ deviceKind: event.target.value as DeviceKind })}
                    className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                  >
                    <option value="MIC">MIC</option>
                    <option value="CAMERA">CAMERA</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-body text-xs text-white/55">Channel</span>
                  <input
                    data-testid="device-inventory-channel-input"
                    type="number"
                    min={1}
                    max={64}
                    value={draft.inputChannel}
                    disabled={Boolean(pendingAction)}
                    onChange={(event) =>
                      patchDraft({ inputChannel: Number.parseInt(event.target.value, 10) || 1 })
                    }
                    className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-body text-xs text-white/55">Hub Placement</span>
                <select
                  data-testid="device-inventory-hub-select"
                  value={draft.linkedHub}
                  disabled={Boolean(pendingAction)}
                  onChange={(event) => patchDraft({ linkedHub: event.target.value as LinkedHub })}
                  className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                >
                  <option value="SOUND HUB">SOUND HUB</option>
                  <option value="VIDEO HUB">VIDEO HUB</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-body text-xs text-white/55">Manufacturer</span>
                  <input
                    data-testid="device-inventory-manufacturer-input"
                    value={draft.manufacturer}
                    disabled={Boolean(pendingAction)}
                    onChange={(event) => patchDraft({ manufacturer: event.target.value })}
                    className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                  />
                </label>
                <label className="block">
                  <span className="font-body text-xs text-white/55">Model</span>
                  <input
                    data-testid="device-inventory-model-input"
                    value={draft.model}
                    disabled={Boolean(pendingAction)}
                    onChange={(event) => patchDraft({ model: event.target.value })}
                    className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-body text-xs text-white/55">Status</span>
                <select
                  data-testid="device-inventory-status-select"
                  value={draft.healthStatus}
                  disabled={Boolean(pendingAction)}
                  onChange={(event) =>
                    patchDraft({ healthStatus: event.target.value as DeviceHealthStatus })
                  }
                  className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                >
                  <option value="LINKED">LINKED</option>
                  <option value="DISCONNECTED">DISCONNECTED</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </label>
              <label className="block">
                <span className="font-body text-xs text-white/55">Sovereign Ingest ARN</span>
                <input
                  data-testid="device-inventory-arn-input"
                  value={draft.sovereignIngestArn || buildSovereignIngestArn(draft)}
                  disabled={Boolean(pendingAction)}
                  onChange={(event) => patchDraft({ sovereignIngestArn: event.target.value })}
                  className="mt-1 min-h-10 w-full rounded-md border border-white/20 bg-white/[0.08] px-3 text-white outline-none"
                />
              </label>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                data-testid="device-inventory-reset-form-button"
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={() => {
                  setDraft(EMPTY_DRAFT);
                  setEditingId(null);
                  setTone("info");
                  setMessage("Device form reset.");
                }}
                className="min-h-11 rounded-lg border border-white/20 px-3 font-ui text-xs font-black uppercase text-white/70 disabled:opacity-45"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                New
              </button>
              <button
                data-testid="device-inventory-save-button"
                type="button"
                disabled={Boolean(pendingAction)}
                onClick={handleSaveDevice}
                className="min-h-11 rounded-lg border border-[#A855F7] bg-[#8A2EFF]/45 px-3 font-ui text-xs font-black uppercase text-white shadow-[0_0_18px_rgba(168,85,247,0.65)] disabled:opacity-45"
              >
                <Save className="mr-2 inline h-4 w-4" />
                {pendingAction === "save-device" ? "Saving" : "Save"}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-ui text-xs font-black uppercase text-white/55">
                Propagation Consumers
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#78F08F]/25 bg-[#78F08F]/10 p-3">
                  <Mic className="h-5 w-5 text-[#78F08F]" />
                  <p className="mt-2 font-ui text-xl font-black">{microphones.length}</p>
                  <p className="font-body text-xs text-white/55">Sound Hub inputs</p>
                </div>
                <div className="rounded-lg border border-[#58A9FF]/25 bg-[#58A9FF]/10 p-3">
                  <Camera className="h-5 w-5 text-[#58A9FF]" />
                  <p className="mt-2 font-ui text-xl font-black">{cameras.length}</p>
                  <p className="font-body text-xs text-white/55">Video Hub inputs</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div
          className={`mt-4 rounded-xl border px-4 py-3 font-body text-sm ${
            tone === "error"
              ? "border-red-400/35 bg-red-500/10 text-red-200"
              : tone === "success"
                ? "border-[#22E66B]/35 bg-[#22E66B]/10 text-[#B7FFD0]"
                : "border-[#29A7FF]/35 bg-[#29A7FF]/10 text-[#C7EAFF]"
          }`}
        >
          {error ? `${error} ` : null}
          {message}
        </div>
      </div>
    </main>
  );
}
