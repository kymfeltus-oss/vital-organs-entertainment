import type {
  AdapterConnectionMeta,
  ProductionExecutionFlagsMeta,
  ProductionStore,
  VmixAdapterHealthMeta,
} from "@/lib/broadcast/types";

export function resolveVmixHealth(store: ProductionStore): VmixAdapterHealthMeta {
  if (store.meta.vmixHealth) return store.meta.vmixHealth;

  const vmix = store.adapterConnectionStates.vmix;
  let status: VmixAdapterHealthMeta["status"] = "disconnected";
  if (vmix.isAvailable && vmix.connectionState === "connected" && !vmix.lastError) {
    status = "connected";
  } else if (vmix.isAvailable || vmix.lastError) {
    status = "degraded";
  }

  return {
    status,
    pollLatencyMs: null,
    inputCount: store.sources.filter((s) => s.adapterId === "vmix").length,
    lastSuccessfulPollAt: null,
    lastError: vmix.lastError,
  };
}

export function resolveExecutionFlags(store: ProductionStore): ProductionExecutionFlagsMeta {
  if (store.meta.executionFlags) return store.meta.executionFlags;

  return {
    recording: store.production.isRecording ? "active" : "off",
    stream: store.production.isLive ? "live" : "standby",
  };
}

export function vmixStatusLabel(status: VmixAdapterHealthMeta["status"]): string {
  if (status === "connected") return "MEDIA CORE CONNECTED";
  if (status === "degraded") return "MEDIA CORE DEGRADED";
  return "MEDIA CORE DISCONNECTED";
}

export function formatLastSuccessAgo(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return "—";
  const elapsedSec = Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 1000));
  if (elapsedSec < 60) return `${elapsedSec}s ago`;
  const minutes = Math.floor(elapsedSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function resolveVmixAdapter(store: ProductionStore): AdapterConnectionMeta {
  return store.adapterConnectionStates.vmix;
}
