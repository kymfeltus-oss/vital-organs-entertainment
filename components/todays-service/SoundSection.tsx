"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { FooterLink, IconBtn, RowItem, ServiceCard, SubLabel, TS } from "@/components/todays-service/ServiceUi";
import SoundDeviceMeter from "@/components/todays-service/sound/SoundDeviceMeter";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import { Eye, Pencil, RefreshCw, Trash2, Zap } from "lucide-react";
import {
  deleteSoundDeviceApi,
  previewSoundDeviceApi,
  readSoundLevelsApi,
  reconnectSoundDeviceApi,
  testSoundDeviceApi,
  updateSoundDeviceApi,
} from "@/lib/sound/api";
import { extractBrowserDeviceId } from "@/lib/sound/device-utils";
import { SOUND_CONNECTION_LABELS } from "@/lib/sound/labels";
import { volunteerStatusLabel } from "@/lib/todays-service/coaching";
import type { Mixer, SoundItem } from "@/lib/todays-service/types";

const SoundSetupWizard = dynamic(() => import("@/components/todays-service/SoundSetupWizard"), { ssr: false });

type SoundSectionProps = {
  items: SoundItem[];
  mixers: Mixer[];
  soundComplete: boolean;
  setupTrigger?: number;
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onStartSoundSetup: () => void;
  onViewSound?: () => void;
};

const LIVE_LABELS: Record<string, string> = {
  offline: "Offline",
  connecting: "Connecting…",
  connected: "Connected",
  previewing: "Previewing",
  testing: "Testing…",
  needs_attention: "Needs Attention",
};

function formatTested(at: string | null): string {
  if (!at) return "Never tested";
  try {
    return new Date(at).toLocaleString();
  } catch {
    return at;
  }
}

export default function SoundSection({
  items,
  mixers,
  soundComplete,
  setupTrigger = 0,
  onReload,
  onToast,
  onStartSoundSetup,
  onViewSound,
}: SoundSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<SoundItem | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeviceId, setPreviewDeviceId] = useState<string | null>(null);
  const [levelsById, setLevelsById] = useState<Record<string, Record<string, unknown>>>({});
  const meterTimers = useRef<Record<string, number>>({});
  const browserMonitors = useRef<Record<string, { readLevels: () => Record<string, unknown>; stop: () => void }>>({});
  const editOpen = Boolean(editItem);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(editOpen, () => setEditItem(null));
  const { titleId: previewTitleId, panelRef: previewPanelRef, dialogProps: previewDialogProps } = useAccessibleModal(
    previewOpen,
    () => setPreviewOpen(false),
  );

  const primaryMixer = mixers[0];
  const micItems = items.filter((i) => i.category !== "mixer");
  const productionDevices = micItems.filter((i) => i.deviceId || i.mixerIp);
  const connectedMeterKey = items
    .filter((i) => i.category !== "mixer" && (i.deviceId || i.mixerIp) && i.liveStatus === "connected")
    .map((d) => `${d.id}:${extractBrowserDeviceId(d.deviceId) ?? d.mixerIp ?? ""}`)
    .sort()
    .join("|");
  const legacyItems = micItems.filter((i) => !i.deviceId && !i.mixerIp);
  const hasAnySound = micItems.length > 0 || mixers.length > 0;

  const openAdd = useCallback(() => setWizardOpen(true), []);
  useEffect(() => {
    if (setupTrigger > 0) openAdd();
  }, [setupTrigger, openAdd]);

  const pollLevels = useCallback(
    (item: SoundItem) => {
      if (meterTimers.current[item.id]) return;

      const browserDeviceId = extractBrowserDeviceId(item.deviceId);

      const tick = async () => {
        try {
          if (browserDeviceId) {
            const { openBrowserAudioMonitor } = await import("@/lib/sound/browser");
            if (!browserMonitors.current[item.id]) {
              browserMonitors.current[item.id] = await openBrowserAudioMonitor(browserDeviceId);
            }
            const levels = browserMonitors.current[item.id].readLevels();
            setLevelsById((prev) => ({ ...prev, [item.id]: levels }));
            return;
          }

          const levels = await readSoundLevelsApi(item.id);
          if (levels.clientMetering) return;
          if (levels.success) setLevelsById((prev) => ({ ...prev, [item.id]: levels }));
        } catch {
          /* ignore transient meter errors */
        }
      };

      void tick();
      meterTimers.current[item.id] = window.setInterval(() => void tick(), 500);
    },
    [],
  );

  useEffect(() => {
    const connected = productionDevices.filter((d) => d.liveStatus === "connected");
    for (const item of connected) {
      pollLevels(item);
    }
    return () => {
      Object.values(meterTimers.current).forEach((timer) => window.clearInterval(timer));
      meterTimers.current = {};
      Object.values(browserMonitors.current).forEach((monitor) => monitor.stop());
      browserMonitors.current = {};
    };
    // Re-run only when the connected meter device set changes — not on every dashboard reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedMeterKey, pollLevels]);

  useEffect(() => {
    if (!previewOpen || !previewDeviceId) return;
    let stream: MediaStream | null = null;
    void navigator.mediaDevices
      .getUserMedia({ audio: { deviceId: { exact: previewDeviceId } } })
      .then((s) => {
        stream = s;
      })
      .catch((err) => onToast("error", err instanceof Error ? err.message : "Preview failed."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [previewOpen, previewDeviceId, onToast]);

  const runTest = async (item: SoundItem) => {
    setBusy(true);
    try {
      let clientVerified = false;
      if (item.deviceId?.startsWith("browser://")) {
        const deviceId = item.deviceId.replace("browser://", "");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
          stream.getTracks().forEach((t) => t.stop());
          clientVerified = true;
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Microphone test failed.");
          return;
        }
      }
      const result = await testSoundDeviceApi(item.id, clientVerified);
      await onReload();
      onToast(result.success ? "success" : "error", result.message);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async (item: SoundItem) => {
    try {
      const result = await previewSoundDeviceApi(item.id);
      if (!result.success) {
        onToast("error", result.message);
        return;
      }
      if (result.previewMode === "browser" && result.deviceId) {
        setPreviewDeviceId(result.deviceId);
        setPreviewOpen(true);
      } else {
        onToast("success", result.message);
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Preview failed.");
    }
  };

  return (
    <ServiceCard
      title="Sound"
      action={
        <button type="button" onClick={openAdd} className={TS.addBtn}>
          + Add Sound Device
        </button>
      }
    >
      {hasAnySound ? (
        <>
          {primaryMixer ? (
            <div className="rounded-lg border border-white/8 bg-black/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SubLabel>Mixer Connection</SubLabel>
                  <p className="mt-2 font-body text-sm text-white">{primaryMixer.name}</p>
                  <p className="font-body text-xs text-white/50">
                    {primaryMixer.manufacturer ?? "Mixer"}
                    {primaryMixer.firmwareVersion ? ` · Firmware ${primaryMixer.firmwareVersion}` : ""}
                    {primaryMixer.channelCount ? ` · ${primaryMixer.channelCount} channels` : ""}
                    {primaryMixer.sceneName ? ` · Scene ${primaryMixer.sceneName}` : ""}
                  </p>
                  <p className="mt-1 font-ui text-[0.52rem] font-bold uppercase text-[#53fc18]">
                    {LIVE_LABELS[primaryMixer.liveStatus ?? "offline"] ?? volunteerStatusLabel(primaryMixer.connectionStatus as SoundItem["status"])}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {legacyItems.length > 0 ? (
            <>
              <SubLabel>Microphones &amp; Inputs</SubLabel>
              <div className="flex flex-col gap-1.5">
                {legacyItems.map((item) => (
                  <RowItem
                    key={item.id}
                    title={item.name}
                    subtitle={SOUND_CONNECTION_LABELS[item.connectionType] ?? item.deviceType ?? item.category}
                    statusText={volunteerStatusLabel(item.status)}
                    statusKind={
                      item.status === "ready" || item.status === "connected"
                        ? "healthy"
                        : item.status === "error"
                          ? "needs_attention"
                          : item.status
                    }
                    onEdit={() => { setEditItem(item); setEditName(item.name); }}
                    onDelete={() => setDeleteId(item.id)}
                    onTest={() => void runTest(item)}
                    testLabel="Test Audio"
                  />
                ))}
              </div>
            </>
          ) : null}

          {productionDevices.length > 0 ? (
            <>
              <SubLabel>Connected Devices</SubLabel>
              <ul className="flex flex-col gap-2">
                {productionDevices.map((item) => {
              const levels = levelsById[item.id] ?? item.levelsJson;
              return (
                <li key={item.id} className="rounded-lg border border-white/8 bg-black/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-body text-sm text-white">{item.name}</p>
                      <p className="font-body text-xs text-white/50">
                        {SOUND_CONNECTION_LABELS[item.connectionType] ?? item.connectionType}
                        {item.hardwareLabel ? ` · ${item.hardwareLabel}` : ""}
                      </p>
                      <p className="mt-1 font-body text-xs text-white/45">
                        {item.sampleRate ? `${item.sampleRate} Hz` : "—"}
                        {item.channelCount ? ` · ${item.channelCount} channels` : ""}
                      </p>
                      <p className="mt-1 font-ui text-[0.5rem] font-bold uppercase tracking-[0.08em] text-white/55">
                        {LIVE_LABELS[item.liveStatus] ?? item.liveStatus}
                        {" · "}
                        {volunteerStatusLabel(item.status)}
                      </p>
                      <p className="mt-1 font-body text-xs text-white/45">Last tested: {formatTested(item.lastTestedAt ?? item.lastSuccessfulTestAt ?? item.lastTestAt)}</p>
                      {item.lastErrorMessage ? <p className="mt-1 font-body text-xs text-amber-300">{item.lastErrorMessage}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <IconBtn icon={Pencil} label="Edit" onClick={() => { setEditItem(item); setEditName(item.name); }} />
                      <IconBtn icon={Eye} label="Preview Audio" onClick={() => void runPreview(item)} />
                      <IconBtn icon={Zap} label="Test Audio" onClick={() => void runTest(item)} />
                      <IconBtn icon={RefreshCw} label="Reconnect" onClick={async () => {
                        setBusy(true);
                        try {
                          const result = await reconnectSoundDeviceApi(item.id);
                          await onReload();
                          onToast(result.success ? "success" : "error", result.message);
                        } catch (err) {
                          onToast("error", err instanceof Error ? err.message : "Reconnect failed.");
                        } finally {
                          setBusy(false);
                        }
                      }} />
                      <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteId(item.id)} danger />
                    </div>
                  </div>
                  <SoundDeviceMeter className="mt-3" levels={levels} label="Live input meter" />
                </li>
              );
            })}
              </ul>
            </>
          ) : null}
        </>
      ) : (
        <GuidedEmptyState
          title="Let's get your sound ready."
          intro="Parable discovers real audio devices from your computer — USB mics, interfaces, and network mixers."
          bullets={[
            "Scan Windows WASAPI, macOS Core Audio, or ASIO devices",
            "Verify mixer communication over Ethernet when available",
            "Listen for real signal before marking ready",
          ]}
          actionLabel="Setup Sound"
          onAction={onStartSoundSetup}
          secondaryActionLabel="View Sound"
          onSecondaryAction={onViewSound}
        />
      )}

      {soundComplete ? <FooterLink onClick={onViewSound}>View Sound</FooterLink> : null}

      {wizardOpen ? (
        <SoundSetupWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSaved={onReload}
          onToast={onToast}
        />
      ) : null}

      {editOpen && editItem ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div ref={panelRef} {...dialogProps} className={`${TS.panel} w-full max-w-md rounded-xl p-5`}>
            <h2 id={titleId} className="font-headline text-lg uppercase tracking-[0.1em] text-white">Edit Sound Device</h2>
            <label className="mt-4 block">
              <span className={`mb-1 block ${TS.labelMuted}`}>Name</span>
              <input className={TS.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className={TS.btnPrimary}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await updateSoundDeviceApi(editItem.id, { name: editName });
                    await onReload();
                    setEditItem(null);
                    onToast("success", "Saved.");
                  } catch (err) {
                    onToast("error", err instanceof Error ? err.message : "Save failed.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save
              </button>
              <button type="button" className={TS.btnOutline} onClick={() => setEditItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div ref={previewPanelRef} {...previewDialogProps} className={`${TS.panel} w-full max-w-md rounded-xl p-5`}>
            <h2 id={previewTitleId} className="font-headline text-lg uppercase tracking-[0.1em] text-white">Preview Audio</h2>
            <p className="mt-2 font-body text-sm text-white/65">Listening through your computer&apos;s selected input.</p>
            <button type="button" className={`mt-4 ${TS.btnOutline}`} onClick={() => setPreviewOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}

      <DeleteConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Sound Item"
        message="Delete this sound item from today's service? This cannot be undone."
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          try {
            await deleteSoundDeviceApi(deleteId);
            await onReload();
            onToast("success", "Deleted.");
          } catch (err) {
            onToast("error", err instanceof Error ? err.message : "Delete failed.");
          } finally {
            setBusy(false);
            setDeleteId(null);
          }
        }}
        confirmLabel="Delete"
        onClose={() => setDeleteId(null)}
        confirming={busy}
      />
    </ServiceCard>
  );
}
