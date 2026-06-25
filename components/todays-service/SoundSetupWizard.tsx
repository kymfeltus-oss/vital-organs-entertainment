"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Mic } from "lucide-react";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import SoundDeviceMeter from "@/components/todays-service/sound/SoundDeviceMeter";
import {
  createSoundFromDiscoveryApi,
  discoverSoundDevicesApi,
  testDiscoveredSoundApi,
} from "@/lib/sound/api";
import {
  discoverBrowserAudioInputs,
  requestMicrophonePermission,
  runBrowserSignalTest,
} from "@/lib/sound/browser";
import type { DiscoveredSoundDevice, SoundLevelsSnapshot, SoundTestResult, SoundTestStep } from "@/lib/sound/types";

type SoundSetupWizardProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

type Step = "intro" | "permission_denied" | "scanning" | "select" | "testing" | "success" | "failed";

import { SOUND_CONNECTION_LABELS } from "@/lib/sound/labels";
import { SOUND_SETUP_SAVE_USER_MESSAGE } from "@/lib/sound/errors";

const CATEGORY_OPTIONS = [
  { value: "microphone", label: "Microphone" },
  { value: "pastor_mic", label: "Pastor Microphone" },
  { value: "choir_mic", label: "Choir Microphone" },
  { value: "band_input", label: "Band Input" },
  { value: "livestream_audio", label: "Livestream Audio" },
  { value: "recording_audio", label: "Recording Audio" },
  { value: "mixer", label: "Mixer" },
  { value: "other", label: "Other" },
];

const TROUBLESHOOTING = [
  "Confirm the microphone or interface is plugged in and powered on.",
  "Check OS sound settings — the input must not be muted and the correct device selected.",
  "If using a mixer, raise the channel fader and confirm phantom power for condenser mics.",
  "Close other apps that may be holding the microphone exclusively.",
  "Try a different USB port or cable, then run Test Again.",
];

export default function SoundSetupWizard({ open, onClose, onSaved, onToast }: SoundSetupWizardProps) {
  const [step, setStep] = useState<Step>("intro");
  const [devices, setDevices] = useState<DiscoveredSoundDevice[]>([]);
  const [scanMessage, setScanMessage] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [selected, setSelected] = useState<DiscoveredSoundDevice | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("microphone");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<SoundTestResult | null>(null);
  const [testSteps, setTestSteps] = useState<SoundTestStep[]>([]);
  const [liveLevels, setLiveLevels] = useState<SoundLevelsSnapshot | Record<string, unknown>>({});
  const testAbort = useRef(false);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  const resetState = useCallback(() => {
    testAbort.current = true;
    setStep("intro");
    setDevices([]);
    setScanMessage("");
    setPermissionMessage("");
    setSelected(null);
    setName("");
    setCategory("microphone");
    setTesting(false);
    setSaving(false);
    setTestResult(null);
    setTestSteps([]);
    setLiveLevels({});
  }, []);

  useEffect(() => {
    if (open) {
      testAbort.current = false;
      resetState();
      setStep("intro");
    } else {
      testAbort.current = true;
    }
  }, [open, resetState]);

  const runScan = useCallback(async () => {
    setStep("scanning");
    setScanMessage("Requesting microphone access…");
    testAbort.current = false;

    const permission = await requestMicrophonePermission();
    // #region agent log
    fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
      body: JSON.stringify({
        sessionId: "675ed0",
        location: "SoundSetupWizard.tsx:runScan",
        message: "permission result",
        data: { granted: permission.granted, denied: permission.denied },
        timestamp: Date.now(),
        hypothesisId: "H1-permission",
      }),
    }).catch(() => {});
    // #endregion
    if (!permission.granted) {
      setPermissionMessage(permission.message);
      setStep("permission_denied");
      return;
    }

    setScanMessage("Scanning for audio devices…");
    try {
      const browserDevices = await discoverBrowserAudioInputs(permission.defaultDeviceId);
      const result = await discoverSoundDevicesApi(browserDevices);
      setDevices(result.devices);
      setScanMessage(result.message);
      if (!result.devices.length) {
        onToast("error", result.message || "No audio devices found.");
        setStep("intro");
        return;
      }
      setStep("select");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Audio scan failed.";
      setScanMessage(message);
      onToast("error", message);
      setStep("intro");
    }
  }, [onToast]);

  const runTest = useCallback(async () => {
    if (!selected) return;
    testAbort.current = false;
    setTesting(true);
    setTestResult(null);
    setTestSteps([]);
    setLiveLevels({});
    setStep("testing");

    try {
      if (selected.browserDeviceId) {
        const result = await runBrowserSignalTest(selected.browserDeviceId, (levels) => {
          if (!testAbort.current) setLiveLevels(levels);
        });
        if (testAbort.current) return;
        setTestResult(result);
        setTestSteps(result.steps ?? []);
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
          body: JSON.stringify({
            sessionId: "675ed0",
            location: "SoundSetupWizard.tsx:runTest",
            message: "browser test complete",
            data: { success: result.success, signalPresent: result.levels?.signalPresent },
            timestamp: Date.now(),
            hypothesisId: "H2-test",
          }),
        }).catch(() => {});
        // #endregion
        setStep(result.success ? "success" : "failed");
        return;
      }

      const result = await testDiscoveredSoundApi(selected, false);
      if (testAbort.current) return;
      setTestResult(result);
      setTestSteps(result.steps ?? []);
      if (result.levels) setLiveLevels(result.levels);
      setStep(result.success ? "success" : "failed");
    } catch (err) {
      if (testAbort.current) return;
      const message = err instanceof Error ? err.message : "Audio test failed.";
      setTestResult({ success: false, message, steps: [] });
      setStep("failed");
      onToast("error", message);
    } finally {
      setTesting(false);
    }
  }, [selected, onToast]);

  const startTest = () => {
    setTesting(false);
    setStep("testing");
    void runTest();
  };

  const saveDevice = async () => {
    if (!selected || !testResult?.success) return;
    setSaving(true);
    try {
      const clientVerified = Boolean(selected.browserDeviceId);
      await createSoundFromDiscoveryApi(
        { name: name.trim() || selected.label, category, discoveredDeviceId: selected.id },
        selected,
        clientVerified,
        testResult,
      );
      // #region agent log
      fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "675ed0" },
        body: JSON.stringify({
          sessionId: "675ed0",
          location: "SoundSetupWizard.tsx:saveDevice",
          message: "device saved",
          data: { deviceId: selected.id, clientVerified },
          timestamp: Date.now(),
          hypothesisId: "H3-save",
        }),
      }).catch(() => {});
      // #endregion
      await onSaved();
      onToast("success", "Sound device saved.");
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : SOUND_SETUP_SAVE_USER_MESSAGE);
    } finally {
      setSaving(false);
    }
  };

  const selectDevice = (device: DiscoveredSoundDevice) => {
    setSelected(device);
    setName(device.label);
    setCategory(device.connectionType === "ethernet_mixer" ? "mixer" : "microphone");
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div
        ref={panelRef}
        {...dialogProps}
        className={`${TS.panel} flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl p-5`}
      >
        <h2 id={titleId} className="font-headline text-xl uppercase tracking-[0.08em] text-white">
          Add Sound Device
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {step === "intro" ? (
            <div className="mt-4 space-y-3">
              <p className="font-body text-sm leading-relaxed text-white/70">
                Parable will detect microphones, USB audio devices, audio interfaces, and supported mixers connected
                to this computer or network.
              </p>
              <p className="font-body text-sm text-white/55">
                You will grant microphone access so the browser can enumerate inputs and run a live audio test before
                saving.
              </p>
            </div>
          ) : null}

          {step === "permission_denied" ? (
            <div className="mt-4 space-y-3">
              <p className="font-body text-sm text-[#FF2FAF]">{permissionMessage}</p>
              <p className="font-body text-sm text-white/55">
                Allow microphone access in your browser address bar or system privacy settings, then try again.
              </p>
            </div>
          ) : null}

          {step === "scanning" ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#00A8FF]" aria-hidden />
              <p className="font-body text-sm text-white/65">{scanMessage}</p>
            </div>
          ) : null}

          {step === "select" ? (
            <div className="mt-4 space-y-3">
              <p className="font-body text-sm text-white/55">
                Choose the input you want to use for this service.
              </p>
              <div className="space-y-2">
                {devices.map((device) => {
                  const isSelected = selected?.id === device.id;
                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => selectDevice(device)}
                      className={`flex w-full flex-col rounded-lg border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[#00A8FF]/60 bg-[#00A8FF]/10"
                          : "border-white/10 bg-black/30 hover:border-[#00A8FF]/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-body text-sm text-white">{device.label}</span>
                        {device.isDefault ? (
                          <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 font-ui text-[0.5rem] font-bold uppercase tracking-[0.06em] text-[#00A8FF]">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-1 font-body text-xs text-white/45">
                        {SOUND_CONNECTION_LABELS[device.connectionType] ?? device.connectionType}
                        {device.manufacturer ? ` · ${device.manufacturer}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selected ? (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="block">
                    <span className={`mb-1 block ${TS.labelMuted}`}>Display name</span>
                    <input className={TS.input} value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className={`mb-1 block ${TS.labelMuted}`}>Type</span>
                    <select className={TS.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === "testing" ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-[#00A8FF]">
                <Mic className="h-4 w-4 shrink-0" aria-hidden />
                <p className="font-body text-sm">Speak into the microphone — measuring live audio…</p>
              </div>
              <SoundDeviceMeter levels={liveLevels} label="Live input" />
              <ul className="space-y-1">
                {testSteps.map((stepItem) => (
                  <li
                    key={stepItem.label}
                    className={`font-body text-sm ${stepItem.ok ? "text-[#53fc18]" : "text-white/55"}`}
                  >
                    {stepItem.ok ? "✓" : "○"} {stepItem.label}
                  </li>
                ))}
              </ul>
              {testing ? <Loader2 className="h-5 w-5 animate-spin text-[#00A8FF]" aria-hidden /> : null}
            </div>
          ) : null}

          {step === "success" ? (
            <div className="mt-4 space-y-3">
              <p className="font-headline text-lg uppercase tracking-[0.06em] text-[#53fc18]">✓ Audio detected</p>
              <p className="font-body text-sm text-white/70">Ready for Service</p>
              {selected ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="font-body text-sm text-white">{name.trim() || selected.label}</p>
                  <p className="mt-1 font-body text-xs text-white/50">
                    {SOUND_CONNECTION_LABELS[selected.connectionType]}
                    {selected.manufacturer ? ` · ${selected.manufacturer}` : ""}
                  </p>
                </div>
              ) : null}
              <SoundDeviceMeter levels={liveLevels} label="Test result" />
              <ul className="space-y-1">
                {testSteps.map((stepItem) => (
                  <li key={stepItem.label} className="font-body text-sm text-[#53fc18]">
                    ✓ {stepItem.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {step === "failed" ? (
            <div className="mt-4 space-y-3">
              <p className="font-body text-sm text-[#FF2FAF]">No audio detected.</p>
              {testResult?.guidance ? (
                <p className="font-body text-sm text-white/60">{testResult.guidance}</p>
              ) : null}
              <SoundDeviceMeter levels={liveLevels} label="Last reading" />
              <div>
                <p className={`mb-2 ${TS.labelMuted}`}>Troubleshooting</p>
                <ul className="list-disc space-y-1 pl-5 font-body text-sm text-white/55">
                  {TROUBLESHOOTING.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {step === "intro" ? (
            <>
              <button type="button" onClick={() => void runScan()} className={TS.btnPrimary}>
                Start Scan
              </button>
              <button type="button" onClick={onClose} className={TS.btnOutline}>
                Cancel
              </button>
            </>
          ) : null}

          {step === "permission_denied" ? (
            <>
              <button type="button" onClick={() => void runScan()} className={TS.btnPrimary}>
                Try Again
              </button>
              <button type="button" onClick={onClose} className={TS.btnOutline}>
                Cancel
              </button>
            </>
          ) : null}

          {step === "select" ? (
            <>
              <button
                type="button"
                disabled={!selected || !name.trim()}
                onClick={startTest}
                className={TS.btnPrimary}
              >
                Test Microphone
              </button>
              <button type="button" onClick={() => setStep("intro")} className={TS.btnOutline}>
                Back
              </button>
              <button type="button" onClick={onClose} className={TS.btnOutline}>
                Cancel
              </button>
            </>
          ) : null}

          {step === "success" ? (
            <>
              <button type="button" disabled={saving} onClick={() => void saveDevice()} className={TS.btnPrimary}>
                {saving ? "Saving…" : "Save Device"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={startTest}
                className={TS.btnOutline}
              >
                Test Again
              </button>
              <button type="button" disabled={saving} onClick={onClose} className={TS.btnOutline}>
                Cancel
              </button>
            </>
          ) : null}

          {step === "failed" ? (
            <>
              <button type="button" onClick={startTest} className={TS.btnPrimary}>
                Test Again
              </button>
              <button type="button" onClick={() => setStep("select")} className={TS.btnOutline}>
                Choose Different Device
              </button>
              <button type="button" onClick={onClose} className={TS.btnOutline}>
                Cancel
              </button>
            </>
          ) : null}

          {step === "testing" ? (
            <button
              type="button"
              onClick={() => {
                testAbort.current = true;
                setTesting(false);
                setStep("select");
              }}
              className={TS.btnOutline}
            >
              Cancel
            </button>
          ) : null}

          {step === "scanning" ? (
            <button type="button" onClick={onClose} className={TS.btnOutline}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
