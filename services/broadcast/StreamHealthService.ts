import { isBroadcastDevMode } from "@/services/broadcast/config";
import { TypedEvent } from "@/services/broadcast/EventBus";
import type { StreamDestinationTelemetry, StreamTelemetry } from "@/lib/broadcast/types";

export type StreamHealthEvent =
  | { type: "streamMetricsUpdated"; telemetry: StreamTelemetry }
  | {
      type: "streamDegradationDetected";
      telemetry: StreamTelemetry;
      reason: string;
    };

function emptyTelemetry(): StreamTelemetry {
  return {
    updatedAt: new Date().toISOString(),
    bitrateKbps: 0,
    droppedFrames: 0,
    packetLossPercent: 0,
    latencyMs: null,
    encoderOverloaded: false,
    pipelineAvailable: false,
    internetStatus: "offline",
    destinations: [],
  };
}

export class StreamHealthService {
  readonly events = new TypedEvent<StreamHealthEvent>();

  private telemetry: StreamTelemetry = emptyTelemetry();
  private devLive = false;
  private rehearsalLive = false;

  ingestMetrics(partial: Partial<StreamTelemetry>): void {
    const next: StreamTelemetry = {
      ...this.telemetry,
      ...partial,
      updatedAt: new Date().toISOString(),
      destinations: partial.destinations ?? this.telemetry.destinations,
    };

    this.telemetry = next;
    this.events.emit({ type: "streamMetricsUpdated", telemetry: next });

    const degraded =
      next.encoderOverloaded ||
      next.packetLossPercent > 2.5 ||
      next.droppedFrames > 30 ||
      (next.bitrateKbps > 0 && next.bitrateKbps < 4500);

    if (degraded) {
      this.events.emit({
        type: "streamDegradationDetected",
        telemetry: next,
        reason: next.encoderOverloaded
          ? "Encoder overload"
          : next.packetLossPercent > 2.5
            ? "Packet loss spike"
            : "Pipeline degradation",
      });
    }
  }

  getPipelineStatus(): StreamTelemetry {
    if (this.rehearsalLive) {
      return this.buildRehearsalTelemetry();
    }
    if (isBroadcastDevMode() && this.telemetry.destinations.length === 0) {
      return this.buildDevTelemetry();
    }
    return this.telemetry;
  }

  setDevLive(isLive: boolean): void {
    if (!isBroadcastDevMode()) return;
    this.devLive = isLive;
    this.ingestMetrics(this.buildDevTelemetry());
  }

  /** Simulates distribution output during rehearsal — never touches adapters. */
  setRehearsalLive(isLive: boolean): void {
    this.rehearsalLive = isLive;
    if (isLive) {
      this.ingestMetrics(this.buildRehearsalTelemetry());
    }
  }

  reset(): void {
    this.telemetry = emptyTelemetry();
    this.devLive = false;
    this.rehearsalLive = false;
  }

  private buildRehearsalTelemetry(): StreamTelemetry {
    const destinations: StreamDestinationTelemetry[] = [
      {
        id: "restream",
        name: "Restream",
        connected: true,
        live: true,
        bitrateKbps: 5800,
        latencyMs: 1200,
        droppedFrames: 0,
        error: null,
      },
      {
        id: "youtube",
        name: "YouTube",
        connected: true,
        live: true,
        bitrateKbps: 5600,
        latencyMs: 1400,
        droppedFrames: 0,
        error: null,
      },
      {
        id: "facebook",
        name: "Facebook",
        connected: true,
        live: true,
        bitrateKbps: 5400,
        latencyMs: 1500,
        droppedFrames: 0,
        error: null,
      },
      {
        id: "custom_rtmp",
        name: "Custom RTMP",
        connected: true,
        live: true,
        bitrateKbps: 5200,
        latencyMs: 1600,
        droppedFrames: 0,
        error: null,
      },
    ];

    return {
      updatedAt: new Date().toISOString(),
      bitrateKbps: 5800,
      droppedFrames: 0,
      packetLossPercent: 0.2,
      latencyMs: 1200,
      encoderOverloaded: false,
      pipelineAvailable: true,
      internetStatus: "online",
      destinations,
    };
  }

  private buildDevTelemetry(): StreamTelemetry {
    const destinations: StreamDestinationTelemetry[] = [
      {
        id: "restream",
        name: "Restream",
        connected: true,
        live: this.devLive,
        bitrateKbps: this.devLive ? 5800 : 0,
        latencyMs: 1200,
        droppedFrames: 0,
        error: null,
      },
      {
        id: "youtube",
        name: "YouTube",
        connected: true,
        live: this.devLive,
        bitrateKbps: this.devLive ? 5600 : 0,
        latencyMs: 1400,
        droppedFrames: 0,
        error: null,
      },
      {
        id: "facebook",
        name: "Facebook",
        connected: false,
        live: false,
        bitrateKbps: 0,
        latencyMs: null,
        droppedFrames: 0,
        error: "Awaiting encoder handshake",
      },
      {
        id: "custom_rtmp",
        name: "Custom RTMP",
        connected: true,
        live: this.devLive,
        bitrateKbps: this.devLive ? 5400 : 0,
        latencyMs: 1500,
        droppedFrames: 0,
        error: null,
      },
    ];

    const telemetry: StreamTelemetry = {
      updatedAt: new Date().toISOString(),
      bitrateKbps: this.devLive ? 5800 : 0,
      droppedFrames: 0,
      packetLossPercent: 0.4,
      latencyMs: 1200,
      encoderOverloaded: false,
      pipelineAvailable: true,
      internetStatus: "online",
      destinations,
    };

    this.telemetry = telemetry;
    return telemetry;
  }
}
