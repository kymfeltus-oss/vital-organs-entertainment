"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, RefreshCw, Video } from "lucide-react";
import { TS } from "@/components/todays-service/ServiceUi";
import {
  createCameraFromDiscoveryApi,
  discoverCamerasApi,
  testDiscoveredCameraApi,
} from "@/lib/cameras/api";
import { discoverBrowserCameras, testBrowserCamera } from "@/lib/cameras/browser";
import type { DiscoveredCamera } from "@/lib/cameras/types";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";

type CameraSetupWizardProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

type Step = "scan" | "select" | "preview" | "details" | "test";

const CONNECTION_LABELS: Record<string, string> = {
  usb: "USB Camera",
  capture_card: "Capture Card",
  network: "Network Camera",
  built_in: "Built-in Camera",
};

export default function CameraSetupWizard({ open, onClose, onSaved, onToast }: CameraSetupWizardProps) {
  const [step, setStep] = useState<Step>("scan");
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredCamera[]>([]);
  const [scanMessage, setScanMessage] = useState("");
  const [selected, setSelected] = useState<DiscoveredCamera | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [cameraType, setCameraType] = useState("fixed");
  const [networkPassword, setNetworkPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const runScan = useCallback(async () => {
    setScanning(true);
    setScanMessage("Looking for cameras…");
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const temp = await navigator.mediaDevices.getUserMedia({ video: true });
        temp.getTracks().forEach((t) => t.stop());
      }
      const browserDevices = await discoverBrowserCameras();
      const result = await discoverCamerasApi(browserDevices);
      setDevices(result.devices);
      setScanMessage(result.message);
      setStep(result.devices.length ? "select" : "scan");
      if (!result.devices.length) {
        onToast("error", result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera scan failed.";
      setScanMessage(message);
      onToast("error", message);
    } finally {
      setScanning(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (open) {
      setStep("scan");
      setSelected(null);
      setName("");
      setLocation("");
      setCameraType("fixed");
      setNetworkPassword("");
      setTestMessage(null);
      void runScan();
    } else {
      stopPreview();
    }
    return () => stopPreview();
  }, [open, runScan, stopPreview]);

  useEffect(() => {
    if (step !== "preview" || !selected?.browserDeviceId) return;
    let cancelled = false;
    setPreviewError(null);
    stopPreview();

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selected.browserDeviceId! } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Could not open camera preview.");
      }
    })();

    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [step, selected, stopPreview]);

  const runTest = async () => {
    if (!selected) return;
    setTesting(true);
    setTestMessage(null);
    try {
      let clientVerified = false;
      if (selected.browserDeviceId) {
        const browserTest = await testBrowserCamera(selected.browserDeviceId);
        if (!browserTest.success) {
          setTestMessage(browserTest.message);
          onToast("error", browserTest.message);
          return;
        }
        clientVerified = true;
      } else {
        const result = await testDiscoveredCameraApi(selected, networkPassword || null);
        setTestMessage(result.message);
        if (!result.success) {
          onToast("error", result.message);
          return;
        }
      }
      setSaving(true);
      await createCameraFromDiscoveryApi(
        {
          name: name.trim() || selected.label,
          location,
          cameraType,
          connectionType: selected.connectionType,
          discoveredDeviceId: selected.id,
          networkPassword: networkPassword || undefined,
          networkUrl: selected.networkUrl ?? undefined,
        },
        selected,
        clientVerified,
      );
      await onSaved();
      onToast("success", "Camera saved.");
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Test failed.");
    } finally {
      setTesting(false);
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
      <div ref={panelRef} {...dialogProps} className={`${TS.panel} flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl`}>
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id={titleId} className="font-headline text-xl uppercase tracking-[0.08em] text-white">
            Connect Camera
          </h2>
          <p className="mt-1 font-body text-sm text-white/55">
            {step === "scan" && "Scanning USB, capture card, and network cameras…"}
            {step === "select" && "Choose the camera you want to use for today's service."}
            {step === "preview" && "Confirm the live picture looks correct."}
            {step === "details" && "Name this camera and where it is used."}
            {step === "test" && "Test the connection before saving."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === "scan" ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              {scanning ? <Loader2 className="h-10 w-10 animate-spin text-[#00f2ff]" /> : <Camera className="h-10 w-10 text-white/40" />}
              <p className="font-body text-sm text-white/70">{scanMessage}</p>
              {!scanning ? (
                <button type="button" onClick={() => void runScan()} className={TS.btnPrimary}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Scan Again
                </button>
              ) : null}
            </div>
          ) : null}

          {step === "select" ? (
            <div className="grid gap-2">
              {devices.map((device) => (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => {
                    setSelected(device);
                    setName(device.label);
                    setStep(device.browserDeviceId || device.connectionType === "network" ? "preview" : "details");
                  }}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-left transition hover:border-[#00f2ff]/40"
                >
                  <Video className="h-5 w-5 shrink-0 text-[#00f2ff]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm text-white">{device.label}</p>
                    <p className="font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/45">
                      {CONNECTION_LABELS[device.connectionType] ?? device.connectionType}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {step === "preview" ? (
            <div className="space-y-3">
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                {selected?.browserDeviceId ? (
                  <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
                ) : selected?.networkUrl ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                    <p className="font-body text-sm text-white/70">Network camera</p>
                    <p className="font-mono text-xs text-[#00f2ff]">{selected.networkUrl}</p>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center font-body text-sm text-white/50">
                    Hardware preview uses the production agent after save.
                  </div>
                )}
              </div>
              {previewError ? <p className="font-body text-sm text-red-300">{previewError}</p> : null}
            </div>
          ) : null}

          {(step === "details" || step === "test") && selected ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="font-ui text-[0.5rem] uppercase tracking-[0.1em] text-white/45">Camera Name</span>
                <input className={`${TS.input} mt-1 w-full`} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="font-ui text-[0.5rem] uppercase tracking-[0.1em] text-white/45">Location</span>
                <input className={`${TS.input} mt-1 w-full`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Center stage" />
              </label>
              <label className="block">
                <span className="font-ui text-[0.5rem] uppercase tracking-[0.1em] text-white/45">Type</span>
                <select className={`${TS.input} mt-1 w-full`} value={cameraType} onChange={(e) => setCameraType(e.target.value)}>
                  <option value="fixed">Fixed</option>
                  <option value="ptz">Movable (PTZ)</option>
                  <option value="remote">Remote</option>
                </select>
              </label>
              {selected.connectionType === "network" ? (
                <label className="block md:col-span-2">
                  <span className="font-ui text-[0.5rem] uppercase tracking-[0.1em] text-white/45">Password (optional)</span>
                  <input type="password" className={`${TS.input} mt-1 w-full`} value={networkPassword} onChange={(e) => setNetworkPassword(e.target.value)} />
                </label>
              ) : null}
              {testMessage ? <p className="md:col-span-2 font-body text-sm text-white/70">{testMessage}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" onClick={onClose} className={TS.btnOutline}>Cancel</button>
          {step === "select" ? (
            <button type="button" onClick={() => void runScan()} className={TS.btnOutline}>
              Scan Again
            </button>
          ) : null}
          {step === "preview" ? (
            <button type="button" onClick={() => setStep("details")} className={TS.btnPrimary}>Continue</button>
          ) : null}
          {step === "details" ? (
            <>
              <button type="button" onClick={() => setStep(selected?.browserDeviceId ? "preview" : "select")} className={TS.btnOutline}>Back</button>
              <button type="button" disabled={!name.trim()} onClick={() => { setStep("test"); void runTest(); }} className={TS.btnPrimary}>
                {testing || saving ? "Working…" : "Test & Save Camera"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
