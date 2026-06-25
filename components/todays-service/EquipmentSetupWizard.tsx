"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EquipmentConnectionSteps } from "@/components/todays-service/equipment-setup/EquipmentConnectionSteps";
import EquipmentOnboardingProgress from "@/components/todays-service/equipment-setup/EquipmentOnboardingProgress";
import { TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import {
  connectEthernetMixerApi,
  connectMixerApi,
  connectUsbMixerApi,
  createSoundItemApi,
  fetchLastConnectedMixerApi,
  importMixerApi,
  mixerAudioDetectionApi,
  mixerAutoCheckApi,
  mixerHealthCheckApi,
  patchEquipmentProfileApi,
  scanEthernetMixersApi,
  scanUsbMixersApi,
  testEthernetMixerApi,
} from "@/lib/todays-service/api";
import {
  EQUIPMENT_WIZARD_STEPS,
  EQUIPMENT_WIZARD_TOTAL_STEPS,
  equipmentStepLabel,
  isDevelopmentEnvironment,
  TEST_PROGRESS_STEPS,
} from "@/lib/todays-service/equipment-setup";
import {
  estimateMixerWizardMinutesRemaining,
  nextStepAfterConnectionSummary,
  previousStepFromConfigureInputs,
  previousStepFromHealthCheck,
  shouldShowMixerImportStep,
  shouldSkipConnectionTypeStep,
  type TenantEquipmentProfile,
} from "@/lib/todays-service/equipment-onboarding";
import {
  ETHERNET_SCAN_PROGRESS,
  type MixerAutoCheckResult,
  type MixerConnectionTypeChoice,
  type UsbAudioDevice,
} from "@/lib/todays-service/mixer-connection";
import { scanUsbAudioDevices } from "@/lib/todays-service/usb-audio-scan";
import type { MixerConnectionType } from "@/lib/todays-service/types";
import {
  DEFAULT_MIXER_CONNECTION_CONFIG,
  mixerChoiceToType,
  type LastConnectedMixer,
  type MixerAudioDetectionResult,
  type MixerHealthCheckResult,
  type MixerImportOptions,
  type MixerScanResult,
  type MixerTestResult,
} from "@/lib/todays-service/mixer-types";
import type { Mixer } from "@/lib/todays-service/types";
import {
  defaultMixerName,
  MIXER_IMPORT_OPTIONS,
  MIXER_OPTION_META,
  mixerChoiceNeedsConnectionForm,
  SOUND_SOURCE_PRESETS,
  type MixerChoice,
} from "@/lib/todays-service/sound-setup";

type EquipmentSetupWizardProps = {
  open: boolean;
  mixers: Mixer[];
  existingSoundItems: string[];
  equipmentProfile: TenantEquipmentProfile | null;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onContinueToCameraSetup: () => void;
};

type ScanPhase = "idle" | "searching" | "results" | "none";

const ALL_IMPORT_OPTIONS: MixerImportOptions = {
  channelNames: true,
  channelLabels: true,
  userLabels: true,
  routing: true,
  scenes: true,
  dcaGroups: true,
  muteGroups: true,
};

function useProgressIndex(steps: readonly string[], active: boolean, intervalMs = 450): number {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (!active) {
      setIndex(-1);
      return;
    }
    setIndex(0);
    const timer = setInterval(() => {
      setIndex((current) => (current >= steps.length - 1 ? current : current + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [active, steps, intervalMs]);
  return index;
}

function DevelopmentModePanel({
  panel,
  onContinue,
  onRetry,
  busy,
}: {
  panel: NonNullable<MixerTestResult["developmentPanel"]>;
  onContinue: () => void;
  onRetry: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#00f2ff]/30 bg-[#00f2ff]/5 p-3">
      <p className="font-headline text-sm uppercase tracking-[0.08em] text-[#00f2ff]">{panel.title}</p>
      <p className="mt-2 font-body text-sm text-white/75">{panel.message}</p>
      {panel.bullets?.length ? (
        <>
          <p className="mt-3 font-body text-xs text-white/55">You can:</p>
          <ul className="mt-1 list-inside list-disc font-body text-xs text-white/55">
            {panel.bullets.slice(1).map((bullet) => (
              <li key={bullet}>{bullet.replace(/^You can:\s*/i, "")}</li>
            ))}
          </ul>
        </>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={onContinue} className={TS.btnPrimary}>
          Continue
        </button>
        <button type="button" disabled={busy} onClick={onRetry} className={TS.btnOutline}>
          Retry
        </button>
      </div>
    </div>
  );
}

export default function EquipmentSetupWizard({
  open,
  mixers,
  existingSoundItems,
  equipmentProfile,
  onClose,
  onSaved,
  onToast,
  onContinueToCameraSetup,
}: EquipmentSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [mixerChoice, setMixerChoice] = useState<MixerChoice | "">("");
  const [mixerName, setMixerName] = useState("");
  const [mixerIp, setMixerIp] = useState("");
  const [connectionConfig, setConnectionConfig] = useState(DEFAULT_MIXER_CONNECTION_CONFIG);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    () => new Set(SOUND_SOURCE_PRESETS.map((item) => item.label)),
  );
  const [importOptions, setImportOptions] = useState<MixerImportOptions>(ALL_IMPORT_OPTIONS);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [mixerConnected, setMixerConnected] = useState(false);
  const [testResult, setTestResult] = useState<MixerTestResult | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const [scanResult, setScanResult] = useState<MixerScanResult | null>(null);
  const [lastConnected, setLastConnected] = useState<LastConnectedMixer | null>(null);
  const [healthResult, setHealthResult] = useState<MixerHealthCheckResult | null>(null);
  const [audioResult, setAudioResult] = useState<MixerAudioDetectionResult | null>(null);
  const [healthRunning, setHealthRunning] = useState(false);
  const [audioRunning, setAudioRunning] = useState(false);
  const [healthRan, setHealthRan] = useState(false);
  const [manualSetupReady, setManualSetupReady] = useState(false);
  const [connectionTypeChoice, setConnectionTypeChoice] = useState<MixerConnectionTypeChoice | "">("");
  const [savedConnectionType, setSavedConnectionType] = useState<MixerConnectionType>("unknown");
  const [showManualIp, setShowManualIp] = useState(false);
  const [usbDevice, setUsbDevice] = useState<UsbAudioDevice | null>(null);
  const [autoCheckResult, setAutoCheckResult] = useState<MixerAutoCheckResult | null>(null);
  const [autoChecking, setAutoChecking] = useState(false);
  const [rememberConnectionChoice, setRememberConnectionChoice] = useState(true);
  const wasOpenRef = useRef(false);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  const primaryMixer = mixers[0];
  const isDevelopmentMode =
    isDevelopmentEnvironment() && manualSetupReady && !mixerConnected;
  const showImportStep = shouldShowMixerImportStep({
    mixerConnected,
    manualSetupReady,
    connectionStatus: primaryMixer?.connectionStatus,
    isDevelopmentMode,
  });
  const supportsNetworkConnect = mixerChoiceNeedsConnectionForm(mixerChoice);
  const mixerType = mixerChoice ? mixerChoiceToType(mixerChoice) : "behringer_x32";
  const completedSections = equipmentProfile?.onboarding.completedSections ?? [];
  const scanProgressIndex = useProgressIndex(ETHERNET_SCAN_PROGRESS, scanning);
  const testProgressIndex = useProgressIndex(TEST_PROGRESS_STEPS, testing);

  const persistOnboarding = useCallback(
    (wizardStep: number, extra?: Record<string, unknown>) => {
      void patchEquipmentProfileApi({
        onboarding: {
          currentSection: "mixer",
          mixerWizardStep: wizardStep,
          completedSections,
          ...extra,
        },
      }).catch(() => {});
    },
    [completedSections],
  );

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const resumeStep = equipmentProfile?.onboarding.mixerWizardStep;
      const canResume = resumeStep && resumeStep > 1 && resumeStep <= EQUIPMENT_WIZARD_TOTAL_STEPS;
      setStep(canResume ? resumeStep : 1);
      setRememberConnectionChoice(equipmentProfile?.rememberConnectionChoice ?? true);
      if (equipmentProfile?.preferredConnectionType && shouldSkipConnectionTypeStep(equipmentProfile)) {
        setConnectionTypeChoice(equipmentProfile.preferredConnectionType);
      }
      setMixerChoice("");
      setMixerName("");
      setMixerIp("");
      setConnectionConfig(DEFAULT_MIXER_CONNECTION_CONFIG);
      setSelectedSources(new Set(SOUND_SOURCE_PRESETS.map((item) => item.label)));
      setImportOptions(ALL_IMPORT_OPTIONS);
      setShowImportOptions(false);
      setMixerConnected(false);
      setTestResult(null);
      setScanPhase("idle");
      setScanResult(null);
      setHealthResult(null);
      setAudioResult(null);
      setHealthRan(false);
      setManualSetupReady(false);
      setConnectionTypeChoice("");
      setSavedConnectionType("unknown");
      setShowManualIp(false);
      setUsbDevice(null);
      setAutoCheckResult(null);
      setAutoChecking(false);
      void fetchLastConnectedMixerApi().then(setLastConnected).catch(() => setLastConnected(null));
    }
    wasOpenRef.current = open;
  }, [open, mixers, equipmentProfile]);

  useEffect(() => {
    if (open) persistOnboarding(step);
  }, [open, step, persistOnboarding]);

  const runHealthAndAudio = useCallback(async () => {
    setHealthRunning(true);
    setHealthResult(null);
    try {
      const health = await mixerHealthCheckApi({
        mixerId: mixers[0]?.id,
        ipAddress: mixerIp.trim() || undefined,
        mixerType,
        connectionConfig,
        connectionType: savedConnectionType,
        usbDeviceName: usbDevice?.label ?? null,
      });
      setHealthResult(health);
    } finally {
      setHealthRunning(false);
    }

    const runNetworkAudio =
      (savedConnectionType === "ethernet" || savedConnectionType === "both") && Boolean(mixerIp.trim());

    if (runNetworkAudio) {
      setAudioRunning(true);
      setAudioResult(null);
      try {
        const audio = await mixerAudioDetectionApi({ ipAddress: mixerIp.trim(), mixerType, connectionConfig });
        setAudioResult(audio);
      } finally {
        setAudioRunning(false);
      }
    } else {
      setAudioResult(null);
    }

    setHealthRan(true);
  }, [connectionConfig, mixerIp, mixerType, savedConnectionType, usbDevice]);

  useEffect(() => {
    if (open && step === 3 && shouldSkipConnectionTypeStep(equipmentProfile) && equipmentProfile?.preferredConnectionType) {
      setConnectionTypeChoice(equipmentProfile.preferredConnectionType);
      setStep(4);
    }
  }, [open, step, equipmentProfile]);

  useEffect(() => {
    if (step === 6 && !showImportStep) setStep(8);
    if (step === 7 && !showImportStep) setStep(8);
  }, [step, showImportStep]);

  useEffect(() => {
    if (step === 8 && isDevelopmentMode && !healthRan) {
      setHealthRan(true);
      return;
    }
    if (step === 8 && !healthRan && !healthRunning && !audioRunning && !isDevelopmentMode) {
      void runHealthAndAudio();
    }
  }, [step, healthRan, healthRunning, audioRunning, runHealthAndAudio, isDevelopmentMode]);

  if (!open) return null;

  const currentStepMeta = EQUIPMENT_WIZARD_STEPS.find((s) => s.number === step);
  const timeRemainingLabel = estimateMixerWizardMinutesRemaining(step, !showImportStep);
  const summaryBackStep = !supportsNetworkConnect && !connectionTypeChoice ? 2 : 4;

  const handleTestConnection = async () => {
    if (!mixerIp.trim()) {
      onToast("error", "Enter your mixer IP address first.");
      return;
    }
    setBusy(true);
    setTesting(true);
    setTestResult(null);
    setScanPhase("idle");
    try {
      const result = await testEthernetMixerApi({ ipAddress: mixerIp.trim(), mixerType, connectionConfig });
      setTestResult(result);
      const connected = result.success;
      setMixerConnected(connected);
      if (connected) {
        await connectEthernetMixerApi({
          mixerId: mixers[0]?.id,
          name: mixerName.trim() || defaultMixerName(mixerChoice),
          ipAddress: mixerIp.trim(),
          mixerType,
          connectionConfig,
        });
        setSavedConnectionType("ethernet");
        await onSaved();
        setStep(5);
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Connection test failed.");
    } finally {
      setTesting(false);
      setBusy(false);
    }
  };

  const handleAutoDetect = async () => {
    setBusy(true);
    setScanning(true);
    setScanPhase("searching");
    setScanResult(null);
    setTestResult(null);
    try {
      const result = await scanEthernetMixersApi({ mixerType });
      setScanResult(result);
      setScanPhase(result.mixers.length > 0 ? "results" : "none");
    } catch {
      setScanPhase("none");
      onToast("error", "Could not scan for mixers.");
    } finally {
      setScanning(false);
      setBusy(false);
    }
  };

  const useScannedMixer = async (ip: string, name: string) => {
    setMixerIp(ip);
    setMixerName(name);
    setScanPhase("idle");
    setBusy(true);
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testEthernetMixerApi({ ipAddress: ip, mixerType, connectionConfig });
      setTestResult(result);
      if (result.success) {
        setMixerConnected(true);
        await connectEthernetMixerApi({
          mixerId: mixers[0]?.id,
          name: name.trim() || defaultMixerName(mixerChoice),
          ipAddress: ip,
          mixerType,
          connectionConfig,
        });
        setSavedConnectionType("ethernet");
        await onSaved();
        setStep(5);
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not connect to mixer.");
    } finally {
      setTesting(false);
      setBusy(false);
    }
  };

  const handleScanUsb = async () => {
    setBusy(true);
    setScanPhase("idle");
    setUsbDevice(null);
    try {
      const localDevices = await scanUsbAudioDevices();
      const result = await scanUsbMixersApi({ devices: localDevices });
      const devices = result.devices.length > 0 ? result.devices : localDevices;
      if (devices.length > 0) {
        setUsbDevice(devices[0]);
      } else {
        setScanPhase("none");
      }
    } catch {
      setScanPhase("none");
      onToast("error", "Could not scan USB audio devices.");
    } finally {
      setBusy(false);
    }
  };

  const handleUseUsbDevice = async (alsoEthernet = false) => {
    if (!usbDevice) return;
    setBusy(true);
    try {
      const result = await connectUsbMixerApi({
        mixerId: mixers[0]?.id,
        name: mixerName.trim() || defaultMixerName(mixerChoice),
        mixerType,
        usbDeviceName: usbDevice.label,
        usbDeviceId: usbDevice.deviceId,
      });
      if (!result.success) {
        onToast("error", result.message);
        return;
      }
      setMixerConnected(true);
      setSavedConnectionType(alsoEthernet ? "both" : "usb");
      await onSaved();
      if (alsoEthernet) {
        setConnectionTypeChoice("ethernet");
        setShowManualIp(false);
        setStep(4);
      } else {
        setStep(5);
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not save USB connection.");
    } finally {
      setBusy(false);
    }
  };

  const handleAutoCheck = async () => {
    setAutoChecking(true);
    setAutoCheckResult(null);
    setBusy(true);
    try {
      const localDevices = await scanUsbAudioDevices();
      const result = await mixerAutoCheckApi({ mixerType, usbDevices: localDevices });
      setAutoCheckResult(result);
      if (result.ethernetMixer) {
        setMixerIp(result.ethernetMixer.ipAddress);
        setMixerName(`${result.ethernetMixer.manufacturer} ${result.ethernetMixer.model}`.trim());
      }
      if (result.usbDevice) {
        setUsbDevice(result.usbDevice);
      }
    } catch {
      onToast("error", "Auto check could not complete.");
      setAutoCheckResult({
        success: false,
        ethernetFound: false,
        usbFound: false,
        recommended: null,
        message: "We could not find the mixer yet.",
      });
    } finally {
      setAutoChecking(false);
      setBusy(false);
    }
  };

  const handleManualSetup = () => {
    setManualSetupReady(true);
    setSavedConnectionType("manual");
    setMixerConnected(false);
    setStep(5);
  };

  const handleSwitchToEthernet = () => {
    setConnectionTypeChoice("ethernet");
    setUsbDevice(null);
    setScanPhase("idle");
    setShowManualIp(false);
  };

  const applyAutoCheckConnection = async () => {
    if (autoCheckResult?.ethernetFound && autoCheckResult.ethernetMixer) {
      await useScannedMixer(autoCheckResult.ethernetMixer.ipAddress, autoCheckResult.ethernetMixer.model);
      return;
    }
    if (autoCheckResult?.usbFound && usbDevice) {
      await handleUseUsbDevice(false);
      return;
    }
    handleManualSetup();
  };

  const resolveMixerIp = (): string =>
    mixerIp.trim() || mixers[0]?.ipAddress?.trim() || lastConnected?.ipAddress?.trim() || "";

  const canImport = mixerConnected || manualSetupReady || Boolean(resolveMixerIp());

  const handleImport = async (options: MixerImportOptions) => {
    const ip = resolveMixerIp();
    if (!ip) {
      onToast("error", "Enter your mixer IP address on the Connect step, or use Last Connection.");
      return;
    }

    setBusy(true);
    try {
      const result = await importMixerApi({
        mixerId: mixers[0]?.id ?? lastConnected?.mixerId,
        ipAddress: ip,
        mixerType,
        name: mixerName.trim() || defaultMixerName(mixerChoice),
        options,
      });

      if (!result.success) {
        onToast("error", result.message);
        return;
      }

      await onSaved();
      onToast("success", result.message);
      setStep(7);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartFresh = async () => {
    setBusy(true);
    try {
      if (mixerIp.trim()) {
        await connectMixerApi({
          mixerId: mixers[0]?.id,
          name: mixerName.trim() || defaultMixerName(mixerChoice),
          ipAddress: mixerIp.trim(),
          mixerType,
          connectionConfig,
        });
        await onSaved();
      }
      setStep(7);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not save mixer connection.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinueToCameraSetup = async () => {
    setBusy(true);
    try {
      for (const preset of SOUND_SOURCE_PRESETS) {
        if (!selectedSources.has(preset.label)) continue;
        if (existingSoundItems.includes(preset.label)) continue;
        await createSoundItemApi({ category: preset.category, name: preset.label });
      }
      const nextCompleted = [...new Set([...completedSections, "mixer" as const])];
      await patchEquipmentProfileApi({
        onboarding: {
          currentSection: "camera",
          mixerWizardStep: 1,
          completedSections: nextCompleted,
        },
      });
      await onSaved();
      onToast("success", "Equipment setup saved.");
      onContinueToCameraSetup();
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not save equipment setup.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSource = (label: string) => {
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleImportOption = (key: keyof MixerImportOptions) => {
    setImportOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveConnectionPreference = async () => {
    if (!connectionTypeChoice) return;
    try {
      await patchEquipmentProfileApi({
        preferredConnectionType: rememberConnectionChoice ? connectionTypeChoice : null,
        rememberConnectionChoice,
        onboarding: { currentSection: "mixer", mixerWizardStep: 4 },
      });
    } catch {
      /* profile table may not exist yet */
    }
  };

  const advanceFromSummary = () => {
    const next = nextStepAfterConnectionSummary(showImportStep);
    setStep(next);
    if (!showImportStep) setHealthRan(false);
  };

  const goNextFromMixerSelect = () => {
    if (!mixerChoice) return;
    setMixerName(defaultMixerName(mixerChoice));
    if (!supportsNetworkConnect) {
      setSavedConnectionType("manual");
      setManualSetupReady(true);
      setStep(5);
      return;
    }
    if (shouldSkipConnectionTypeStep(equipmentProfile) && equipmentProfile?.preferredConnectionType) {
      setConnectionTypeChoice(equipmentProfile.preferredConnectionType);
      setStep(4);
      return;
    }
    setConnectionTypeChoice("ethernet");
    setStep(3);
  };

  const renderUnavailable = (result: MixerTestResult) => {
    if (result.developmentPanel) {
      return (
        <DevelopmentModePanel
          panel={result.developmentPanel}
          busy={busy}
          onContinue={() => {
            setManualSetupReady(true);
            setSavedConnectionType("manual");
            setStep(5);
          }}
          onRetry={() => void handleTestConnection()}
        />
      );
    }
    if (result.productionPanel || result.troubleshooting) {
      const bullets = result.productionPanel?.bullets ?? result.troubleshooting?.bullets ?? [];
      return (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
          <p className="font-body text-sm text-white/85">{result.productionPanel?.title ?? result.troubleshooting?.title}</p>
          <p className="mt-2 font-body text-xs text-white/55">Things to check:</p>
          <ul className="mt-1 space-y-1">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 font-body text-xs text-white/55">
                <span className="text-[#53fc18]">✓</span>
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void handleTestConnection()} className={TS.btnOutline}>
              Try Again
            </button>
            <button type="button" disabled={busy} onClick={() => void handleAutoDetect()} className={TS.btnOutline}>
              Auto Detect
            </button>
            <button type="button" disabled={busy} onClick={() => { setManualSetupReady(true); setSavedConnectionType("manual"); setStep(5); }} className={TS.btnOutline}>
              Manual Setup
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div ref={panelRef} {...dialogProps} className={`${TS.panel} flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl p-5`}>
        <h2 id={titleId} className="sr-only">
          Equipment setup wizard
        </h2>
        <EquipmentOnboardingProgress currentSection="mixer" completedSections={completedSections} />
        <p className="mt-3 font-ui text-[0.5rem] uppercase tracking-[0.12em] text-[#00f2ff]">
          Step {step} of {EQUIPMENT_WIZARD_TOTAL_STEPS}
        </p>
        <p className="mt-0.5 font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/40">
          {currentStepMeta?.label ?? equipmentStepLabel(step)}
        </p>
        <p className="mt-1 font-body text-xs text-white/45">{timeRemainingLabel}</p>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 ? (
            <>
              <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Welcome</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/65">
                Parable will walk you through setting up your church production equipment — starting with your mixer
                and inputs. Plain steps, no engineering jargon.
              </p>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Choose Mixer</h2>
              <fieldset className="mt-4 space-y-2" disabled={busy}>
                {MIXER_OPTION_META.map((meta) => (
                  <label
                    key={meta.id}
                    className={`block cursor-pointer rounded-lg border px-3 py-2.5 transition ${
                      mixerChoice === meta.id
                        ? "border-[#00f2ff]/50 bg-[#00f2ff]/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="mixerChoice"
                        checked={mixerChoice === meta.id}
                        onChange={() => setMixerChoice(meta.id)}
                        className="mt-1 accent-[#00f2ff]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.1em] ${meta.brandStyle}`}>
                            {meta.brandLabel}
                          </span>
                          <span className="font-body text-sm text-white">{meta.id}</span>
                          {meta.recommended ? (
                            <span className="rounded-full border border-[#53fc18]/40 bg-[#53fc18]/10 px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-[#53fc18]">
                              ⭐ Recommended
                            </span>
                          ) : null}
                        </span>
                        {meta.helper ? <span className="mt-1 block font-body text-xs text-white/55">{meta.helper}</span> : null}
                        {meta.subtitle ? <span className="mt-1 block font-body text-xs text-[#00f2ff]/80">{meta.subtitle}</span> : null}
                      </span>
                    </div>
                  </label>
                ))}
              </fieldset>
              <p className="mt-4 font-body text-xs leading-relaxed text-white/50">
                Not sure which mixer you have? Choose &quot;I&apos;m not sure&quot; and Parable will help you identify it.
              </p>
            </>
          ) : null}

          {(step === 3 || step === 4 || step === 5) ? (
            <EquipmentConnectionSteps
              step={step}
              mixerChoice={mixerChoice}
              connectionTypeChoice={connectionTypeChoice}
              setConnectionTypeChoice={setConnectionTypeChoice}
              savedConnectionType={savedConnectionType}
              showManualIp={showManualIp}
              setShowManualIp={setShowManualIp}
              mixerName={mixerName}
              setMixerName={setMixerName}
              mixerIp={mixerIp}
              setMixerIp={setMixerIp}
              busy={busy}
              scanning={scanning}
              testing={testing}
              scanPhase={scanPhase}
              scanResult={scanResult}
              testResult={testResult}
              usbDevice={usbDevice}
              autoCheckResult={autoCheckResult}
              autoChecking={autoChecking}
              scanProgressIndex={scanProgressIndex}
              testProgressIndex={testProgressIndex}
              connectionConfig={connectionConfig}
              setConnectionConfig={setConnectionConfig}
              onAutoDetect={() => void handleAutoDetect()}
              onTestConnection={() => void handleTestConnection()}
              onUseScannedMixer={(ip, name) => void useScannedMixer(ip, name)}
              onScanUsb={() => void handleScanUsb()}
              onAutoCheck={() => void handleAutoCheck()}
              onManualSetup={handleManualSetup}
              onSwitchToEthernet={handleSwitchToEthernet}
              rememberConnectionChoice={rememberConnectionChoice}
              setRememberConnectionChoice={setRememberConnectionChoice}
              isDevelopmentMode={isDevelopmentMode}
              renderUnavailable={renderUnavailable}
            />
          ) : null}

          {step === 6 && showImportStep ? (
            <>
              <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Import Mixer</h2>
              {mixerConnected ? (
                <>
                  <p className="mt-2 font-body text-sm text-[#53fc18]">Great!</p>
                  <p className="mt-1 font-body text-sm text-white/65">
                    Your {mixerChoice || "mixer"} has been connected successfully.
                  </p>
                  <p className="mt-2 font-body text-sm text-white/65">
                    Would you like to import your current mixer configuration?
                  </p>
                </>
              ) : (
                <p className="mt-2 font-body text-sm text-white/65">
                  You can import mixer settings once connected, or continue with manual setup for now.
                </p>
              )}
              {showImportOptions ? (
                <div className="mt-4 space-y-2">
                  {MIXER_IMPORT_OPTIONS.map((option) => (
                    <label key={option.key} className="flex items-center gap-2 font-body text-sm text-white/80">
                      <input type="checkbox" checked={importOptions[option.key]} onChange={() => toggleImportOption(option.key)} disabled={busy} className="accent-[#00f2ff]" />
                      {option.label}
                    </label>
                  ))}
                  <button type="button" disabled={busy || !canImport} onClick={() => void handleImport(importOptions)} className={`${TS.btnPrimary} mt-2`}>
                    Import Selected
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-1">
                  {MIXER_IMPORT_OPTIONS.map((option) => (
                    <p key={option.key} className="font-body text-sm text-white/70">☑ {option.label}</p>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {step === 7 && showImportStep ? (
            <>
              <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Configure Inputs</h2>
              <p className="mt-2 font-body text-sm text-white/60">Choose the microphones and sound sources you need for today&apos;s service.</p>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {SOUND_SOURCE_PRESETS.map((preset) => (
                  <label key={preset.label} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <input type="checkbox" checked={selectedSources.has(preset.label)} onChange={() => toggleSource(preset.label)} disabled={busy} className="accent-[#00f2ff]" />
                    <span className="font-body text-sm text-white">{preset.label}</span>
                  </label>
                ))}
              </div>
            </>
          ) : null}

          {step === 8 ? (
            <>
              {isDevelopmentMode ? (
                <>
                  <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Development Mode</h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/65">
                    You&apos;re setting up Parable on your own computer.
                  </p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-white/55">
                    Because your church equipment isn&apos;t connected, some checks will run automatically when you arrive at church.
                  </p>
                  <ul className="mt-4 space-y-2 font-body text-sm text-[#53fc18]">
                    <li>✓ Mixer information saved</li>
                    <li>✓ Setup completed</li>
                    <li>✓ Ready to continue</li>
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Run Health Check</h2>
                  {healthRunning ? (
                    <p className="mt-4 font-body text-sm text-[#00f2ff]">Running Mixer Health Check...</p>
                  ) : healthResult ? (
                    <div className="mt-4 space-y-2">
                      {healthResult.checks.map((check) => (
                        <p key={check.label} className={`font-body text-sm ${check.ok ? "text-[#53fc18]" : "text-amber-300"}`}>
                          ✓ {check.label}
                        </p>
                      ))}
                      {healthResult.warnings.map((warning) => (
                        <p key={warning} className="font-body text-xs text-amber-200/90">{warning}</p>
                      ))}
                    </div>
                  ) : savedConnectionType === "unknown" && !mixerConnected ? (
                    <p className="mt-4 font-body text-sm text-white/55">Health check will run when your mixer is connected at the church.</p>
                  ) : null}

                  {audioRunning ? (
                    <p className="mt-6 font-body text-sm text-[#00f2ff]">Listening for audio...</p>
                  ) : audioResult ? (
                    <div className="mt-4">
                      <p className="font-body text-xs uppercase tracking-[0.08em] text-white/45">Detected:</p>
                      <div className="mt-2 space-y-1">
                        {audioResult.inputs.map((input) => (
                          <p key={input.name} className="font-body text-sm text-white/80">
                            ✓ {input.name} <span className="text-white/50">{input.signalPresent ? "Signal Present" : "No Signal"}</span>
                          </p>
                        ))}
                      </div>
                      {audioResult.noSignalDetected ? (
                        <>
                          <p className="mt-3 font-body text-sm text-white/65">
                            We connected successfully, but we do not currently detect any audio.
                          </p>
                          <p className="font-body text-xs text-white/50">
                            This may simply mean nobody is speaking or playing yet.
                          </p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </>
          ) : null}

          {step === 9 ? (
            <>
              <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Equipment Setup Complete</h2>
              <p className="mt-2 font-body text-sm text-[#53fc18]">Great job!</p>
              <p className="mt-2 font-body text-sm text-white/65">Your mixer has been added to Parable.</p>
              <p className="mt-4 font-body text-sm text-white/60">When you&apos;re at church, Parable will automatically:</p>
              <ul className="mt-2 space-y-2 font-body text-sm text-white/75">
                <li>✓ Connect to your mixer</li>
                <li>✓ Import your settings</li>
                <li>✓ Verify your audio</li>
                <li>✓ Prepare today&apos;s service</li>
              </ul>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {step === 1 ? (
            <>
              <button type="button" disabled={busy} onClick={() => setStep(2)} className={TS.btnPrimary}>Next</button>
              <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>Cancel</button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <button type="button" disabled={busy || !mixerChoice} onClick={goNextFromMixerSelect} className={TS.btnPrimary}>Next</button>
              <button type="button" disabled={busy} onClick={() => setStep(1)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <button
                type="button"
                disabled={busy || !connectionTypeChoice}
                title={!connectionTypeChoice ? "Please choose a connection method." : undefined}
                onClick={() => void saveConnectionPreference().then(() => setStep(4))}
                className={TS.btnPrimary}
              >
                Next
              </button>
              <button type="button" disabled={busy} onClick={() => setStep(2)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 4 && connectionTypeChoice === "ethernet" ? (
            <>
              {showManualIp && testResult?.success ? (
                <button type="button" disabled={busy} onClick={() => setStep(5)} className={TS.btnPrimary}>Continue</button>
              ) : null}
              {!showManualIp ? (
                <button type="button" disabled={busy} onClick={() => setStep(3)} className={TS.btnOutline}>Back</button>
              ) : null}
            </>
          ) : null}

          {step === 4 && connectionTypeChoice === "usb" ? (
            <>
              {usbDevice ? (
                <>
                  <button type="button" disabled={busy} onClick={() => void handleUseUsbDevice(false)} className={TS.btnPrimary}>
                    Use This Audio Device
                  </button>
                  <button type="button" disabled={busy} onClick={() => void handleUseUsbDevice(true)} className={TS.btnOutline}>
                    Also Set Up Ethernet
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setSavedConnectionType("usb"); setStep(5); }} className={TS.btnOutline}>
                    Continue
                  </button>
                </>
              ) : (
                <button type="button" disabled={busy} onClick={() => setStep(3)} className={TS.btnOutline}>Back</button>
              )}
            </>
          ) : null}

          {step === 4 && connectionTypeChoice === "unsure" ? (
            <>
              {autoCheckResult ? (
                <>
                  <button type="button" disabled={busy} onClick={() => void applyAutoCheckConnection()} className={TS.btnPrimary}>
                    Continue
                  </button>
                  <button type="button" disabled={busy} onClick={handleManualSetup} className={TS.btnOutline}>
                    Continue With Manual Setup
                  </button>
                </>
              ) : null}
              <button type="button" disabled={busy} onClick={() => setStep(3)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 5 ? (
            <>
              <button type="button" disabled={busy} onClick={advanceFromSummary} className={TS.btnPrimary}>Continue</button>
              {savedConnectionType === "usb" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setConnectionTypeChoice("ethernet");
                    setShowManualIp(false);
                    setStep(4);
                  }}
                  className={TS.btnOutline}
                >
                  Set Up Ethernet Now
                </button>
              ) : null}
              <button type="button" disabled={busy} onClick={() => setStep(summaryBackStep)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 6 && showImportStep ? (
            <>
              <button type="button" disabled={busy || !canImport} onClick={() => void handleImport(ALL_IMPORT_OPTIONS)} className={TS.btnPrimary}>
                Import Everything
              </button>
              <button type="button" disabled={busy} onClick={() => setShowImportOptions(true)} className={TS.btnOutline}>
                Choose What To Import
              </button>
              <button type="button" disabled={busy} onClick={() => void handleStartFresh()} className={TS.btnOutline}>
                Start Fresh
              </button>
              <button type="button" disabled={busy} onClick={() => setStep(5)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 7 && showImportStep ? (
            <>
              <button type="button" disabled={busy} onClick={() => { setHealthRan(false); setStep(8); }} className={TS.btnPrimary}>Next</button>
              <button type="button" disabled={busy} onClick={() => setStep(previousStepFromConfigureInputs(showImportStep))} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 8 ? (
            <>
              {!isDevelopmentMode ? (
                <button type="button" disabled={busy} onClick={() => { setHealthRan(false); void runHealthAndAudio(); }} className={TS.btnOutline}>
                  Test Again
                </button>
              ) : null}
              <button type="button" disabled={busy || healthRunning || audioRunning} onClick={() => setStep(9)} className={TS.btnPrimary}>
                {isDevelopmentMode ? "Continue" : "Continue Anyway"}
              </button>
              <button type="button" disabled={busy} onClick={() => setStep(previousStepFromHealthCheck(showImportStep))} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {step === 9 ? (
            <>
              <button type="button" disabled={busy} onClick={() => void handleContinueToCameraSetup()} className={TS.btnPrimary}>
                {busy ? "Saving…" : "Continue to Camera Setup →"}
              </button>
              <button type="button" disabled={busy} onClick={() => setStep(8)} className={TS.btnOutline}>Back</button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
