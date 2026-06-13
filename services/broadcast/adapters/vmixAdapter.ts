import {
  getVmixApiBaseUrl,
  getVmixStingerInputNumber,
  VMIX_DEFAULT_BASE_URL,
  VMIX_FETCH_TIMEOUT_MS,
} from "@/services/broadcast/config";
import { BaseBroadcastAdapter } from "@/services/broadcast/adapters/BaseBroadcastAdapter";
import type { AudioChannelTelemetry, HardwareSource, SourceProtocol } from "@/lib/broadcast/types";

export type VmixParsedInput = {
  key: string;
  number: number;
  title: string;
  type: string;
  online: boolean;
  volume: number | null;
  muted: boolean | null;
  meterF1: number | null;
};

export type VmixAdapterSnapshot = {
  ok: boolean;
  sources: HardwareSource[];
  previewInputNumber: number | null;
  previewSourceId: string | null;
  programInputNumber: number | null;
  programSourceId: string | null;
  isStreaming: boolean;
  isRecording: boolean;
  /** Parsed from vMix XML when meter/volume attrs exist; empty when unavailable. */
  audioChannels: AudioChannelTelemetry[];
  audioTelemetryAvailable: boolean;
  error: string | null;
  fetchedAt: string | null;
};

function emptySnapshot(error: string | null = null): VmixAdapterSnapshot {
  return {
    ok: false,
    sources: [],
    previewInputNumber: null,
    previewSourceId: null,
    programInputNumber: null,
    programSourceId: null,
    isStreaming: false,
    isRecording: false,
    audioChannels: [],
    audioTelemetryAvailable: false,
    error,
    fetchedAt: null,
  };
}

function vmixSourceId(inputNumber: number): string {
  return `vmix-${inputNumber}`;
}

function isValidVmixResponse(xml: string): boolean {
  return /<version\b/i.test(xml) || /<inputs\b/i.test(xml);
}

function inferProtocol(vmixType: string): SourceProtocol {
  const t = vmixType.toLowerCase();
  if (t.includes("ndi")) return "ndi";
  if (t.includes("srt")) return "srt";
  if (t.includes("stream") || t.includes("rtmp")) return "rtmp";
  if (t.includes("browser") || t.includes("webcam") || t.includes("video capture")) {
    return "webcam";
  }
  if (t.includes("hdmi") || t.includes("capture")) return "hdmi";
  return "unknown";
}

function parseOptionalNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function meterToLevels(meterF1: number | null): { meterLevel: number; peakDb: number } | null {
  if (meterF1 === null) return null;
  const meterLevel = Math.round(Math.max(0, Math.min(100, meterF1 * 100)));
  const peakDb = (meterLevel / 100) * 60 - 60;
  return { meterLevel, peakDb };
}

function parseVmixInputs(xml: string): VmixParsedInput[] {
  const inputs: VmixParsedInput[] = [];
  const blockPattern = /<input\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null = blockPattern.exec(xml);

  while (match) {
    const attrs = match[1];
    const number = Number(attrs.match(/\bnumber="(\d+)"/i)?.[1] ?? "0");
    const title = attrs.match(/\btitle="([^"]*)"/i)?.[1]?.trim() ?? `Input ${number}`;
    const type = attrs.match(/\btype="([^"]*)"/i)?.[1]?.trim() ?? "Unknown";
    const key = attrs.match(/\bkey="([^"]*)"/i)?.[1] ?? "";
    const volume = parseOptionalNumber(attrs.match(/\bvolume="([^"]*)"/i)?.[1]);
    const meterF1 = parseOptionalNumber(attrs.match(/\bmeterF1="([^"]*)"/i)?.[1]);
    const mutedMatch = attrs.match(/\bmuted="([^"]*)"/i)?.[1];
    const muted =
      mutedMatch === undefined ? null : mutedMatch.toLowerCase() === "true";

    if (number > 0) {
      inputs.push({
        key,
        number,
        title,
        type,
        online: !/state="Offline"/i.test(attrs) && !/state="Paused"/i.test(attrs),
        volume,
        muted,
        meterF1,
      });
    }

    match = blockPattern.exec(xml);
  }

  return inputs.sort((a, b) => a.number - b.number);
}

function mapToHardwareSources(inputs: VmixParsedInput[]): HardwareSource[] {
  const now = new Date().toISOString();

  return inputs.map((input) => ({
    id: vmixSourceId(input.number),
    name: input.title,
    protocol: inferProtocol(input.type),
    online: input.online,
    lastHeartbeatAt: now,
    resolution: null,
    fps: null,
    signalStrength: input.online ? 88 : 0,
    isDark: false,
    isOverexposed: false,
    healthStatus: input.online ? "green" : "red",
    adapterId: "vmix" as const,
    vmixInputNumber: input.number,
  }));
}

function mapToAudioChannels(inputs: VmixParsedInput[]): {
  channels: AudioChannelTelemetry[];
  available: boolean;
} {
  const channels: AudioChannelTelemetry[] = [];
  let available = false;

  for (const input of inputs) {
    const levels = meterToLevels(input.meterF1);
    const hasMeter = levels !== null;
    const hasVolume = input.volume !== null;
    if (!hasMeter && !hasVolume) continue;

    available = true;
    const meterLevel = levels?.meterLevel ?? 0;
    const peakDb = levels?.peakDb ?? -Infinity;
    const volume = input.volume ?? 100;
    const muted = input.muted ?? false;
    const silent = muted || (hasMeter && meterLevel < 4);

    channels.push({
      id: `vmix-audio-${input.number}`,
      name: input.title,
      peakDb,
      rmsDb: peakDb - 12,
      volume,
      muted,
      clipping: hasMeter && meterLevel >= 95,
      silent,
      autoGain: false,
      meterLevel,
    });
  }

  const masterInput = inputs.find((input) => /master/i.test(input.title));
  const masterLevels = masterInput ? meterToLevels(masterInput.meterF1) : null;
  if (masterInput && masterLevels) {
    channels.unshift({
      id: "vmix-master",
      name: "Master Stream Output",
      peakDb: masterLevels.peakDb,
      rmsDb: masterLevels.peakDb - 10,
      volume: masterInput.volume ?? 100,
      muted: masterInput.muted ?? false,
      clipping: masterLevels.meterLevel >= 95,
      silent: masterLevels.meterLevel < 4,
      autoGain: false,
      meterLevel: masterLevels.meterLevel,
    });
    available = true;
  }

  return { channels, available };
}

function parseVmixXml(xml: string): Omit<VmixAdapterSnapshot, "ok" | "error"> {
  const inputs = parseVmixInputs(xml);
  const sources = mapToHardwareSources(inputs);
  const audio = mapToAudioChannels(inputs);
  const activeTitle = xml.match(/<active>([^<]*)<\/active>/i)?.[1]?.trim() ?? null;
  const previewTitle = xml.match(/<preview>([^<]*)<\/preview>/i)?.[1]?.trim() ?? null;

  const programInput = inputs.find((input) => input.title === activeTitle) ?? null;
  const previewInput = inputs.find((input) => input.title === previewTitle) ?? null;

  return {
    sources,
    previewInputNumber: previewInput?.number ?? null,
    previewSourceId: previewInput ? vmixSourceId(previewInput.number) : null,
    programInputNumber: programInput?.number ?? null,
    programSourceId: programInput ? vmixSourceId(programInput.number) : null,
    isStreaming: /<streaming>True<\/streaming>/i.test(xml),
    isRecording: /<recording>True<\/recording>/i.test(xml),
    audioChannels: audio.channels,
    audioTelemetryAvailable: audio.available,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchVmixXml(baseUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VMIX_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`vMix API returned ${response.status}.`);
    }

    const xml = await response.text();
    if (!isValidVmixResponse(xml)) {
      throw new Error("vMix response missing version or inputs.");
    }

    return xml;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callVmixFunction(
  baseUrl: string,
  functionName: string,
  params: Record<string, string> = {},
): Promise<void> {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/`);
  url.searchParams.set("Function", functionName);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VMIX_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`vMix command ${functionName} failed (${response.status}).`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export class VmixAdapter extends BaseBroadcastAdapter {
  private snapshot: VmixAdapterSnapshot = emptySnapshot();
  private resolvedBaseUrl: string | null = null;

  getSnapshot(): VmixAdapterSnapshot {
    return this.snapshot;
  }

  resolveBaseUrl(): string | null {
    return getVmixApiBaseUrl();
  }

  async connect(): Promise<void> {
    this.resolvedBaseUrl = this.resolveBaseUrl();
    if (!this.resolvedBaseUrl) {
      this.markUnavailable(
        `VMIX_API_BASE_URL not configured (reference: ${VMIX_DEFAULT_BASE_URL}).`,
      );
      this.snapshot = emptySnapshot(this.lastError);
      return;
    }

    await this.poll();
  }

  async disconnect(): Promise<void> {
    this.resolvedBaseUrl = null;
    this.markUnavailable("vMix adapter disconnected.");
    this.snapshot = emptySnapshot(this.lastError);
  }

  /** Poll vMix HTTP XML — never throws; marks Unavailable on failure. */
  async poll(): Promise<VmixAdapterSnapshot> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) {
      this.markUnavailable("VMIX_API_BASE_URL not configured.");
      this.snapshot = emptySnapshot(this.lastError);
      return this.snapshot;
    }

    this.resolvedBaseUrl = baseUrl;

    try {
      const xml = await fetchVmixXml(baseUrl);
      const parsed = parseVmixXml(xml);
      this.snapshot = {
        ok: true,
        error: null,
        ...parsed,
      };
      this.markConnected();
      return this.snapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : "vMix unreachable.";
      this.markUnavailable(message);
      this.snapshot = emptySnapshot(message);
      return this.snapshot;
    }
  }

  async getInputs(): Promise<HardwareSource[]> {
    if (!this.snapshot.ok) {
      await this.poll();
    }
    return this.snapshot.sources;
  }

  async setPreview(inputNumber: number): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl || inputNumber <= 0) {
      this.lastError = "setPreview requires configured vMix and valid input number.";
      return;
    }

    try {
      await callVmixFunction(baseUrl, "PreviewInput", { Input: String(inputNumber) });
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "setPreview failed.";
    }
  }

  /** @deprecated Use setPreview */
  async setPreviewInput(inputNumber: number): Promise<void> {
    return this.setPreview(inputNumber);
  }

  async setProgramInput(inputNumber: number): Promise<void> {
    await this.setPreview(inputNumber);
    await this.cut();
  }

  async cut(): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) {
      this.lastError = "cut() requires configured vMix.";
      return;
    }

    try {
      await callVmixFunction(baseUrl, "Cut");
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "cut() failed.";
    }
  }

  async fade(): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) {
      this.lastError = "fade() requires configured vMix.";
      return;
    }

    try {
      await callVmixFunction(baseUrl, "Fade");
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "fade() failed.";
    }
  }

  async triggerStinger(): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) {
      this.lastError = "triggerStinger() requires configured vMix.";
      return;
    }

    const stingerInput = getVmixStingerInputNumber();
    try {
      if (stingerInput) {
        await callVmixFunction(baseUrl, "PlayInput", { Input: String(stingerInput) });
      } else {
        await callVmixFunction(baseUrl, "Fade");
      }
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "triggerStinger failed.";
    }
  }

  async getStreamingStatus(): Promise<{ streaming: boolean }> {
    if (!this.snapshot.ok) {
      await this.poll();
    }
    return { streaming: this.snapshot.isStreaming };
  }

  async getRecordingStatus(): Promise<{ recording: boolean }> {
    if (!this.snapshot.ok) {
      await this.poll();
    }
    return { recording: this.snapshot.isRecording };
  }

  async startStreaming(): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) return;
    try {
      await callVmixFunction(baseUrl, "StartStreaming");
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "StartStreaming failed.";
    }
  }

  async stopStreaming(): Promise<void> {
    const baseUrl = this.resolvedBaseUrl ?? this.resolveBaseUrl();
    if (!baseUrl) return;
    try {
      await callVmixFunction(baseUrl, "StopStreaming");
      await this.poll();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "StopStreaming failed.";
    }
  }
}

export { vmixSourceId };
