"use client";

import type { DiscoveredSoundDevice, SoundLevelsSnapshot, SoundTestResult } from "@/lib/sound/types";

const MANUFACTURER_HINTS: [string, string][] = [
  ["behringer", "Behringer"],
  ["midas", "Midas"],
  ["allen", "Allen & Heath"],
  ["heath", "Allen & Heath"],
  ["yamaha", "Yamaha"],
  ["shure", "Shure"],
  ["audio-technica", "Audio-Technica"],
  ["focusrite", "Focusrite"],
  ["presonus", "PreSonus"],
  ["motu", "MOTU"],
  ["rme", "RME"],
  ["logitech", "Logitech"],
  ["blue", "Blue"],
  ["rode", "Rode"],
  ["elgato", "Elgato"],
];

function guessManufacturerFromLabel(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [token, name] of MANUFACTURER_HINTS) {
    if (lower.includes(token)) return name;
  }
  return null;
}

function connectionTypeFromLabel(label: string): DiscoveredSoundDevice["connectionType"] {
  const lower = label.toLowerCase();
  if (lower.includes("usb") || lower.includes("focusrite") || lower.includes("motu")) return "usb";
  return "browser";
}

function levelsFromAnalyser(data: Float32Array): SoundLevelsSnapshot {
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = Math.abs(data[i] ?? 0);
    peak = Math.max(peak, v);
    sum += v * v;
  }
  const rms = Math.sqrt(sum / data.length);
  const dbRms = 20 * Math.log10(Math.max(rms, 1e-9));
  const dbPeak = 20 * Math.log10(Math.max(peak, 1e-9));
  const normalized = Math.max(0, Math.min(100, ((dbRms + 60) / 60) * 100));
  return {
    inputLevel: Math.round(normalized * 10) / 10,
    peak: Math.round(dbPeak * 10) / 10,
    rms: Math.round(dbRms * 10) / 10,
    clipping: peak >= 0.99,
    signalPresent: dbRms > -50,
  };
}

export type BrowserAudioMonitorHandle = {
  readLevels: () => SoundLevelsSnapshot;
  stop: () => void;
  sampleRate: number | null;
  channelCount: number | null;
};

let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): { ctx: AudioContext; created: boolean } {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser.");
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio API is not supported in this browser.");

  let created = false;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new Ctor();
    created = true;
  }
  if (sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }
  return { ctx: sharedAudioContext, created };
}

/** Optional warm-up on first user gesture — avoids ctor cost during wizard transitions. */
export function warmBrowserAudioContext(): void {
  try {
    getSharedAudioContext();
  } catch {
    /* unsupported */
  }
}

export async function requestMicrophonePermission(): Promise<{
  granted: boolean;
  denied: boolean;
  message: string;
  defaultDeviceId: string | null;
  sampleRate: number | null;
  channelCount: number | null;
}> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      denied: false,
      message: "This browser does not support microphone access.",
      defaultDeviceId: null,
      sampleRate: null,
      channelCount: null,
    };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings();
    const deviceId = settings?.deviceId ?? null;
    stream.getTracks().forEach((t) => t.stop());
    return {
      granted: true,
      denied: false,
      message: "Microphone access granted.",
      defaultDeviceId: deviceId,
      sampleRate: settings?.sampleRate ?? 48000,
      channelCount: settings?.channelCount ?? 1,
    };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Microphone permission failed.";
    const denied = raw.toLowerCase().includes("notallowed") || raw.toLowerCase().includes("permission");
    return {
      granted: false,
      denied,
      message: denied
        ? "Microphone access is required to detect audio devices."
        : raw,
      defaultDeviceId: null,
      sampleRate: null,
      channelCount: null,
    };
  }
}

export async function discoverBrowserAudioInputs(defaultDeviceId?: string | null): Promise<DiscoveredSoundDevice[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "audioinput")
      .map((d, index) => {
        const label = d.label || `Microphone ${index + 1}`;
        return {
          id: `browser:${d.deviceId || index}`,
          label,
          connectionType: connectionTypeFromLabel(label),
          hardwareLabel: label,
          deviceIndex: index,
          browserDeviceId: d.deviceId || null,
          manufacturer: guessManufacturerFromLabel(label),
          model: null,
          sampleRate: 48000,
          channels: 1,
          status: "available",
          source: "browser",
          isDefault: Boolean(defaultDeviceId && d.deviceId === defaultDeviceId),
        } as DiscoveredSoundDevice & { isDefault?: boolean };
      });
  } catch {
    return [];
  }
}

export async function openBrowserAudioMonitor(deviceId: string): Promise<BrowserAudioMonitorHandle> {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: deviceId } },
  });
  const track = stream.getAudioTracks()[0];
  const settings = track?.getSettings();
  const { ctx, created } = getSharedAudioContext();
  // #region agent log
  fetch('http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'675ed0'},body:JSON.stringify({sessionId:'675ed0',hypothesisId:'C',location:'browser.ts:openBrowserAudioMonitor',message:created?'AudioContext created':'AudioContext reused',data:{deviceIdPrefix:deviceId.slice(0,8),created,reused:!created,elapsedMs:typeof performance!=='undefined'?Math.round(performance.now()-t0):0},timestamp:Date.now(),runId:'post-fix'})}).catch(()=>{});
  // #endregion
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const data = new Float32Array(analyser.fftSize);

  return {
    sampleRate: settings?.sampleRate ?? null,
    channelCount: settings?.channelCount ?? 1,
    readLevels: () => {
      analyser.getFloatTimeDomainData(data);
      return levelsFromAnalyser(data);
    },
    stop: () => {
      source.disconnect();
      analyser.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

export async function testBrowserAudioInput(deviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const monitor = await openBrowserAudioMonitor(deviceId);
    monitor.stop();
    return { success: true, message: "Microphone opened successfully." };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Microphone test failed.";
    if (raw.toLowerCase().includes("notallowed")) {
      return { success: false, message: "Microphone access was blocked. Allow microphone permission and try again." };
    }
    return { success: false, message: raw };
  }
}

export async function runBrowserSignalTest(
  deviceId: string,
  onLevels: (levels: SoundLevelsSnapshot) => void,
  options?: { minListenMs?: number; maxListenMs?: number },
): Promise<SoundTestResult> {
  const minListenMs = options?.minListenMs ?? 2500;
  const maxListenMs = options?.maxListenMs ?? 10000;
  let monitor: BrowserAudioMonitorHandle | null = null;

  try {
    monitor = await openBrowserAudioMonitor(deviceId);
    const started = performance.now();
    let best: SoundLevelsSnapshot = {
      inputLevel: 0,
      peak: -80,
      rms: -80,
      clipping: false,
      signalPresent: false,
    };
    let sawSignal = false;
    let sawClipping = false;

    while (performance.now() - started < maxListenMs) {
      const levels = monitor.readLevels();
      onLevels(levels);
      if (levels.signalPresent) sawSignal = true;
      if (levels.clipping) sawClipping = true;
      if (levels.rms > best.rms) best = { ...levels, sampleRate: monitor.sampleRate, channels: monitor.channelCount };

      const elapsed = performance.now() - started;
      if (elapsed >= minListenMs && sawSignal) break;

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    const steps = [
      { label: "Device opened", ok: true },
      { label: "Signal detected", ok: sawSignal },
      { label: "Audio level", ok: sawSignal },
      { label: "No clipping", ok: sawSignal && !sawClipping },
      { label: "Ready for Service", ok: sawSignal && !sawClipping },
    ];

    if (!sawSignal) {
      return {
        success: false,
        message: "No audio detected.",
        guidance:
          "Check that the microphone is plugged in, unmuted in Windows or macOS sound settings, and not muted on a mixer channel.",
        steps,
        levels: { ...best, sampleRate: monitor.sampleRate, channels: monitor.channelCount },
        sampleRate: monitor.sampleRate,
        channels: monitor.channelCount,
      };
    }

    return {
      success: true,
      message: "Audio detected.",
      steps,
      levels: { ...best, sampleRate: monitor.sampleRate, channels: monitor.channelCount },
      sampleRate: monitor.sampleRate,
      channels: monitor.channelCount,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Could not open the microphone.",
      steps: [{ label: "Device opened", ok: false }],
    };
  } finally {
    monitor?.stop();
  }
}

/** @deprecated Use openBrowserAudioMonitor for sustained metering */
export async function readBrowserAudioLevels(deviceId: string, ms = 400): Promise<SoundLevelsSnapshot & { success: boolean; message?: string }> {
  try {
    const monitor = await openBrowserAudioMonitor(deviceId);
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = () => {
        if (performance.now() - start >= ms) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    const levels = monitor.readLevels();
    monitor.stop();
    return { success: true, ...levels, sampleRate: monitor.sampleRate, channels: monitor.channelCount };
  } catch (error) {
    return {
      success: false,
      inputLevel: 0,
      peak: 0,
      rms: 0,
      clipping: false,
      signalPresent: false,
      message: error instanceof Error ? error.message : "Could not read audio levels.",
    };
  }
}
