"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEVICE_INVENTORY_EVENT,
  DEVICE_INVENTORY_STORAGE_KEY,
  clampDeviceVolume,
  createPersistedDevice,
  parsePersistedDevices,
  sortDevices,
  updatePersistedDevice,
  validateDeviceDraft,
  type DeviceDraft,
  type DeviceHealthStatus,
  type DeviceKind,
  type PersistedDevice,
} from "@/lib/owner/device-inventory";

type InventoryMutationResult = {
  ok: boolean;
  message: string;
};

function readInventoryFromStorage(): PersistedDevice[] {
  if (typeof window === "undefined") return [];
  return sortDevices(parsePersistedDevices(window.localStorage.getItem(DEVICE_INVENTORY_STORAGE_KEY)));
}

function writeInventoryToStorage(devices: PersistedDevice[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_INVENTORY_STORAGE_KEY, JSON.stringify(sortDevices(devices)));
  window.dispatchEvent(new CustomEvent(DEVICE_INVENTORY_EVENT));
}

export function useDeviceInventoryStore() {
  const [devices, setDevices] = useState<PersistedDevice[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    try {
      setDevices(readInventoryFromStorage());
      setError(null);
    } catch {
      setDevices([]);
      setError("Device inventory could not be loaded from this browser.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    reload();
    const handleChange = () => reload();
    window.addEventListener("storage", handleChange);
    window.addEventListener(DEVICE_INVENTORY_EVENT, handleChange);
    return () => {
      window.removeEventListener("storage", handleChange);
      window.removeEventListener(DEVICE_INVENTORY_EVENT, handleChange);
    };
  }, [reload]);

  const persist = useCallback((nextDevices: PersistedDevice[]): InventoryMutationResult => {
    try {
      const sorted = sortDevices(nextDevices);
      setDevices(sorted);
      writeInventoryToStorage(sorted);
      setError(null);
      return { ok: true, message: "Device inventory synced." };
    } catch {
      setError("Device inventory could not be saved in this browser.");
      return { ok: false, message: "Device inventory save failed." };
    }
  }, []);

  const upsertDevice = useCallback(
    (draft: DeviceDraft, editingId: string | null): InventoryMutationResult => {
      const validationError = validateDeviceDraft(draft, devices, editingId);
      if (validationError) return { ok: false, message: validationError };
      if (editingId) {
        const target = devices.find((device) => device.id === editingId);
        if (!target) return { ok: false, message: "Selected device no longer exists." };
        return persist(
          devices.map((device) =>
            device.id === editingId ? updatePersistedDevice(device, draft) : device,
          ),
        );
      }
      return persist([...devices, createPersistedDevice(draft, devices)]);
    },
    [devices, persist],
  );

  const updateDevicePatch = useCallback(
    (id: string, patch: Partial<PersistedDevice>): InventoryMutationResult => {
      const target = devices.find((device) => device.id === id);
      if (!target) return { ok: false, message: "Selected device no longer exists." };
      return persist(
        devices.map((device) =>
          device.id === id
            ? {
                ...device,
                ...patch,
                volume:
                  typeof patch.volume === "number"
                    ? clampDeviceVolume(patch.volume)
                    : device.volume,
                preShowActive:
                  patch.healthStatus && patch.healthStatus !== "LINKED"
                    ? false
                    : (patch.preShowActive ?? device.preShowActive),
                updatedAt: new Date().toISOString(),
              }
            : device,
        ),
      );
    },
    [devices, persist],
  );

  const removeDevice = useCallback(
    (id: string): InventoryMutationResult => {
      if (!devices.some((device) => device.id === id)) {
        return { ok: false, message: "Selected device no longer exists." };
      }
      return persist(devices.filter((device) => device.id !== id));
    },
    [devices, persist],
  );

  const devicesByKind = useMemo(
    () => ({
      microphones: devices.filter((device) => device.deviceKind === "MIC"),
      cameras: devices.filter((device) => device.deviceKind === "CAMERA"),
    }),
    [devices],
  );

  return {
    devices,
    microphones: devicesByKind.microphones,
    cameras: devicesByKind.cameras,
    hydrated,
    error,
    reload,
    upsertDevice,
    updateDevicePatch,
    removeDevice,
  };
}

export type DeviceInventoryStore = ReturnType<typeof useDeviceInventoryStore>;
export type { DeviceDraft, DeviceHealthStatus, DeviceKind, PersistedDevice };
