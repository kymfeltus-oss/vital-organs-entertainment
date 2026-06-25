import { proxyAudioService } from "@/lib/audio/service-proxy";
import type {
  InternetDetectResult,
  InternetSpeedTestResult,
  WiFiNetwork,
} from "@/lib/internet/types";

type AgentDetect = {
  online: boolean;
  connection_type: string | null;
  ssid: string | null;
  local_ip: string | null;
  internet_reachable: boolean;
  ethernet_connected: boolean | null;
  agent_available: boolean;
};

type AgentSpeedTest = {
  success: boolean;
  upload_mbps: number;
  download_mbps: number;
  latency_ms: number;
  jitter_ms?: number;
  packet_loss_percent?: number;
  stability_score: number;
  streaming_quality: string;
  message: string;
};

function mapDetect(raw: AgentDetect): InternetDetectResult {
  return {
    online: raw.online,
    connectionType: (raw.connection_type as InternetDetectResult["connectionType"]) ?? null,
    ssid: raw.ssid,
    localIp: raw.local_ip,
    internetReachable: raw.internet_reachable,
    ethernetConnected: raw.ethernet_connected,
    agentAvailable: raw.agent_available,
  };
}

function mapSpeedTest(raw: AgentSpeedTest): InternetSpeedTestResult {
  return {
    success: raw.success,
    uploadMbps: raw.upload_mbps,
    downloadMbps: raw.download_mbps,
    latencyMs: raw.latency_ms,
    jitterMs: raw.jitter_ms,
    packetLossPercent: raw.packet_loss_percent,
    stabilityScore: raw.stability_score,
    streamingQuality: raw.streaming_quality as InternetSpeedTestResult["streamingQuality"],
    message: raw.message,
  };
}

export async function agentDetectNetwork(): Promise<InternetDetectResult> {
  const raw = await proxyAudioService<AgentDetect>("/network/detect");
  return mapDetect(raw);
}

export async function agentScanWifi(): Promise<WiFiNetwork[]> {
  const raw = await proxyAudioService<{ networks: { ssid: string; signal_strength: number | null; secured: boolean }[] }>(
    "/network/wifi/scan",
  );
  return raw.networks.map((n) => ({
    ssid: n.ssid,
    signalStrength: n.signal_strength,
    secured: n.secured,
  }));
}

export async function agentConnectWifi(ssid: string, password: string): Promise<{ success: boolean; message: string }> {
  return proxyAudioService("/network/wifi/connect", {
    method: "POST",
    body: { ssid, password },
  });
}

export async function agentReconnectWifi(ssid: string): Promise<{ success: boolean; message: string }> {
  return proxyAudioService("/network/wifi/reconnect", {
    method: "POST",
    body: { ssid, password: "" },
  });
}

export async function agentSpeedTest(): Promise<InternetSpeedTestResult> {
  const raw = await proxyAudioService<AgentSpeedTest>("/network/speed-test", { method: "POST" });
  return mapSpeedTest(raw);
}

export function isNetworkAgentConfigured(): boolean {
  return Boolean(process.env.AUDIO_SERVICE_URL || process.env.NEXT_PUBLIC_AUDIO_WS_URL);
}
