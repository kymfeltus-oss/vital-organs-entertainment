import { proxyAudioService, isAudioServiceConfigured } from "@/lib/audio/service-proxy";

async function callVmixFunction(fn: string): Promise<boolean> {
  const baseUrl = process.env.VMIX_API_BASE_URL?.trim();
  if (!baseUrl) return false;
  const response = await fetch(`${baseUrl}?Function=${encodeURIComponent(fn)}`, {
    method: "GET",
    cache: "no-store",
  });
  return response.ok;
}

export async function stopLocalEncoder(): Promise<{ success: boolean; message: string }> {
  let stopped = false;
  const messages: string[] = [];

  if (process.env.VMIX_API_BASE_URL?.trim()) {
    const streamOk = await callVmixFunction("StopStreaming");
    const recordOk = await callVmixFunction("StopRecording");
    stopped = streamOk || recordOk;
    messages.push(streamOk || recordOk ? "vMix encoder stopped." : "Could not reach vMix encoder.");
  }

  if (isAudioServiceConfigured()) {
    try {
      const raw = await proxyAudioService<{ success: boolean; message: string }>("/streaming/encoder/stop", {
        method: "POST",
        body: {},
      });
      if (raw.success) {
        stopped = true;
        messages.push(raw.message);
      }
    } catch {
      messages.push("Local streaming agent did not respond.");
    }
  }

  if (!stopped && messages.length === 0) {
    return { success: false, message: "No local encoder is configured on this production machine." };
  }

  return {
    success: stopped,
    message: messages.join(" ") || "Encoder stop requested.",
  };
}

export async function startLocalEncoder(input: {
  destinationId: string;
  streamUrl?: string | null;
  streamKey?: string | null;
}): Promise<{ success: boolean; message: string }> {
  if (process.env.VMIX_API_BASE_URL?.trim()) {
    const ok = await callVmixFunction("StartStreaming");
    return ok
      ? { success: true, message: "vMix streaming started." }
      : { success: false, message: "Could not start vMix streaming." };
  }

  if (isAudioServiceConfigured()) {
    const raw = await proxyAudioService<{ success: boolean; message: string }>("/streaming/encoder/start", {
      method: "POST",
      body: {
        destination_id: input.destinationId,
        stream_url: input.streamUrl ?? null,
        stream_key: input.streamKey ?? null,
      },
    });
    return { success: raw.success, message: raw.message };
  }

  return { success: false, message: "No local encoder is configured on this production machine." };
}

export async function prepareLocalEncoder(input: {
  destinationId: string;
  streamUrl?: string | null;
  streamKey?: string | null;
}): Promise<{ success: boolean; message: string }> {
  if (!isAudioServiceConfigured()) {
    if (process.env.VMIX_API_BASE_URL?.trim()) {
      return { success: true, message: "vMix encoder ready." };
    }
    return { success: false, message: "No local encoder is configured on this production machine." };
  }

  const raw = await proxyAudioService<{ success: boolean; message: string }>("/streaming/encoder/prepare", {
    method: "POST",
    body: {
      destination_id: input.destinationId,
      stream_url: input.streamUrl ?? null,
      stream_key: input.streamKey ?? null,
    },
  });
  return { success: raw.success, message: raw.message };
}

export async function encoderHealthCheck(): Promise<{ online: boolean; message: string }> {
  if (process.env.VMIX_API_BASE_URL?.trim()) {
    try {
      const response = await fetch(process.env.VMIX_API_BASE_URL, { cache: "no-store" });
      return { online: response.ok, message: response.ok ? "vMix online." : "vMix unreachable." };
    } catch {
      return { online: false, message: "vMix unreachable." };
    }
  }

  if (!isAudioServiceConfigured()) {
    return { online: false, message: "No local encoder configured." };
  }

  try {
    const raw = await proxyAudioService<{ online: boolean; message: string }>("/streaming/encoder/health");
    return { online: raw.online, message: raw.message };
  } catch {
    return { online: false, message: "Local streaming agent unavailable." };
  }
}

export async function detectEncoders(): Promise<import("@/lib/streaming/types").StreamingEncoderDetectResult> {
  if (!isAudioServiceConfigured()) {
    return {
      detectedEncoders: ["x264"],
      recommended: "x264",
      gpuName: null,
      cpuName: null,
      av1Supported: false,
    };
  }
  try {
    return await proxyAudioService("/streaming/encoder/detect");
  } catch {
    return {
      detectedEncoders: ["x264"],
      recommended: "x264",
      gpuName: null,
      cpuName: null,
      av1Supported: false,
    };
  }
}

export async function getEncoderPreviewStats(
  destinationId: string,
): Promise<import("@/lib/streaming/types").StreamingPreviewStats> {
  if (!isAudioServiceConfigured() && !process.env.VMIX_API_BASE_URL?.trim()) {
    return {
      online: false,
      message: "No encoder configured on this production machine.",
      droppedFrames: 0,
      currentBitrateKbps: 0,
      currentFps: 0,
      encoderUsagePercent: 0,
      gpuUsagePercent: 0,
      cpuUsagePercent: 0,
      networkThroughputMbps: 0,
      audioLevels: { left: 0, right: 0 },
    };
  }
  try {
    const raw = await proxyAudioService<{
      online: boolean;
      message: string;
      droppedFrames: number;
      currentBitrateKbps: number;
      currentFps: number;
      encoderUsagePercent: number;
      gpuUsagePercent: number;
      cpuUsagePercent: number;
      networkThroughputMbps: number;
      audioLevels: { left: number; right: number };
    }>(`/streaming/encoder/preview-stats?destination_id=${encodeURIComponent(destinationId)}`);
    return raw;
  } catch {
    return {
      online: false,
      message: "Could not load encoder preview stats.",
      droppedFrames: 0,
      currentBitrateKbps: 0,
      currentFps: 0,
      encoderUsagePercent: 0,
      gpuUsagePercent: 0,
      cpuUsagePercent: 0,
      networkThroughputMbps: 0,
      audioLevels: { left: 0, right: 0 },
    };
  }
}
