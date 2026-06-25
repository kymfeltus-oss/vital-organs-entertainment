"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EthernetPort, RefreshCw, Wifi } from "lucide-react";
import AdvancedSettingsAccordion from "@/components/todays-service/AdvancedSettingsAccordion";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import EquipmentOnboardingProgress from "@/components/todays-service/equipment-setup/EquipmentOnboardingProgress";
import { TS } from "@/components/todays-service/ServiceUi";
import {
  connectWifiApi,
  detectInternetApi,
  reconnectInternetApi,
  runInternetSpeedTestApi,
  saveInternetSetupApi,
  savePreferredNetworkApi,
  scanWifiNetworksApi,
} from "@/lib/internet/api";
import { sanitizeInternetError } from "@/lib/internet/errors";
import { mergeBrowserDetect, readBrowserOnline } from "@/lib/internet/browser-detect";
import {
  connectionTypeLabel,
  formatLatency,
  formatMbps,
  INTERNET_UI,
  streamingQualityLabel,
} from "@/lib/internet/labels";
import type {
  InternetDetectResult,
  InternetSpeedTestResult,
  PreferredChurchNetwork,
  WiFiNetwork,
} from "@/lib/internet/types";
import type { TenantEquipmentProfile } from "@/lib/todays-service/equipment-onboarding";
import type { InternetConnection } from "@/lib/todays-service/types";

type WizardPhase =
  | "detecting"
  | "disconnected"
  | "wifi-scan"
  | "wifi-password"
  | "ethernet"
  | "testing"
  | "summary"
  | "backup-offer";

type InternetSetupWizardProps = {
  open: boolean;
  connections: InternetConnection[];
  equipmentProfile: TenantEquipmentProfile | null;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const TEST_STEPS = [
  "Checking your computer's internet access…",
  "Measuring upload speed on this computer…",
  "Measuring download speed on this computer…",
  "Measuring response time…",
  "Checking connection stability…",
];

function hasComputerInternet(detect: InternetDetectResult | null): boolean {
  if (!detect) return false;
  return detect.online || (readBrowserOnline() && detect.internetReachable);
}

function InternetAvailableSummary({
  detect,
  speed,
  compact = false,
}: {
  detect: InternetDetectResult;
  speed: InternetSpeedTestResult;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-3" : "mt-4"}>
      <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-[#53fc18]">
        {INTERNET_UI.availableTitle}
      </p>
      <p className="mt-1 font-body text-sm text-white/70">{INTERNET_UI.availableSubtitle}</p>
      <dl className="mt-4 space-y-2 font-body text-sm text-white/75">
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Connection type</dt>
          <dd>{connectionTypeLabel(detect.connectionType)}</dd>
        </div>
        {detect.ssid ? (
          <div className="flex justify-between gap-4">
            <dt className="text-white/50">Network name</dt>
            <dd>{detect.ssid}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Upload speed</dt>
          <dd>{formatMbps(speed.uploadMbps)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Download speed</dt>
          <dd>{formatMbps(speed.downloadMbps)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Latency</dt>
          <dd>{formatLatency(speed.latencyMs)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Streaming quality</dt>
          <dd>{streamingQualityLabel(speed.streamingQuality)}</dd>
        </div>
      </dl>
      <p className="mt-3 font-body text-xs text-white/50">{INTERNET_UI.speedTestNote}</p>
    </div>
  );
}

export default function InternetSetupWizard({
  open,
  connections,
  equipmentProfile,
  onClose,
  onSaved,
  onToast,
}: InternetSetupWizardProps) {
  const [phase, setPhase] = useState<WizardPhase>("detecting");
  const [detect, setDetect] = useState<InternetDetectResult | null>(null);
  const [speed, setSpeed] = useState<InternetSpeedTestResult | null>(null);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [selectedSsid, setSelectedSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [rememberNetwork, setRememberNetwork] = useState(true);
  const [preferForFuture, setPreferForFuture] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testStepIndex, setTestStepIndex] = useState(0);
  const [isBackupFlow, setIsBackupFlow] = useState(false);
  const wasOpenRef = useRef(false);
  const { titleId, panelRef, dialogProps } = useAccessibleModal(open, onClose);

  const completedSections = equipmentProfile?.onboarding.completedSections ?? [];
  const primary = connections.find((c) => !c.isBackup);

  const runSpeedTests = useCallback(async () => {
    setPhase("testing");
    setTestStepIndex(0);
    setBusy(true);
    const timer = window.setInterval(() => {
      setTestStepIndex((i) => Math.min(i + 1, TEST_STEPS.length - 1));
    }, 900);
    try {
      const result = await runInternetSpeedTestApi();
      setSpeed(result);
      // #region agent log
      fetch('http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'675ed0'},body:JSON.stringify({sessionId:'675ed0',location:'InternetSetupWizard.tsx:runSpeedTests',message:'speed test complete',data:{phase:'summary',uploadMbps:result.uploadMbps,downloadMbps:result.downloadMbps,streamingQuality:result.streamingQuality},timestamp:Date.now(),hypothesisId:'C',runId:'internet-ui'})}).catch(()=>{});
      // #endregion
      setPhase("summary");
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
      setPhase(hasComputerInternet(detect) ? "summary" : "disconnected");
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }, [detect, onToast]);

  const runAutoDetect = useCallback(async () => {
    setPhase("detecting");
    setBusy(true);
    try {
      if (equipmentProfile?.preferredNetwork?.remember && equipmentProfile.preferredNetwork.ssid) {
        await reconnectInternetApi().catch(() => {});
      }

      const agentDetect = await detectInternetApi();
      const merged = mergeBrowserDetect(agentDetect);
      setDetect(merged);
      // #region agent log
      fetch('http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'675ed0'},body:JSON.stringify({sessionId:'675ed0',location:'InternetSetupWizard.tsx:runAutoDetect',message:'detect result',data:{online:merged.online,connectionType:merged.connectionType,ssid:merged.ssid??null,hasComputerInternet:hasComputerInternet(merged)},timestamp:Date.now(),hypothesisId:'A',runId:'internet-ui'})}).catch(()=>{});
      // #endregion

      if (hasComputerInternet(merged)) {
        await runSpeedTests();
        return;
      }
      setPhase("disconnected");
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
      setPhase("disconnected");
    } finally {
      setBusy(false);
    }
  }, [equipmentProfile, onToast, runSpeedTests]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPhase("detecting");
      setDetect(null);
      setSpeed(null);
      setNetworks([]);
      setSelectedSsid("");
      setWifiPassword("");
      setRememberNetwork(true);
      setPreferForFuture(true);
      setIsBackupFlow(false);
      void runAutoDetect();
    }
    wasOpenRef.current = open;
  }, [open, runAutoDetect]);

  const loadWifiNetworks = async () => {
    setBusy(true);
    try {
      const items = await scanWifiNetworksApi();
      setNetworks(items);
      if (items.length === 0) {
        onToast("error", "No Wi-Fi networks found. Try moving closer to your router.");
      }
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleWifiConnect = async () => {
    if (!selectedSsid) return;
    setBusy(true);
    try {
      const result = await connectWifiApi(selectedSsid, wifiPassword);
      if (!result.success) {
        onToast("error", result.message);
        return;
      }
      if (rememberNetwork) {
        const network: PreferredChurchNetwork = {
          type: "wifi",
          ssid: selectedSsid,
          remember: true,
        };
        await savePreferredNetworkApi(network);
      }
      const refreshed = mergeBrowserDetect(await detectInternetApi());
      setDetect(refreshed);
      onToast("success", "Your computer joined the Wi-Fi network.");
      await runSpeedTests();
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEthernetCheck = async () => {
    setBusy(true);
    try {
      const refreshed = mergeBrowserDetect(await detectInternetApi());
      setDetect(refreshed);
      if (refreshed.ethernetConnected === false) {
        onToast("error", "Please connect an Ethernet cable and try again.");
        return;
      }
      if (!hasComputerInternet(refreshed)) {
        onToast("error", "Ethernet is linked, but this computer still cannot reach the internet.");
        return;
      }
      if (rememberNetwork) {
        await savePreferredNetworkApi({ type: "ethernet", ssid: null, remember: true });
      }
      await runSpeedTests();
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNetwork = async () => {
    if (!detect || !speed) return;
    setBusy(true);
    try {
      const connectionType = detect.connectionType ?? "unknown";
      await saveInternetSetupApi({
        connectionName: isBackupFlow ? "Backup Internet" : detect.ssid ?? "Current Network",
        isBackup: isBackupFlow,
        connectionType,
        ssid: detect.ssid,
        localIp: detect.localIp,
        uploadMbps: speed.uploadMbps,
        downloadMbps: speed.downloadMbps,
        latencyMs: speed.latencyMs,
        stabilityScore: speed.stabilityScore,
        streamingQuality: speed.streamingQuality,
      });

      if (preferForFuture && (detect.ssid || connectionType === "ethernet")) {
        await savePreferredNetworkApi({
          type: connectionType === "unknown" ? "wifi" : connectionType,
          ssid: detect.ssid,
          remember: true,
        });
      }

      await onSaved();
      onToast("success", "Network saved for today's service.");
      if (!isBackupFlow && phase === "summary") {
        setPhase("backup-offer");
        setBusy(false);
        return;
      }
      onClose();
    } catch (err) {
      onToast("error", sanitizeInternetError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div ref={panelRef} {...dialogProps} className={`${TS.panel} flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl p-5`}>
        <h2 id={titleId} className="sr-only">
          Internet setup
        </h2>
        <EquipmentOnboardingProgress currentSection="internet" completedSections={completedSections} />

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {phase === "detecting" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">Checking Connection</h2>
              <p className="mt-2 font-body text-sm text-white/65">{INTERNET_UI.detecting}</p>
            </>
          ) : null}

          {phase === "disconnected" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">
                {INTERNET_UI.noInternetTitle}
              </h2>
              <p className="mt-2 font-body text-sm text-white/65">{INTERNET_UI.noInternetBody}</p>
              <ul className="mt-3 space-y-1 font-body text-sm text-white/55">
                <li>{INTERNET_UI.noInternetWindows}</li>
                <li>{INTERNET_UI.noInternetMac}</li>
              </ul>
              <p className="mt-4 font-body text-sm text-white/55">After connecting, choose how to verify:</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setPhase("wifi-scan"); void loadWifiNetworks(); }}
                  className={`${TS.btnPrimary} flex w-full items-center justify-center gap-2`}
                >
                  <Wifi className="h-4 w-4" aria-hidden /> Choose Wi-Fi Network
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPhase("ethernet")}
                  className={`${TS.btnOutline} flex w-full items-center justify-center gap-2`}
                >
                  <EthernetPort className="h-4 w-4" aria-hidden /> Use Ethernet
                </button>
              </div>
            </>
          ) : null}

          {phase === "wifi-scan" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">Choose Wi-Fi Network</h2>
              <p className="mt-2 font-body text-sm text-white/55">
                Parable can help your computer join a network. You can also connect in Windows or macOS settings first.
              </p>
              <button type="button" disabled={busy} onClick={() => void loadWifiNetworks()} className={`${TS.btnOutline} mt-3 flex items-center gap-2`}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
              </button>
              <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
                {networks.map((net) => (
                  <button
                    key={net.ssid}
                    type="button"
                    disabled={busy}
                    onClick={() => { setSelectedSsid(net.ssid); setPhase("wifi-password"); }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                      selectedSsid === net.ssid ? "border-[#00f2ff]/50 bg-[#00f2ff]/10" : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <span className="font-body text-sm text-white">{net.ssid}</span>
                    <span className="font-body text-xs text-white/45">{net.signalStrength != null ? `${net.signalStrength}%` : ""}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {phase === "wifi-password" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">Wi-Fi Password</h2>
              <p className="mt-2 font-body text-sm text-white/65">
                Enter the password so your computer can join <span className="text-white">{selectedSsid}</span>.
              </p>
              <label className="mt-4 block">
                <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Password</span>
                <input
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className={TS.input}
                  disabled={busy}
                  autoComplete="off"
                />
              </label>
              <p className="mt-2 font-body text-xs text-white/45">
                Parable does not store your Wi-Fi password—only your computer uses it to join the network.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 font-body text-sm text-white/75">
                <input type="checkbox" checked={rememberNetwork} onChange={(e) => setRememberNetwork(e.target.checked)} className="accent-[#00f2ff]" />
                Remember this network name for this church
              </label>
            </>
          ) : null}

          {phase === "ethernet" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">Ethernet Connection</h2>
              {detect?.ethernetConnected === false ? (
                <p className="mt-2 font-body text-sm text-white/65">Please connect an Ethernet cable and try again.</p>
              ) : (
                <p className="mt-2 font-body text-sm text-white/65">
                  Plug an Ethernet cable into this computer. Parable will check whether your computer has internet access.
                </p>
              )}
              <label className="mt-4 flex cursor-pointer items-center gap-2 font-body text-sm text-white/75">
                <input type="checkbox" checked={rememberNetwork} onChange={(e) => setRememberNetwork(e.target.checked)} className="accent-[#00f2ff]" />
                Remember Ethernet for this church
              </label>
            </>
          ) : null}

          {phase === "testing" ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">{INTERNET_UI.testingTitle}</h2>
              <p className="mt-2 font-body text-sm text-[#00f2ff]">{INTERNET_UI.testingLead}</p>
              <p className="mt-1 font-body text-xs text-white/50">{TEST_STEPS[testStepIndex]}</p>
              <ul className="mt-4 space-y-1 font-body text-xs text-white/55">
                {TEST_STEPS.map((step, i) => (
                  <li key={step} className={i <= testStepIndex ? "text-[#53fc18]" : ""}>
                    {i <= testStepIndex ? "✓" : "○"} {step.replace("…", "")}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {(phase === "summary" || phase === "backup-offer") && detect ? (
            <>
              <h2 className="mt-3 font-headline text-xl uppercase tracking-[0.08em] text-white">
                {phase === "backup-offer" ? "Network Saved" : INTERNET_UI.availableTitle}
              </h2>
              {phase === "backup-offer" ? (
                <p className="mt-2 font-body text-sm text-white/65">Would you like to add a backup internet connection?</p>
              ) : speed ? (
                <InternetAvailableSummary detect={detect} speed={speed} />
              ) : (
                <div className="mt-4">
                  <p className="font-body text-sm text-white/70">{INTERNET_UI.availableSubtitle}</p>
                  <dl className="mt-4 space-y-2 font-body text-sm text-white/75">
                    <div className="flex justify-between gap-4">
                      <dt className="text-white/50">Connection type</dt>
                      <dd>{connectionTypeLabel(detect.connectionType)}</dd>
                    </div>
                    {detect.ssid ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-white/50">Network name</dt>
                        <dd>{detect.ssid}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-3 font-body text-xs text-white/50">
                    Speed test could not complete. Use Test Again to measure your computer&apos;s connection.
                  </p>
                </div>
              )}
              {primary && phase === "summary" && speed ? (
                <AdvancedSettingsAccordion>
                  <p className="font-body text-xs text-white/55">Local address: {detect.localIp ?? "—"}</p>
                  <p className="mt-1 font-body text-xs text-white/55">Stability score: {Math.round(speed.stabilityScore)}</p>
                </AdvancedSettingsAccordion>
              ) : null}
              {phase === "summary" && speed ? (
                <label className="mt-4 flex cursor-pointer items-center gap-2 font-body text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={preferForFuture}
                    onChange={(e) => setPreferForFuture(e.target.checked)}
                    className="accent-[#00f2ff]"
                  />
                  Prefer this network for future services
                </label>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {phase === "disconnected" ? (
            <>
              <button type="button" disabled={busy} onClick={() => void runAutoDetect()} className={TS.btnOutline}>Try Again</button>
              <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>Cancel</button>
            </>
          ) : null}

          {phase === "wifi-scan" ? (
            <button type="button" disabled={busy} onClick={() => setPhase("disconnected")} className={TS.btnOutline}>Back</button>
          ) : null}

          {phase === "wifi-password" ? (
            <>
              <button type="button" disabled={busy || !wifiPassword} onClick={() => void handleWifiConnect()} className={TS.btnPrimary}>
                Join Network
              </button>
              <button type="button" disabled={busy} onClick={() => setPhase("wifi-scan")} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {phase === "ethernet" ? (
            <>
              <button type="button" disabled={busy} onClick={() => void handleEthernetCheck()} className={TS.btnPrimary}>
                Check Internet
              </button>
              <button type="button" disabled={busy} onClick={() => setPhase("disconnected")} className={TS.btnOutline}>Back</button>
            </>
          ) : null}

          {phase === "summary" ? (
            <>
              {speed ? (
                <button type="button" disabled={busy} onClick={() => void handleSaveNetwork()} className={TS.btnPrimary}>
                  {busy ? "Saving…" : INTERNET_UI.saveNetwork}
                </button>
              ) : null}
              <button type="button" disabled={busy} onClick={() => void runSpeedTests()} className={TS.btnOutline}>
                Test Again
              </button>
              <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>
                Continue Without Saving
              </button>
            </>
          ) : null}

          {phase === "backup-offer" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setIsBackupFlow(true);
                  setSpeed(null);
                  setDetect(null);
                  setPhase("disconnected");
                }}
                className={TS.btnPrimary}
              >
                Add Backup Internet
              </button>
              <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>Skip for Now</button>
            </>
          ) : null}

          {(phase === "detecting" || phase === "testing") ? (
            <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>Cancel</button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
