import type {
  InternetDetectResult,
  InternetSetupSaveInput,
  InternetSpeedTestResult,
  PreferredChurchNetwork,
  WiFiNetwork,
} from "@/lib/internet/types";
import { logInternetError, sanitizeInternetError } from "@/lib/internet/errors";

async function internetFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const raw = (body as { error?: string }).error ?? "Request failed.";
    logInternetError(`${init?.method ?? "GET"} ${path}`, raw);
    throw new Error(sanitizeInternetError(raw));
  }
  return body as T;
}

export async function detectInternetApi(): Promise<InternetDetectResult> {
  return internetFetch<InternetDetectResult>("/api/v1/internet/detect");
}

export async function scanWifiNetworksApi(): Promise<WiFiNetwork[]> {
  return internetFetch<{ networks: WiFiNetwork[] }>("/api/v1/internet/wifi/scan").then((r) => r.networks);
}

export async function connectWifiApi(ssid: string, password: string): Promise<{ success: boolean; message: string }> {
  return internetFetch("/api/v1/internet/wifi/connect", {
    method: "POST",
    body: JSON.stringify({ ssid, password }),
  });
}

export async function reconnectInternetApi(): Promise<{ success: boolean; message: string }> {
  return internetFetch("/api/v1/internet/reconnect", { method: "POST" });
}

export async function runInternetSpeedTestApi(): Promise<InternetSpeedTestResult> {
  return internetFetch<InternetSpeedTestResult>("/api/v1/internet/test", { method: "POST" });
}

export async function saveInternetSetupApi(input: InternetSetupSaveInput): Promise<{ success: boolean; message: string }> {
  return internetFetch("/api/v1/internet/setup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function savePreferredNetworkApi(network: PreferredChurchNetwork): Promise<void> {
  await internetFetch("/api/v1/equipment/profile", {
    method: "PATCH",
    body: JSON.stringify({ preferredNetwork: network }),
  });
}
