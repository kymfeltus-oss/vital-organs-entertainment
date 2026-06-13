import {
  BROADCAST_DISCOVERY_TICK_MS,
  BROADCAST_HEARTBEAT_TTL_MS,
  isBroadcastDevMode,
} from "@/services/broadcast/config";
import { TypedEvent } from "@/services/broadcast/EventBus";
import type { HardwareSource, SourceProtocol } from "@/lib/broadcast/types";

export type SourceRegistryEvent =
  | { type: "sourceAdded"; source: HardwareSource }
  | { type: "sourceRemoved"; sourceId: string }
  | { type: "sourceStatusChanged"; source: HardwareSource }
  | { type: "discoveryTick"; timestamp: string }
  | { type: "error"; message: string };

const DEV_SIMULATED_SOURCES: Array<{ name: string; protocol: SourceProtocol }> = [
  { name: "Main Stage", protocol: "hdmi" },
  { name: "Main Singer", protocol: "ndi" },
  { name: "Background Singers", protocol: "srt" },
  { name: "Band", protocol: "hdmi" },
  { name: "Audience", protocol: "rtmp" },
];

function emptyRegistry(): Map<string, HardwareSource> {
  return new Map();
}

export class BroadcastSourceService {
  readonly events = new TypedEvent<SourceRegistryEvent>();

  private registry: Map<string, HardwareSource> = emptyRegistry();
  private discoveryInterval: ReturnType<typeof setInterval> | null = null;
  private devSeedIndex = 0;

  register(source: HardwareSource): void {
    this.registry.set(source.id, source);
    this.events.emit({ type: "sourceAdded", source });
  }

  remove(sourceId: string): void {
    if (!this.registry.has(sourceId)) return;
    this.registry.delete(sourceId);
    this.events.emit({ type: "sourceRemoved", sourceId });
  }

  updateHeartbeat(sourceId: string, heartbeatAt = new Date().toISOString()): void {
    const current = this.registry.get(sourceId);
    if (!current) return;

    const next: HardwareSource = {
      ...current,
      lastHeartbeatAt: heartbeatAt,
      online: true,
      healthStatus: current.healthStatus === "black" ? "black" : "green",
    };
    this.registry.set(sourceId, next);
    this.events.emit({ type: "sourceStatusChanged", source: next });
  }

  markOffline(sourceId: string): void {
    const current = this.registry.get(sourceId);
    if (!current || !current.online) return;

    const next: HardwareSource = {
      ...current,
      online: false,
      healthStatus: "red",
    };
    this.registry.set(sourceId, next);
    this.events.emit({ type: "sourceStatusChanged", source: next });
  }

  expireStaleHeartbeats(now = Date.now()): void {
    for (const source of this.registry.values()) {
      if (!source.lastHeartbeatAt) continue;
      const age = now - new Date(source.lastHeartbeatAt).getTime();
      if (age > BROADCAST_HEARTBEAT_TTL_MS && source.online) {
        this.markOffline(source.id);
      }
    }
  }

  getActiveRegistry(): HardwareSource[] {
    return [...this.registry.values()];
  }

  /** Upsert adapter-provided sources; mark removed adapter inputs offline. */
  syncFromAdapter(sources: HardwareSource[], adapterId: HardwareSource["adapterId"] = "vmix"): void {
    const nextIds = new Set(sources.map((source) => source.id));
    const now = new Date().toISOString();

    for (const source of sources) {
      const existing = this.registry.get(source.id);
      if (existing) {
        const updated: HardwareSource = {
          ...existing,
          ...source,
          lastHeartbeatAt: now,
        };
        this.registry.set(source.id, updated);
        this.events.emit({ type: "sourceStatusChanged", source: updated });
      } else {
        this.register({ ...source, lastHeartbeatAt: now });
      }
    }

    for (const source of this.registry.values()) {
      if (source.adapterId === adapterId && !nextIds.has(source.id)) {
        this.markOffline(source.id);
      }
    }
  }

  /** Remove all sources owned by an adapter (e.g. when vMix becomes unreachable). */
  clearAdapterSources(adapterId: NonNullable<HardwareSource["adapterId"]>): void {
    for (const source of [...this.registry.values()]) {
      if (source.adapterId !== adapterId) continue;
      this.registry.delete(source.id);
      this.events.emit({ type: "sourceRemoved", sourceId: source.id });
    }
  }

  startAutoDiscovery(): void {
    if (this.discoveryInterval) return;

    this.discoveryInterval = setInterval(() => {
      this.events.emit({ type: "discoveryTick", timestamp: new Date().toISOString() });
      this.expireStaleHeartbeats();

      if (isBroadcastDevMode()) {
        this.seedDevDiscoveryTick();
      }
    }, BROADCAST_DISCOVERY_TICK_MS);
  }

  stopAutoDiscovery(): void {
    if (!this.discoveryInterval) return;
    clearInterval(this.discoveryInterval);
    this.discoveryInterval = null;
  }

  reset(): void {
    this.stopAutoDiscovery();
    this.registry = emptyRegistry();
    this.devSeedIndex = 0;
  }

  private seedDevDiscoveryTick(): void {
    if (this.devSeedIndex >= DEV_SIMULATED_SOURCES.length) {
      for (const source of this.registry.values()) {
        this.updateHeartbeat(source.id);
      }
      return;
    }

    const seed = DEV_SIMULATED_SOURCES[this.devSeedIndex];
    const id = `dev-source-${this.devSeedIndex + 1}`;
    const now = new Date().toISOString();

    this.register({
      id,
      name: seed.name,
      protocol: seed.protocol,
      online: true,
      lastHeartbeatAt: now,
      resolution: "1920x1080",
      fps: 59.94,
      signalStrength: 88 - this.devSeedIndex * 3,
      isDark: false,
      isOverexposed: false,
      healthStatus: "green",
      adapterId: "vmix",
      vmixInputNumber: this.devSeedIndex + 1,
    });

    this.devSeedIndex += 1;
  }
}
