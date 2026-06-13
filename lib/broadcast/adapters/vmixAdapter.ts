import {
  getVmixApiBaseUrl,
  getVmixStingerInputNumber,
  isBroadcastDevMode,
  VMIX_FETCH_TIMEOUT_MS,
} from "@/lib/broadcast/config";
import {
  getMockVmixSnapshot,
  updateMockStreamHealthSnapshot,
  updateMockVmixSnapshot,
} from "@/lib/broadcast/adapters/mockSnapshots";
import type {
  VmixAdapterSnapshot,
  VmixCommandRequest,
  VmixInput,
} from "@/lib/broadcast/adapters/types";

function vmixSourceId(inputNumber: number): string {
  return `vmix-${inputNumber}`;
}

function isValidVmixResponse(xml: string): boolean {
  return /<version\b/i.test(xml) || /<inputs\b/i.test(xml);
}

function parseVmixInputs(xml: string): VmixInput[] {
  const inputs: VmixInput[] = [];
  const blockPattern = /<input\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null = blockPattern.exec(xml);

  while (match) {
    const attrs = match[1];
    const key = attrs.match(/\bkey="([^"]*)"/i)?.[1] ?? "";
    const number = Number(attrs.match(/\bnumber="(\d+)"/i)?.[1] ?? "0");
    const title = attrs.match(/\btitle="([^"]*)"/i)?.[1]?.trim() ?? `Input ${number}`;
    const type = attrs.match(/\btype="([^"]*)"/i)?.[1]?.trim() ?? "Unknown";
    const muted = /\bmuted="True"/i.test(attrs);
    const volume = Number(attrs.match(/\bvolume="([^"]*)"/i)?.[1] ?? "100");
    const meterF1 = Number(attrs.match(/\bmeterF1="([^"]*)"/i)?.[1] ?? "0");

    if (number > 0) {
      inputs.push({
        key,
        number,
        title,
        type,
        muted,
        volume: Number.isFinite(volume) ? volume : 100,
        meterLevel: Number.isFinite(meterF1) ? Math.round(meterF1 * 100) : 0,
        online: !/state="Offline"/i.test(attrs) && !/state="Paused"/i.test(attrs),
      });
    }

    match = blockPattern.exec(xml);
  }

  return inputs.sort((a, b) => a.number - b.number);
}

function parseVmixSnapshot(xml: string): Omit<VmixAdapterSnapshot, "ok" | "source" | "error"> {
  const version = xml.match(/<version>([^<]*)<\/version>/i)?.[1]?.trim() ?? null;
  const activeTitle = xml.match(/<active>([^<]*)<\/active>/i)?.[1]?.trim() ?? null;
  const previewTitle = xml.match(/<preview>([^<]*)<\/preview>/i)?.[1]?.trim() ?? null;
  const inputs = parseVmixInputs(xml);

  const activeInput = inputs.find((input) => input.title === activeTitle) ?? null;
  const previewInput = inputs.find((input) => input.title === previewTitle) ?? null;

  return {
    fetchedAt: new Date().toISOString(),
    version,
    inputs,
    activeInputNumber: activeInput?.number ?? null,
    activeInputTitle: activeTitle,
    previewInputNumber: previewInput?.number ?? null,
    previewInputTitle: previewTitle,
    isRecording: /<recording>True<\/recording>/i.test(xml),
    isStreaming: /<streaming>True<\/streaming>/i.test(xml),
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

function unavailableSnapshot(error: string): VmixAdapterSnapshot {
  return {
    ok: false,
    source: "unavailable",
    error,
    fetchedAt: new Date().toISOString(),
    version: null,
    inputs: [],
    activeInputNumber: null,
    activeInputTitle: null,
    previewInputNumber: null,
    previewInputTitle: null,
    isRecording: false,
    isStreaming: false,
  };
}

export async function getVmixAdapterSnapshot(): Promise<VmixAdapterSnapshot> {
  const baseUrl = getVmixApiBaseUrl();

  if (!baseUrl) {
    if (isBroadcastDevMode()) {
      return getMockVmixSnapshot();
    }
    return unavailableSnapshot("VMIX_API_BASE_URL is not configured.");
  }

  try {
    const xml = await fetchVmixXml(baseUrl);
    return {
      ok: true,
      source: "live",
      error: null,
      ...parseVmixSnapshot(xml),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "vMix unreachable.";
    if (isBroadcastDevMode()) {
      return { ...getMockVmixSnapshot(), error: message };
    }
    return unavailableSnapshot(message);
  }
}

export async function runVmixBroadcastCommand(
  request: VmixCommandRequest,
): Promise<VmixAdapterSnapshot> {
  const baseUrl = getVmixApiBaseUrl();

  if (!baseUrl) {
    if (isBroadcastDevMode()) {
      return updateMockVmixSnapshot((mock) => {
        if (request.action === "set_preview" && request.inputNumber) {
          const input = mock.inputs.find((i) => i.number === request.inputNumber);
          mock.previewInputNumber = request.inputNumber;
          mock.previewInputTitle = input?.title ?? null;
        }
        if (
          (request.action === "cut" ||
            request.action === "take" ||
            request.action === "fade" ||
            request.action === "stinger") &&
          mock.previewInputNumber
        ) {
          mock.activeInputNumber = mock.previewInputNumber;
          mock.activeInputTitle = mock.previewInputTitle;
        }
        if (request.action === "start_streaming") {
          mock.isStreaming = true;
          updateMockStreamHealthSnapshot((stream) => ({
            ...stream,
            destinations: stream.destinations.map((dest) =>
              dest.connected
                ? { ...dest, live: true, bitrateKbps: 5600 }
                : dest,
            ),
          }));
        }
        if (request.action === "stop_streaming") {
          mock.isStreaming = false;
          updateMockStreamHealthSnapshot((stream) => ({
            ...stream,
            destinations: stream.destinations.map((dest) => ({
              ...dest,
              live: false,
              bitrateKbps: 0,
            })),
          }));
        }
        if (request.action === "start_recording") mock.isRecording = true;
        if (request.action === "stop_recording") mock.isRecording = false;
        return mock;
      });
    }
    return unavailableSnapshot("VMIX_API_BASE_URL is not configured.");
  }

  try {
    switch (request.action) {
      case "refresh":
        break;
      case "set_preview":
        if (!request.inputNumber) throw new Error("inputNumber required for set_preview.");
        await callVmixFunction(baseUrl, "PreviewInput", {
          Input: String(request.inputNumber),
        });
        break;
      case "cut":
      case "take":
        await callVmixFunction(baseUrl, "Cut");
        break;
      case "fade":
        await callVmixFunction(baseUrl, "Fade");
        break;
      case "stinger": {
        const stingerInput = getVmixStingerInputNumber();
        if (stingerInput) {
          await callVmixFunction(baseUrl, "PlayInput", { Input: String(stingerInput) });
        } else {
          await callVmixFunction(baseUrl, "Fade");
        }
        break;
      }
      case "start_streaming":
        await callVmixFunction(baseUrl, "StartStreaming");
        break;
      case "stop_streaming":
        await callVmixFunction(baseUrl, "StopStreaming");
        break;
      case "start_recording":
        await callVmixFunction(baseUrl, "StartRecording");
        break;
      case "stop_recording":
        await callVmixFunction(baseUrl, "StopRecording");
        break;
      default:
        break;
    }

    const xml = await fetchVmixXml(baseUrl);
    return {
      ok: true,
      source: "live",
      error: null,
      ...parseVmixSnapshot(xml),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "vMix command failed.";
    return unavailableSnapshot(message);
  }
}

export function resolveVmixSourceId(inputNumber: number | null): string | null {
  if (!inputNumber) return null;
  return vmixSourceId(inputNumber);
}

export function parseVmixInputNumberFromSourceId(sourceId: string | null): number | null {
  if (!sourceId?.startsWith("vmix-")) return null;
  const n = Number(sourceId.replace("vmix-", ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function inferConnectionType(vmixType: string): import("@/lib/broadcast/types").SourceConnectionType {
  const t = vmixType.toLowerCase();
  if (t.includes("ndi")) return "ndi";
  if (t.includes("srt")) return "srt";
  if (t.includes("stream") || t.includes("rtmp")) return "rtmp";
  if (t.includes("browser") || t.includes("webcam") || t.includes("video capture")) return "webcam";
  return "hdmi";
}

export { vmixSourceId };
