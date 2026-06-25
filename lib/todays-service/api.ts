import type {
  BeginServiceResult,
  Camera,
  InternetConnection,
  PresentationSource,
  RecordingSetting,
  ServiceAlert,
  ServiceEquipment,
  ServiceRecord,
  ServiceTimelineItem,
  SoundItem,
  StreamingDestination,
  TeamMember,
  TestResult,
  TodaysServicePayload,
} from "@/lib/todays-service/types";
import type { ServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import { normalizeServiceStartTime } from "@/lib/todays-service/service-header";
import type {
  LastConnectedMixer,
  MixerAudioDetectionResult,
  MixerConnectionConfig,
  MixerHealthCheckResult,
  MixerImportOptions,
  MixerImportResult,
  MixerScanResult,
  MixerTestResult,
} from "@/lib/todays-service/mixer-types";
import type { MixerAutoCheckResult } from "@/lib/todays-service/mixer-connection";
import type { Mixer, MixerConnectionType } from "@/lib/todays-service/types";

async function serviceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Request failed.");
  }
  return body as T;
}

export function buildTodaysServiceLiveUrl(): string {
  if (typeof window === "undefined") return "/api/v1/todays-service/live";
  return `${window.location.origin}/api/v1/todays-service/live`;
}

export async function fetchTodaysService(): Promise<TodaysServicePayload> {
  return serviceFetch<TodaysServicePayload>("/api/v1/todays-service");
}

export async function patchTodaysService(patch: ServiceHeaderUpdate): Promise<TodaysServicePayload> {
  const payload = {
    ...patch,
    serviceStartTime: normalizeServiceStartTime(patch.serviceStartTime),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[TODAYS_SERVICE] PATCH /api/v1/todays-service request:", payload);
  }

  const result = await serviceFetch<TodaysServicePayload>("/api/v1/todays-service", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[TODAYS_SERVICE] PATCH /api/v1/todays-service response service:", result.service);
  }

  return result;
}

export async function patchTodaysServiceBroadcastProfile(input: {
  id: string;
  broadcastProfile: string;
}): Promise<TodaysServicePayload> {
  const payload = {
    id: input.id,
    broadcastProfile: input.broadcastProfile.trim(),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[TODAYS_SERVICE] PATCH /api/v1/todays-service broadcast profile:", payload);
  }

  const result = await serviceFetch<TodaysServicePayload>("/api/v1/todays-service", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[TODAYS_SERVICE] PATCH broadcast profile response:", result.service.broadcastProfile);
  }

  return result;
}

export async function refreshReadinessCheck(): Promise<TodaysServicePayload> {
  return serviceFetch<TodaysServicePayload>("/api/v1/todays-service", {
    method: "POST",
    body: JSON.stringify({ action: "refresh" }),
  });
}

export async function fetchEquipment(): Promise<ServiceEquipment[]> {
  return serviceFetch<{ items: ServiceEquipment[] }>("/api/v1/equipment").then((r) => r.items);
}

export async function createEquipmentApi(input: Partial<ServiceEquipment>): Promise<ServiceEquipment> {
  return serviceFetch<{ item: ServiceEquipment }>("/api/v1/equipment", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateEquipmentApi(id: string, patch: Partial<ServiceEquipment>): Promise<ServiceEquipment> {
  return serviceFetch<{ item: ServiceEquipment }>(`/api/v1/equipment/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteEquipmentApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/equipment/${id}`, { method: "DELETE" });
}

export async function testEquipmentApi(id: string): Promise<TestResult> {
  return serviceFetch<TestResult>(`/api/v1/equipment/${id}/test`, { method: "POST" });
}

export async function fetchSoundItems(): Promise<SoundItem[]> {
  return serviceFetch<{ items: SoundItem[] }>("/api/v1/sound").then((r) => r.items);
}

export async function createSoundItemApi(input: Partial<SoundItem>): Promise<SoundItem> {
  return serviceFetch<{ item: SoundItem }>("/api/v1/sound", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateSoundItemApi(id: string, patch: Partial<SoundItem>): Promise<SoundItem> {
  return serviceFetch<{ item: SoundItem }>(`/api/v1/sound/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteSoundItemApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/sound/${id}`, { method: "DELETE" });
}

export async function testSoundApi(): Promise<TestResult> {
  return serviceFetch<TestResult>("/api/v1/sound/test", { method: "POST" });
}

export async function connectMixerApi(input: {
  mixerId?: string;
  name: string;
  ipAddress: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
}): Promise<MixerTestResult & { details?: { mixerId: string } }> {
  return serviceFetch("/api/v1/mixers/connect", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function scanEthernetMixersApi(input?: {
  mixerType?: string;
  hintIps?: string[];
}): Promise<MixerScanResult> {
  return serviceFetch<MixerScanResult>("/api/v1/mixers/scan-ethernet", {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function testEthernetMixerApi(input: {
  ipAddress: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
}): Promise<MixerTestResult> {
  return serviceFetch<MixerTestResult>("/api/v1/mixers/test-ethernet", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function connectEthernetMixerApi(input: {
  mixerId?: string;
  name: string;
  ipAddress: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
}): Promise<{ success: boolean; message: string; mixer: Mixer; testResult?: MixerTestResult }> {
  return serviceFetch("/api/v1/mixers/connect-ethernet", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function scanUsbMixersApi(input: {
  devices: { deviceId: string; label: string }[];
}): Promise<{ success: boolean; devices: { deviceId: string; label: string }[] }> {
  return serviceFetch("/api/v1/mixers/scan-usb", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function connectUsbMixerApi(input: {
  mixerId?: string;
  name: string;
  mixerType?: string;
  usbDeviceName: string;
  usbDeviceId: string;
}): Promise<{ success: boolean; message: string; mixer: Mixer }> {
  return serviceFetch("/api/v1/mixers/connect-usb", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function mixerAutoCheckApi(input: {
  mixerType?: string;
  usbDevices: { deviceId: string; label: string }[];
}): Promise<MixerAutoCheckResult> {
  return serviceFetch<MixerAutoCheckResult>("/api/v1/mixers/auto-check", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function scanMixersApi(input?: {
  mixerType?: string;
  hintIps?: string[];
}): Promise<MixerScanResult> {
  return serviceFetch<MixerScanResult>("/api/v1/mixers/scan", {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export async function testMixerApi(input: {
  ipAddress: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
}): Promise<MixerTestResult> {
  return serviceFetch<MixerTestResult>("/api/v1/mixers/test", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function importMixerApi(input: {
  mixerId?: string;
  ipAddress: string;
  mixerType?: string;
  name?: string;
  options: MixerImportOptions;
}): Promise<MixerImportResult> {
  return serviceFetch<MixerImportResult>("/api/v1/mixers/import", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchLastConnectedMixerApi(): Promise<LastConnectedMixer | null> {
  const result = await serviceFetch<{ mixer: LastConnectedMixer | null }>("/api/v1/mixers/last-connected");
  return result.mixer;
}

export async function mixerHealthCheckApi(input: {
  mixerId?: string;
  ipAddress?: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
  connectionType?: MixerConnectionType;
  usbDeviceName?: string | null;
}): Promise<MixerHealthCheckResult> {
  return serviceFetch<MixerHealthCheckResult>("/api/v1/mixers/health-check", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function mixerAudioDetectionApi(input: {
  ipAddress: string;
  mixerType?: string;
  connectionConfig?: Partial<MixerConnectionConfig>;
}): Promise<MixerAudioDetectionResult> {
  return serviceFetch<MixerAudioDetectionResult>("/api/v1/mixers/audio-detection", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchCameras(): Promise<Camera[]> {
  return serviceFetch<{ items: Camera[] }>("/api/v1/cameras").then((r) => r.items);
}

export async function createCameraApi(input: Partial<Camera>): Promise<Camera> {
  return serviceFetch<{ item: Camera }>("/api/v1/cameras", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateCameraApi(id: string, patch: Partial<Camera>): Promise<Camera> {
  return serviceFetch<{ item: Camera }>(`/api/v1/cameras/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteCameraApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/cameras/${id}`, { method: "DELETE" });
}

export async function testCameraApi(id: string, clientVerified = false): Promise<TestResult> {
  const result = await fetch(`/api/v1/cameras/${id}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientVerified }),
    cache: "no-store",
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error((body as { error?: string }).error ?? "Request failed.");
  return body as TestResult;
}

export async function previewCameraApi(id: string): Promise<TestResult> {
  return serviceFetch<TestResult>(`/api/v1/cameras/${id}/preview`, { method: "POST" });
}

export async function fetchInternetConnections(): Promise<InternetConnection[]> {
  return serviceFetch<{ items: InternetConnection[] }>("/api/v1/internet").then((r) => r.items);
}

export async function createInternetApi(input: Partial<InternetConnection>): Promise<InternetConnection> {
  return serviceFetch<{ item: InternetConnection }>("/api/v1/internet", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateInternetApi(id: string, patch: Partial<InternetConnection>): Promise<InternetConnection> {
  return serviceFetch<{ item: InternetConnection }>(`/api/v1/internet/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteInternetApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/internet/${id}`, { method: "DELETE" });
}

export async function testInternetApi(): Promise<TestResult> {
  return serviceFetch<TestResult>("/api/v1/internet/test", { method: "POST" });
}

export async function fetchStreamingDestinations(): Promise<StreamingDestination[]> {
  return serviceFetch<{ items: StreamingDestination[] }>("/api/v1/streaming-destinations").then((r) => r.items);
}

export async function createStreamingApi(input: Partial<StreamingDestination>): Promise<StreamingDestination> {
  return serviceFetch<{ item: StreamingDestination }>("/api/v1/streaming-destinations", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateStreamingApi(
  id: string,
  patch: Partial<StreamingDestination>,
): Promise<StreamingDestination> {
  return serviceFetch<{ item: StreamingDestination }>(`/api/v1/streaming-destinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteStreamingApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/streaming-destinations/${id}`, { method: "DELETE" });
}

export async function testStreamingApi(id: string): Promise<TestResult> {
  return serviceFetch<TestResult>(`/api/v1/streaming-destinations/${id}/test`, { method: "POST" });
}

export async function fetchRecordingSettings(): Promise<RecordingSetting[]> {
  return serviceFetch<{ items: RecordingSetting[] }>("/api/v1/recording").then((r) => r.items);
}

export async function upsertRecordingApi(input: Partial<RecordingSetting>): Promise<RecordingSetting> {
  return serviceFetch<{ item: RecordingSetting }>("/api/v1/recording", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateRecordingApi(id: string, patch: Partial<RecordingSetting>): Promise<RecordingSetting> {
  return serviceFetch<{ item: RecordingSetting }>(`/api/v1/recording/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteRecordingApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/recording/${id}`, { method: "DELETE" });
}

export async function testRecordingApi(): Promise<TestResult> {
  return serviceFetch<TestResult>("/api/v1/recording/test", { method: "POST" });
}

export async function fetchPresentationSources(): Promise<PresentationSource[]> {
  return serviceFetch<{ items: PresentationSource[] }>("/api/v1/presentation").then((r) => r.items);
}

export async function upsertPresentationApi(input: Partial<PresentationSource>): Promise<PresentationSource> {
  return serviceFetch<{ item: PresentationSource }>("/api/v1/presentation", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updatePresentationApi(
  id: string,
  patch: Partial<PresentationSource>,
): Promise<PresentationSource> {
  return serviceFetch<{ item: PresentationSource }>(`/api/v1/presentation/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deletePresentationApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/presentation/${id}`, { method: "DELETE" });
}

export async function testPresentationApi(id: string): Promise<TestResult> {
  return serviceFetch<TestResult>(`/api/v1/presentation/${id}/test`, { method: "POST" });
}

export async function fetchTimelineItems(): Promise<ServiceTimelineItem[]> {
  return serviceFetch<{ items: ServiceTimelineItem[] }>("/api/v1/service-timeline").then((r) => r.items);
}

export async function createTimelineApi(input: Partial<ServiceTimelineItem>): Promise<ServiceTimelineItem> {
  return serviceFetch<{ item: ServiceTimelineItem }>("/api/v1/service-timeline", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateTimelineApi(id: string, patch: Partial<ServiceTimelineItem>): Promise<ServiceTimelineItem> {
  return serviceFetch<{ item: ServiceTimelineItem }>(`/api/v1/service-timeline/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteTimelineApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/service-timeline/${id}`, { method: "DELETE" });
}

export async function reorderTimelineApi(orderedIds: string[]): Promise<ServiceTimelineItem[]> {
  return serviceFetch<{ items: ServiceTimelineItem[] }>("/api/v1/service-timeline/reorder", {
    method: "POST",
    body: JSON.stringify({ orderedIds }),
  }).then((r) => r.items);
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return serviceFetch<{ items: TeamMember[] }>("/api/v1/team").then((r) => r.items);
}

export async function createTeamMemberApi(input: Partial<TeamMember>): Promise<TeamMember> {
  return serviceFetch<{ item: TeamMember }>("/api/v1/team", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.item);
}

export async function updateTeamMemberApi(id: string, patch: Partial<TeamMember>): Promise<TeamMember> {
  return serviceFetch<{ item: TeamMember }>(`/api/v1/team/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((r) => r.item);
}

export async function deleteTeamMemberApi(id: string): Promise<void> {
  await serviceFetch(`/api/v1/team/${id}`, { method: "DELETE" });
}

export async function fetchServiceAlerts(): Promise<ServiceAlert[]> {
  return serviceFetch<{ items: ServiceAlert[] }>("/api/v1/service-alerts").then((r) => r.items);
}

export async function ignoreAlertApi(id: string): Promise<ServiceAlert> {
  return serviceFetch<{ item: ServiceAlert }>(`/api/v1/service-alerts/${id}/ignore`, { method: "PATCH" }).then(
    (r) => r.item,
  );
}

export async function fixAlertApi(id: string): Promise<ServiceAlert> {
  return serviceFetch<{ item: ServiceAlert }>(`/api/v1/service-alerts/${id}/fixed`, { method: "PATCH" }).then(
    (r) => r.item,
  );
}

export async function noteAlertApi(id: string, note: string): Promise<ServiceAlert> {
  return serviceFetch<{ item: ServiceAlert }>(`/api/v1/service-alerts/${id}/note`, {
    method: "POST",
    body: JSON.stringify({ note }),
  }).then((r) => r.item);
}

export async function beginServiceApi(force = false, skipDestinationIds: string[] = []): Promise<BeginServiceResult> {
  return serviceFetch<BeginServiceResult>("/api/v1/service/begin", {
    method: "POST",
    body: JSON.stringify({ force, skipDestinationIds }),
  });
}

export async function stopServiceApi(): Promise<import("@/lib/todays-service/types").StopServiceResult> {
  return serviceFetch("/api/v1/service/stop", { method: "POST" });
}

export async function stopStreamingApi(): Promise<import("@/lib/streaming/types").StreamingStopAllResult> {
  return serviceFetch("/api/v1/streaming/stop", { method: "POST" });
}

export async function startCountdownApi(): Promise<TestResult> {
  return serviceFetch<TestResult>("/api/v1/service/countdown/start", { method: "POST" });
}

export async function previewBroadcastApi(): Promise<TestResult> {
  return serviceFetch<TestResult>("/api/v1/service/preview", { method: "POST" });
}

export async function patchEquipmentProfileApi(input: {
  preferredConnectionType?: string | null;
  rememberConnectionChoice?: boolean;
  onboarding?: Record<string, unknown>;
}): Promise<{ profile: import("@/lib/todays-service/equipment-onboarding").TenantEquipmentProfile }> {
  return serviceFetch("/api/v1/equipment/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
