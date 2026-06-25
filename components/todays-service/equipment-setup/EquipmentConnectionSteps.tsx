"use client";

import { useState } from "react";
import AdvancedSettingsAccordion from "@/components/todays-service/AdvancedSettingsAccordion";
import ConnectionTypeHelpModal from "@/components/todays-service/equipment-setup/ConnectionTypeHelpModal";
import { TS } from "@/components/todays-service/ServiceUi";
import {
  CONNECTION_TYPE_OPTIONS,
  connectionTypePlainLabel,
  ETHERNET_SCAN_PROGRESS,
  type MixerAutoCheckResult,
  type MixerConnectionTypeChoice,
  type UsbAudioDevice,
} from "@/lib/todays-service/mixer-connection";
import { TEST_PROGRESS_STEPS } from "@/lib/todays-service/equipment-setup";
import type { MixerScanResult, MixerTestResult, ScannedMixer } from "@/lib/todays-service/mixer-types";
import type { MixerConnectionType } from "@/lib/todays-service/types";
import { guessMixerUsbLabel } from "@/lib/todays-service/usb-audio-scan";
import type { Dispatch, SetStateAction } from "react";
import type { MixerChoice } from "@/lib/todays-service/sound-setup";

type ProgressChecklistProps = {
  title: string;
  steps: readonly string[];
  activeIndex: number;
};

function ProgressChecklist({ title, steps, activeIndex }: ProgressChecklistProps) {
  return (
    <div className="rounded-lg border border-[#00f2ff]/20 bg-[#00f2ff]/5 p-3">
      <p className="font-body text-sm font-semibold text-[#00f2ff]">{title}</p>
      <ul className="mt-2 space-y-1">
        {steps.map((step, i) => (
          <li key={step} className={`font-body text-xs ${activeIndex >= i ? "text-[#53fc18]" : "text-white/40"}`}>
            {activeIndex >= i ? "✓" : "○"} {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScannedMixerCard({
  mixer,
  onUse,
  busy,
}: {
  mixer: ScannedMixer;
  onUse: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#53fc18]/30 bg-[#53fc18]/5 p-3">
      <p className="font-body text-sm font-semibold text-[#53fc18]">✓ Mixer Found</p>
      <dl className="mt-2 space-y-1 text-xs text-white/80">
        <div className="flex justify-between gap-4"><dt className="text-white/50">Manufacturer</dt><dd>{mixer.manufacturer}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-white/50">Model</dt><dd>{mixer.model}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-white/50">IP Address</dt><dd>{mixer.ipAddress || "Detected automatically"}</dd></div>
      </dl>
      <button type="button" disabled={busy} onClick={onUse} className={`${TS.btnPrimary} mt-2`}>
        Use This Mixer
      </button>
    </div>
  );
}

export type ConnectionFlowProps = {
  step: number;
  mixerChoice: MixerChoice | "";
  connectionTypeChoice: MixerConnectionTypeChoice | "";
  setConnectionTypeChoice: (v: MixerConnectionTypeChoice) => void;
  savedConnectionType: MixerConnectionType;
  showManualIp: boolean;
  setShowManualIp: (v: boolean) => void;
  mixerName: string;
  setMixerName: (v: string) => void;
  mixerIp: string;
  setMixerIp: (v: string) => void;
  busy: boolean;
  scanning: boolean;
  testing: boolean;
  scanPhase: "idle" | "searching" | "results" | "none";
  scanResult: MixerScanResult | null;
  testResult: MixerTestResult | null;
  usbDevice: UsbAudioDevice | null;
  autoCheckResult: MixerAutoCheckResult | null;
  autoChecking: boolean;
  scanProgressIndex: number;
  testProgressIndex: number;
  connectionConfig: { port: number; timeoutMs: number; retryCount: number };
  setConnectionConfig: Dispatch<SetStateAction<{ port: number; timeoutMs: number; retryCount: number }>>;
  onAutoDetect: () => void;
  onTestConnection: () => void;
  onUseScannedMixer: (ip: string, name: string) => void;
  onScanUsb: () => void;
  onAutoCheck: () => void;
  onManualSetup: () => void;
  onSwitchToEthernet: () => void;
  rememberConnectionChoice: boolean;
  setRememberConnectionChoice: (v: boolean) => void;
  isDevelopmentMode: boolean;
  renderUnavailable: (result: MixerTestResult) => React.ReactNode;
};

export function EquipmentConnectionSteps(props: ConnectionFlowProps) {
  const {
    step,
    mixerChoice,
    connectionTypeChoice,
    setConnectionTypeChoice,
    savedConnectionType,
    showManualIp,
    setShowManualIp,
    mixerName,
    setMixerName,
    mixerIp,
    setMixerIp,
    busy,
    scanning,
    testing,
    scanPhase,
    scanResult,
    testResult,
    usbDevice,
    autoCheckResult,
    autoChecking,
    scanProgressIndex,
    testProgressIndex,
    connectionConfig,
    setConnectionConfig,
    onAutoDetect,
    onTestConnection,
    onUseScannedMixer,
    onScanUsb,
    onAutoCheck,
    onManualSetup,
    onSwitchToEthernet,
    rememberConnectionChoice,
    setRememberConnectionChoice,
    isDevelopmentMode,
    renderUnavailable,
  } = props;

  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  if (step === 3) {
    return (
      <>
        <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">
          How is your mixer connected?
        </h2>
        <fieldset className="mt-4 space-y-2" disabled={busy} role="radiogroup" aria-label="Mixer connection type">
          {CONNECTION_TYPE_OPTIONS.map((option) => {
            const Icon = option.Icon;
            const selected = connectionTypeChoice === option.id;
            return (
              <div
                key={option.id}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => setConnectionTypeChoice(option.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setConnectionTypeChoice(option.id);
                  }
                }}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-[#00f2ff]/60 ${
                  selected ? "border-[#00f2ff]/50 bg-[#00f2ff]/10" : "border-white/10 bg-black/30 hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 text-[#00f2ff]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm font-semibold text-white">{option.title}</span>
                      {option.recommended ? (
                        <span
                          className="rounded-full border border-[#53fc18]/40 bg-[#53fc18]/10 px-2 py-0.5 font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-[#53fc18]"
                          title={option.recommendedTooltip}
                        >
                          {option.recommendedBadge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block font-body text-xs leading-relaxed text-white/60">{option.description}</span>
                    <span className="mt-1.5 block font-body text-xs text-[#00f2ff]/75">{option.footnote}</span>
                  </span>
                  <input
                    type="radio"
                    name="connectionType"
                    checked={selected}
                    onChange={() => setConnectionTypeChoice(option.id)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>
              </div>
            );
          })}
        </fieldset>

        <label className="mt-4 flex cursor-pointer items-center gap-2 font-body text-sm text-white/75">
          <input
            type="checkbox"
            checked={rememberConnectionChoice}
            onChange={(e) => setRememberConnectionChoice(e.target.checked)}
            disabled={busy}
            className="accent-[#00f2ff]"
          />
          Remember this choice for this church
        </label>

        <button
          type="button"
          onClick={() => setLearnMoreOpen(true)}
          className="mt-3 font-body text-xs text-[#00f2ff] underline-offset-2 hover:underline"
        >
          How do I know which one to choose?
        </button>

        <ConnectionTypeHelpModal open={learnMoreOpen} onClose={() => setLearnMoreOpen(false)} />
      </>
    );
  }

  if (step === 4 && connectionTypeChoice === "ethernet") {
    return (
      <>
        <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Find Your Mixer</h2>
        <p className="mt-2 font-body text-sm text-white/65">
          Parable will look for your mixer on your church network.
        </p>
        {!showManualIp ? (
          <div className="mt-4 space-y-3">
            <button type="button" disabled={busy} onClick={onAutoDetect} className={`${TS.btnPrimary} w-full`}>
              Auto Detect Mixer
            </button>
            <button type="button" disabled={busy} onClick={() => setShowManualIp(true)} className={`${TS.btnOutline} w-full`}>
              Enter IP Address Manually
            </button>
            {scanning ? (
              <ProgressChecklist title="Searching for mixers..." steps={ETHERNET_SCAN_PROGRESS} activeIndex={scanProgressIndex} />
            ) : null}
            {scanPhase === "results" && scanResult?.mixers.map((m) => (
              <ScannedMixerCard key={m.ipAddress} mixer={m} busy={busy} onUse={() => onUseScannedMixer(m.ipAddress, m.name)} />
            ))}
            {scanPhase === "none" ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="font-body text-sm text-white/80">We could not find your mixer automatically.</p>
                <p className="mt-2 font-body text-xs text-white/55">Things to check:</p>
                <ul className="mt-1 list-inside list-disc font-body text-xs text-white/55">
                  <li>Is the mixer turned on?</li>
                  <li>Is the network cable plugged in?</li>
                  <li>Is this computer connected to the same church network?</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={onAutoDetect} className={TS.btnOutline}>Try Again</button>
                  <button type="button" disabled={busy} onClick={() => setShowManualIp(true)} className={TS.btnOutline}>Enter IP Manually</button>
                  <button type="button" disabled={busy} onClick={onManualSetup} className={TS.btnOutline}>Continue With Manual Setup</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Mixer Name</span>
              <input value={mixerName} onChange={(e) => setMixerName(e.target.value)} className={TS.input} disabled={busy} />
            </label>
            <label className="block">
              <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Mixer IP Address</span>
              <input value={mixerIp} onChange={(e) => setMixerIp(e.target.value)} placeholder="" className={TS.input} disabled={busy} />
              <span className="mt-1 block font-body text-xs text-white/50">
                This is the network address of your mixer. If you do not know it, use Auto Detect or ask your sound person.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={onTestConnection} className={TS.btnPrimary}>Test Connection</button>
              <button type="button" disabled={busy} onClick={() => setShowManualIp(false)} className={TS.btnOutline}>Back</button>
            </div>
            {testing ? <ProgressChecklist title="Testing Connection..." steps={TEST_PROGRESS_STEPS} activeIndex={testProgressIndex} /> : null}
            {testResult?.success ? (
              <p className="font-body text-sm text-[#53fc18]">Connection successful. Continue to review your setup.</p>
            ) : null}
            {testResult && !testResult.success ? renderUnavailable(testResult) : null}
            <AdvancedSettingsAccordion>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/45">Port</span>
                  <input type="number" value={connectionConfig.port} onChange={(e) => setConnectionConfig((c) => ({ ...c, port: Number(e.target.value) }))} className={TS.input} disabled={busy} />
                </label>
                <label className="block">
                  <span className="mb-1 block font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/45">Timeout</span>
                  <input type="number" value={connectionConfig.timeoutMs} onChange={(e) => setConnectionConfig((c) => ({ ...c, timeoutMs: Number(e.target.value) }))} className={TS.input} disabled={busy} />
                </label>
                <label className="block">
                  <span className="mb-1 block font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/45">Retry Count</span>
                  <input type="number" value={connectionConfig.retryCount} onChange={(e) => setConnectionConfig((c) => ({ ...c, retryCount: Number(e.target.value) }))} className={TS.input} disabled={busy} />
                </label>
              </div>
            </AdvancedSettingsAccordion>
          </div>
        )}
      </>
    );
  }

  if (step === 4 && connectionTypeChoice === "usb") {
    const usbLabel = usbDevice?.label ?? guessMixerUsbLabel(mixerChoice);
    return (
      <>
        <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Check USB Audio Connection</h2>
        <p className="mt-2 font-body text-sm text-white/65">
          Parable will check whether your mixer is connected as an audio device.
        </p>
        {!usbDevice ? (
          <div className="mt-4 space-y-3">
            <button type="button" disabled={busy} onClick={onScanUsb} className={`${TS.btnPrimary} w-full`}>
              Scan USB Audio Devices
            </button>
            {scanPhase === "none" ? (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <p className="font-body text-sm text-white/80">We could not find the mixer through USB.</p>
                <ul className="mt-2 list-inside list-disc font-body text-xs text-white/55">
                  <li>Is the USB cable plugged in?</li>
                  <li>Is the mixer turned on?</li>
                  <li>Is the computer using the correct audio device?</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={onScanUsb} className={TS.btnOutline}>Try Again</button>
                  <button type="button" disabled={busy} onClick={onSwitchToEthernet} className={TS.btnOutline}>Use Ethernet Instead</button>
                  <button type="button" disabled={busy} onClick={onManualSetup} className={TS.btnOutline}>Continue With Manual Setup</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#53fc18]/30 bg-[#53fc18]/5 p-3">
            <p className="font-body text-sm font-semibold text-[#53fc18]">USB Audio Device Found</p>
            <p className="mt-2 font-body text-xs text-white/55">Device Name</p>
            <p className="font-body text-sm text-white">{usbLabel}</p>
            <p className="mt-3 font-body text-xs text-white/55">What this can be used for:</p>
            <ul className="mt-1 font-body text-xs text-white/70">
              <li>Recording</li>
              <li>Stream audio input</li>
              <li>Computer audio</li>
            </ul>
            <p className="mt-3 font-body text-xs text-white/55">
              For full mixer control, connect the mixer with an Ethernet cable too.
            </p>
          </div>
        )}
      </>
    );
  }

  if (step === 4 && connectionTypeChoice === "unsure") {
    return (
      <>
        <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">Let&apos;s Figure It Out</h2>
        <p className="mt-2 font-body text-sm text-white/65">No problem. We&apos;ll check both connection types.</p>
        {!autoCheckResult && !autoChecking ? (
          <button type="button" disabled={busy} onClick={onAutoCheck} className={`${TS.btnPrimary} mt-4`}>
            Start Auto Check
          </button>
        ) : null}
        {autoChecking ? (
          <p className="mt-4 font-body text-sm text-[#00f2ff]">Checking Ethernet, then USB...</p>
        ) : null}
        {autoCheckResult?.ethernetFound ? (
          <div className="mt-4 rounded-lg border border-[#53fc18]/30 bg-[#53fc18]/5 p-3 font-body text-sm text-white/80">
            <p className="font-semibold text-[#53fc18]">We found your mixer through Ethernet.</p>
            <p className="mt-2 text-xs text-white/60">Recommended: Use Ethernet for full Parable control.</p>
          </div>
        ) : null}
        {autoCheckResult && !autoCheckResult.ethernetFound && autoCheckResult.usbFound ? (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 font-body text-sm text-white/80">
            <p>We found your mixer through USB.</p>
            <p className="mt-2 text-xs text-white/60">You can use it for audio, but Ethernet is recommended for full control.</p>
          </div>
        ) : null}
        {autoCheckResult && !autoCheckResult.ethernetFound && !autoCheckResult.usbFound ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 font-body text-sm text-white/80">
            <p>We could not find the mixer yet.</p>
            <p className="mt-2 text-xs text-white/60">You can continue with manual setup and connect it later.</p>
          </div>
        ) : null}
      </>
    );
  }

  if (step === 5) {
    const isUsbOnly = savedConnectionType === "usb";
    const isManual = savedConnectionType === "manual" || isDevelopmentMode;
    const isEth = savedConnectionType === "ethernet" || savedConnectionType === "both";
    return (
      <>
        <h2 className="mt-2 font-headline text-xl uppercase tracking-[0.08em] text-white">
          {isUsbOnly ? "Mixer Audio Connected" : isManual ? "Mixer Saved" : "Mixer Connected"}
        </h2>
        {!isManual ? (
          <>
            <p className="mt-2 font-body text-lg text-white">{mixerName || mixerChoice || "Mixer"}</p>
            <p className="mt-1 font-body text-sm text-white/60">
              Connection: {connectionTypePlainLabel(savedConnectionType)}
            </p>
          </>
        ) : null}
        {isManual ? (
          <div className="mt-4 space-y-3 font-body text-sm text-white/75">
            <p className="text-[#53fc18]">Great!</p>
            <p>We&apos;ve saved your mixer information.</p>
            <p>
              When you&apos;re at your church, Parable will automatically connect to your mixer and import its settings.
            </p>
            <p className="text-white/55">Nothing else is required today.</p>
          </div>
        ) : isEth ? (
          <ul className="mt-4 space-y-1 font-body text-sm text-white/75">
            <li>✓ Find your mixer</li>
            <li>✓ Read your mixer setup</li>
            <li>✓ Check microphone activity</li>
            <li>✓ Help monitor sound</li>
          </ul>
        ) : (
          <>
            <ul className="mt-4 space-y-1 font-body text-sm text-white/75">
              <li>✓ Use audio from the mixer</li>
              <li>✓ Help with recording or streaming audio</li>
            </ul>
            <p className="mt-3 font-body text-xs text-amber-200/90">
              Parable cannot fully control the mixer through USB only.
            </p>
            <p className="mt-1 font-body text-xs text-white/55">
              Recommendation: Add Ethernet later for full mixer features.
            </p>
          </>
        )}
      </>
    );
  }

  return null;
}
