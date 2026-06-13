import { isBroadcastDevMode } from "@/services/broadcast/config";
import { TypedEvent } from "@/services/broadcast/EventBus";
import type { AudioChannelTelemetry, AudioTelemetry } from "@/lib/broadcast/types";

export type AudioHealthEvent =
  | { type: "audioTelemetryUpdated"; telemetry: AudioTelemetry }
  | {
      type: "audioCrisisDetected";
      telemetry: AudioTelemetry;
      reason: string;
    };

function dbToMeterLevel(db: number): number {
  return Math.max(0, Math.min(100, Math.round((db + 60) * (100 / 60))));
}

function emptyTelemetry(): AudioTelemetry {
  return {
    updatedAt: new Date().toISOString(),
    masterPeakDb: -Infinity,
    masterSilent: true,
    masterClipping: false,
    masterPresent: false,
    channels: [],
    noiseFloorIssue: false,
    possibleFeedback: false,
  };
}

export class AudioHealthService {
  readonly events = new TypedEvent<AudioHealthEvent>();

  private telemetry: AudioTelemetry = emptyTelemetry();
  private devTick = 0;
  private adapterIngestActive = false;

  /** Live adapter path — prevents DEV mock telemetry when vMix has been polled. */
  ingestFromAdapter(channels: AudioChannelTelemetry[]): void {
    this.adapterIngestActive = true;
    if (channels.length === 0) {
      this.telemetry = { ...emptyTelemetry(), updatedAt: new Date().toISOString() };
      return;
    }
    this.ingestFrame(channels);
  }

  ingestFrame(channels: AudioChannelTelemetry[]): void {
    const masterChannel =
      channels.find((ch) => ch.id === "master" || ch.name.toLowerCase().includes("master")) ??
      channels[0] ??
      null;

    const masterPeakDb = masterChannel?.peakDb ?? -Infinity;
    const masterSilent =
      channels.length === 0 ||
      channels.every((ch) => ch.muted || ch.silent || ch.peakDb < -50);
    const masterClipping = channels.some((ch) => ch.clipping);
    const noiseFloorIssue = channels.some(
      (ch) => !ch.muted && !ch.silent && ch.rmsDb > -20 && ch.peakDb < -35,
    );
    const possibleFeedback = channels.some(
      (ch) => ch.clipping && ch.peakDb > -3 && !ch.muted,
    );

    this.telemetry = {
      updatedAt: new Date().toISOString(),
      masterPeakDb,
      masterSilent,
      masterClipping,
      masterPresent: masterChannel !== null,
      channels,
      noiseFloorIssue,
      possibleFeedback,
    };

    this.events.emit({ type: "audioTelemetryUpdated", telemetry: this.telemetry });

    if (masterClipping || possibleFeedback) {
      this.events.emit({
        type: "audioCrisisDetected",
        telemetry: this.telemetry,
        reason: masterClipping ? "Master clipping detected" : "Possible feedback loop",
      });
    }
  }

  getLiveMixerLevels(): AudioTelemetry {
    if (isBroadcastDevMode() && !this.adapterIngestActive) {
      return this.buildDevTelemetry();
    }
    return this.telemetry;
  }

  reset(): void {
    this.telemetry = emptyTelemetry();
    this.devTick = 0;
    this.adapterIngestActive = false;
  }

  private buildDevTelemetry(): AudioTelemetry {
    this.devTick += 1;
    const jitter = this.devTick % 6;
    const channels: AudioChannelTelemetry[] = [
      {
        id: "audio-lead",
        name: "Lead Mic",
        peakDb: -12 + jitter,
        rmsDb: -24 + jitter,
        volume: 78,
        muted: false,
        clipping: jitter === 5,
        silent: false,
        autoGain: true,
        meterLevel: dbToMeterLevel(-12 + jitter),
      },
      {
        id: "audio-master",
        name: "Master Stream Output",
        peakDb: -8 + jitter,
        rmsDb: -18 + jitter,
        volume: 85,
        muted: false,
        clipping: false,
        silent: false,
        autoGain: false,
        meterLevel: dbToMeterLevel(-8 + jitter),
      },
    ];

    this.ingestFrame(channels);
    return this.telemetry;
  }
}
