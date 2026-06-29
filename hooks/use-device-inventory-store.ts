"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getSupabase } from "@/lib/supabase/client";
import {
  sortDevices,
  type DeviceDraft,
  type DeviceHealthStatus,
  type DeviceKind,
  type PersistedDevice,
} from "@/lib/owner/device-inventory";

type InventoryMutationResult = {
  ok: boolean;
  message: string;
};

type DevicesApiResponse = {
  success?: boolean;
  ok?: boolean;
  devices?: PersistedDevice[];
  device?: PersistedDevice;
  message?: string;
  error?: string;
};

type DeviceInventoryState = {
  devices: PersistedDevice[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  realtimeReady: boolean;
  reload: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  subscribeToLiveDevices: () => () => void;
  upsertDevice: (draft: DeviceDraft, editingId: string | null) => Promise<InventoryMutationResult>;
  updateDevicePatch: (id: string, patch: Partial<PersistedDevice>) => Promise<InventoryMutationResult>;
  removeDevice: (id: string) => Promise<InventoryMutationResult>;
};

function normalizeDevices(value: unknown): PersistedDevice[] {
  if (!Array.isArray(value)) return [];
  return sortDevices(
    value
      .filter((item): item is PersistedDevice => Boolean(item && typeof item === "object"))
      .map((item) => ({
        id: String(item.id ?? ""),
        displayName: String(item.displayName ?? ""),
        deviceKind: item.deviceKind === "CAMERA" ? "CAMERA" : "MIC",
        linkedHub: item.linkedHub === "VIDEO HUB" ? "VIDEO HUB" : "SOUND HUB",
        inputChannel: Number.isInteger(item.inputChannel) ? item.inputChannel : 1,
        manufacturer: String(item.manufacturer ?? "Generic"),
        model: String(item.model ?? "Standard"),
        sovereignIngestArn: String(item.sovereignIngestArn ?? ""),
        healthStatus:
          item.healthStatus === "DISCONNECTED" || item.healthStatus === "ERROR"
            ? item.healthStatus
            : "LINKED",
        preShowActive: Boolean(item.preShowActive),
        muted: Boolean(item.muted),
        solo: Boolean(item.solo),
        volume: Number.isFinite(item.volume) ? Math.max(0, Math.min(100, Math.round(item.volume))) : 75,
        updatedAt: String(item.updatedAt ?? new Date(0).toISOString()),
      })),
  );
}

async function readJsonResponse(response: Response): Promise<DevicesApiResponse> {
  const data = (await response.json()) as DevicesApiResponse;
  if (!response.ok || data.success === false || data.ok === false) {
    throw new Error(data.error ?? `Device inventory request failed (${response.status}).`);
  }
  return data;
}

function draftToApiBody(draft: DeviceDraft): Record<string, unknown> {
  return {
    displayName: draft.displayName,
    deviceKind: draft.deviceKind,
    linkedHub: draft.linkedHub,
    inputChannel: draft.inputChannel,
    manufacturer: draft.manufacturer,
    model: draft.model,
    sovereignIngestArn: draft.sovereignIngestArn,
    healthStatus: draft.healthStatus,
  };
}

function patchToApiBody(id: string, patch: Partial<PersistedDevice>): Record<string, unknown> {
  return {
    id,
    displayName: patch.displayName,
    deviceKind: patch.deviceKind,
    linkedHub: patch.linkedHub,
    inputChannel: patch.inputChannel,
    manufacturer: patch.manufacturer,
    model: patch.model,
    sovereignIngestArn: patch.sovereignIngestArn,
    healthStatus: patch.healthStatus,
    preShowActive: patch.preShowActive,
    muted: patch.muted,
    solo: patch.solo,
    volume: patch.volume,
  };
}

const useDeviceInventoryZustand = create<DeviceInventoryState>((set, get) => ({
  devices: [],
  hydrated: false,
  loading: false,
  error: null,
  realtimeReady: false,

  reload: async () => {
    await get().fetchDevices();
  },

  fetchDevices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch("/api/owner/devices", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await readJsonResponse(response);
      set({
        devices: normalizeDevices(data.devices ?? []),
        hydrated: true,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        hydrated: true,
        loading: false,
        error: error instanceof Error ? error.message : "Device inventory could not be loaded.",
      });
    }
  },

  subscribeToLiveDevices: () => {
    void get().fetchDevices();

    const supabase = getSupabase();
    const channel = supabase
      .channel("production-device-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "owner_device_inventory" },
        () => {
          void get().fetchDevices();
        },
      )
      .subscribe((status) => {
        set({ realtimeReady: status === "SUBSCRIBED" });
      });

    return () => {
      set({ realtimeReady: false });
      void supabase.removeChannel(channel);
    };
  },

  upsertDevice: async (draft, editingId) => {
    try {
      const response = await fetch("/api/owner/devices", {
        method: editingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...draftToApiBody(draft) } : draftToApiBody(draft)),
      });
      const data = await readJsonResponse(response);
      if (data.device) {
        set((state) => {
          const withoutExisting = state.devices.filter((device) => device.id !== data.device?.id);
          return { devices: sortDevices([...withoutExisting, data.device as PersistedDevice]) };
        });
      }
      void get().fetchDevices();
      return { ok: true, message: data.message ?? "Device inventory synced to Supabase." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Device inventory save failed.";
      set({ error: message });
      return { ok: false, message };
    }
  },

  updateDevicePatch: async (id, patch) => {
    try {
      const response = await fetch("/api/owner/devices", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchToApiBody(id, patch)),
      });
      const data = await readJsonResponse(response);
      if (data.device) {
        set((state) => ({
          devices: sortDevices(
            state.devices.map((device) => (device.id === id ? (data.device as PersistedDevice) : device)),
          ),
        }));
      }
      void get().fetchDevices();
      return { ok: true, message: data.message ?? "Device route patched in Supabase." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Device patch failed.";
      set({ error: message });
      return { ok: false, message };
    }
  },

  removeDevice: async (id) => {
    try {
      const response = await fetch(`/api/owner/devices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await readJsonResponse(response);
      set((state) => ({ devices: state.devices.filter((device) => device.id !== id) }));
      void get().fetchDevices();
      return { ok: true, message: data.message ?? "Device removed from Supabase inventory." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Device removal failed.";
      set({ error: message });
      return { ok: false, message };
    }
  },
}));

export function useDeviceInventoryStore() {
  const store = useDeviceInventoryZustand();

  useEffect(() => {
    const unsubscribe = store.subscribeToLiveDevices();
    return unsubscribe;
  }, [store.subscribeToLiveDevices]);

  return {
    ...store,
    microphones: store.devices.filter((device) => device.deviceKind === "MIC"),
    cameras: store.devices.filter((device) => device.deviceKind === "CAMERA"),
  };
}

export type DeviceInventoryStore = ReturnType<typeof useDeviceInventoryStore>;
export type { DeviceDraft, DeviceHealthStatus, DeviceKind, PersistedDevice };
