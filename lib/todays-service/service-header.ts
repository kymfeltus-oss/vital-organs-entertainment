import type { ServiceRecord } from "@/lib/todays-service/types";

export type ServiceHeaderUpdate = {
  id: string;
  serviceName: string;
  serviceDate: string;
  serviceStartTime: string;
  broadcastProfile: string;
  readinessMessage: string;
};

export function serviceRecordToHeaderUpdate(service: ServiceRecord): ServiceHeaderUpdate {
  return {
    id: service.id,
    serviceName: service.serviceName,
    serviceDate: service.serviceDate,
    serviceStartTime: service.serviceStartTime,
    broadcastProfile: service.broadcastProfile,
    readinessMessage: service.readinessMessage,
  };
}

export function validateServiceHeaderUpdate(
  patch: Partial<ServiceHeaderUpdate>,
): string | null {
  if (!patch.id?.trim()) return "Service id is missing.";
  if (!patch.serviceName?.trim()) return "Service name is required.";
  if (!patch.serviceDate?.trim()) return "Service date is required.";
  if (!patch.serviceStartTime?.trim()) return "Start time is required.";
  if (!patch.broadcastProfile?.trim()) return "Broadcast profile is required.";
  if (patch.readinessMessage === undefined || patch.readinessMessage === null) {
    return "Service message is required.";
  }
  return null;
}

export function normalizeServiceStartTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}
