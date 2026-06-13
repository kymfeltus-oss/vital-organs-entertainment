import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BroadcastSourceService } from "@/services/broadcast/BroadcastSourceService";
import { evaluateEventGuardianRules } from "@/services/broadcast/eventGuardian";
import { generatePostEventReport } from "@/services/broadcast/PostEventReportService";
import { ProductionBrain } from "@/services/broadcast/ProductionBrain";
import { ProductionSafetyEngine } from "@/services/broadcast/ProductionSafetyEngine";
import { ReadinessEngine } from "@/services/broadcast/ReadinessEngine";
import { StreamHealthService } from "@/services/broadcast/StreamHealthService";
import type { ProductionLogEntry } from "@/services/broadcast/ProductionLogService";
import type {
  AdapterConnectionMeta,
  AudioTelemetry,
  HardwareSource,
  ProductionState,
  StreamTelemetry,
} from "@/lib/broadcast/types";

const readiness = new ReadinessEngine();
const safety = new ProductionSafetyEngine();

function connectedMediaCore(): AdapterConnectionMeta {
  return {
    adapterId: "vmix",
    connectionState: "connected",
    lastError: null,
    isAvailable: true,
  };
}

function evaluateGuardian(
  overrides: {
    sources?: HardwareSource[];
    audio?: Partial<AudioTelemetry>;
    stream?: Partial<StreamTelemetry>;
    production?: Partial<ProductionState>;
    mediaCore?: Partial<AdapterConnectionMeta>;
    devMode?: boolean;
  } = {},
) {
  const production = baseProduction(overrides.production);
  const report = readiness.evaluate({
    sources: overrides.sources ?? [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
    audio: baseAudio(overrides.audio),
    stream: baseStream(overrides.stream),
    production,
    devMode: overrides.devMode ?? true,
  });

  return evaluateEventGuardianRules({
    sources: overrides.sources ?? [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
    audio: baseAudio(overrides.audio),
    stream: baseStream(overrides.stream),
    readiness: report,
    production,
    mediaCore: { ...connectedMediaCore(), ...overrides.mediaCore },
  });
}

function baseProduction(overrides: Partial<ProductionState> = {}): ProductionState {
  return {
    previewSourceId: "cam-1",
    programSourceId: "cam-1",
    isLive: false,
    isRecording: true,
    lastTransition: null,
    stingerActive: false,
    fadeProgress: 1,
    supervisorOverride: false,
    supervisorReason: "",
    storageAvailableGb: 128,
    ...overrides,
  };
}

function onlineSource(id: string): HardwareSource {
  return {
    id,
    name: id,
    protocol: "hdmi",
    online: true,
    lastHeartbeatAt: new Date().toISOString(),
    resolution: "1920x1080",
    fps: 59.94,
    signalStrength: 90,
    isDark: false,
    isOverexposed: false,
    healthStatus: "green",
    adapterId: "vmix",
  };
}

function baseAudio(overrides: Partial<AudioTelemetry> = {}): AudioTelemetry {
  return {
    updatedAt: new Date().toISOString(),
    masterPeakDb: -8,
    masterSilent: false,
    masterClipping: false,
    masterPresent: true,
    channels: [],
    noiseFloorIssue: false,
    possibleFeedback: false,
    ...overrides,
  };
}

function baseStream(overrides: Partial<StreamTelemetry> = {}): StreamTelemetry {
  return {
    updatedAt: new Date().toISOString(),
    bitrateKbps: 5800,
    droppedFrames: 0,
    packetLossPercent: 0.4,
    latencyMs: 1200,
    encoderOverloaded: false,
    pipelineAvailable: true,
    internetStatus: "online",
    destinations: [
      {
        id: "restream",
        name: "Restream",
        connected: true,
        live: false,
        bitrateKbps: 0,
        latencyMs: 1200,
        droppedFrames: 0,
        error: null,
      },
    ],
    ...overrides,
  };
}

describe("ReadinessEngine", () => {
  it("returns critical failure when no video sources exist", () => {
    const report = readiness.evaluate({
      sources: [],
      audio: baseAudio(),
      stream: baseStream(),
      production: baseProduction({ programSourceId: null }),
      devMode: true,
    });

    assert.equal(report.canGoLive, false);
    assert.ok(report.criticalFailures.some((f) => f.id === "video_source"));
  });

  it("warns when fewer than preferred camera count exists", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2")],
      audio: baseAudio(),
      stream: baseStream(),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.warnings.some((f) => f.id === "camera_count"));
  });

  it("warns when master audio is silent", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio({ masterSilent: true, masterPresent: true }),
      stream: baseStream(),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.warnings.some((f) => f.id === "master_audio_silent"));
  });

  it("blocks when master audio is missing", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio({ masterPresent: false }),
      stream: baseStream(),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.hardBlocks.some((f) => f.id === "master_audio_missing"));
    assert.equal(report.canGoLive, false);
  });

  it("blocks on high packet loss", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio(),
      stream: baseStream({ packetLossPercent: 4.2 }),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.hardBlocks.some((f) => f.id === "packet_loss"));
  });

  it("blocks on encoder overload", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio(),
      stream: baseStream({ encoderOverloaded: true }),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.hardBlocks.some((f) => f.id === "encoder_overload"));
  });

  it("supervisor override does not remove critical failures", () => {
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1")],
      audio: baseAudio({ masterClipping: true }),
      stream: baseStream(),
      production: baseProduction(),
      devMode: true,
    });

    assert.ok(report.criticalFailures.length > 0);
    assert.equal(
      readiness.canLaunchWithOverride(report, true, "Supervisor approved override"),
      true,
    );
    assert.ok(report.criticalFailures.some((f) => f.id === "master_clipping"));
  });

  it("supervisor override cannot bypass BLACK hard-block failures", () => {
    const report = readiness.evaluate({
      sources: [],
      audio: baseAudio({ masterPresent: false }),
      stream: baseStream({ pipelineAvailable: false }),
      production: baseProduction({ programSourceId: null }),
      devMode: false,
    });

    assert.ok(report.hardBlocks.length > 0);
    assert.equal(
      readiness.canLaunchWithOverride(report, true, "Attempted override with reason"),
      false,
    );
  });
});

describe("Event Guardian", () => {
  it("flags recording off while stream is live", () => {
    const rules = evaluateGuardian({
      production: { isLive: true, isRecording: false },
    });
    assert.ok(rules.some((r) => r.ruleId === "recording_off_while_live"));
  });

  it("flags missing program source", () => {
    const rules = evaluateGuardian({ production: { programSourceId: null } });
    assert.ok(rules.some((r) => r.ruleId === "no_program_source"));
  });

  it("flags empty distribution endpoints", () => {
    const rules = evaluateGuardian({ stream: { destinations: [] } });
    assert.ok(rules.some((r) => r.ruleId === "no_distribution_endpoint"));
  });

  it("flags packet loss above guardian threshold", () => {
    const rules = evaluateGuardian({ stream: { packetLossPercent: 2.1 } });
    assert.ok(rules.some((r) => r.ruleId === "packet_loss_elevated"));
  });

  it("flags bitrate degradation trend", () => {
    const rules = evaluateGuardian({ stream: { bitrateStable: false, bitrateKbps: 4200 } });
    assert.ok(rules.some((r) => r.ruleId === "bitrate_degradation"));
  });

  it("flags silent audio channels", () => {
    const rules = evaluateGuardian({ audio: { masterSilent: true } });
    assert.ok(rules.some((r) => r.ruleId === "audio_channel_silent"));
  });

  it("flags audio clipping", () => {
    const rules = evaluateGuardian({ audio: { masterClipping: true } });
    assert.ok(rules.some((r) => r.ruleId === "audio_clipping"));
  });

  it("flags unhealthy media core", () => {
    const rules = evaluateGuardian({
      mediaCore: { connectionState: "disconnected", isAvailable: false },
    });
    assert.ok(rules.some((r) => r.ruleId === "media_core_unhealthy"));
  });

  it("flags empty source registry", () => {
    const rules = evaluateGuardian({ sources: [] });
    assert.ok(rules.some((r) => r.ruleId === "source_registry_empty"));
  });

  it("flags supervisor override with remaining failures", () => {
    const rules = evaluateGuardian({
      production: { supervisorOverride: true, supervisorReason: "Approved for rehearsal" },
      audio: { masterClipping: true },
    });
    assert.ok(rules.some((r) => r.ruleId === "supervisor_override_active"));
  });

  it("maps guardian rules to non-executable safety actions", () => {
    const production = baseProduction({ isLive: true, isRecording: false });
    const report = readiness.evaluate({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio(),
      stream: baseStream(),
      production,
      devMode: true,
    });

    const actions = safety.rebuild({
      sources: [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")],
      audio: baseAudio(),
      stream: baseStream(),
      readiness: report,
      production,
      mediaCore: connectedMediaCore(),
    });

    assert.ok(actions.length > 0);
    assert.ok(actions.every((action) => action.executable === false));
    assert.ok(actions.every((action) => action.issue && action.estimatedImpact && action.timestamp));
  });
});

function logEntry(
  overrides: Partial<ProductionLogEntry> & Pick<ProductionLogEntry, "severity" | "message">,
): ProductionLogEntry {
  return {
    id: overrides.id ?? `log-${Math.random()}`,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    phase: overrides.phase ?? "mitigate",
    severity: overrides.severity,
    message: overrides.message,
    metadata: overrides.metadata,
  };
}

describe("PostEventReportService", () => {
  it("summarizes session duration and severity counts from productionLog", () => {
    const report = generatePostEventReport({
      productionLog: [
        logEntry({
          id: "1",
          timestamp: "2026-06-12T23:00:00.000Z",
          phase: "command",
          severity: "green",
          message: "Go live approved by interlock",
          metadata: { command: "go_live" },
        }),
        logEntry({
          id: "2",
          timestamp: "2026-06-12T23:45:00.000Z",
          phase: "command",
          severity: "yellow",
          message: "Broadcast ended",
          metadata: { command: "stop_live" },
        }),
        logEntry({
          id: "3",
          timestamp: "2026-06-12T23:10:00.000Z",
          severity: "orange",
          message: "Master audio is silent",
        }),
        logEntry({
          id: "4",
          timestamp: "2026-06-12T23:12:00.000Z",
          severity: "red",
          message: "Critical clipping on master bus",
        }),
        logEntry({
          id: "5",
          timestamp: "2026-06-12T23:13:00.000Z",
          severity: "black",
          message: "Go live blocked by readiness interlock",
          metadata: { command: "go_live" },
        }),
      ],
      production: { isRecording: true, isLive: false },
      streamTelemetry: baseStream(),
      mediaCore: connectedMediaCore(),
      vmixHealth: {
        status: "connected",
        pollLatencyMs: 240,
        inputCount: 4,
        lastSuccessfulPollAt: "2026-06-12T23:45:00.000Z",
        lastError: null,
      },
    });

    assert.equal(report.goLiveAt, "2026-06-12T23:00:00.000Z");
    assert.equal(report.stopLiveAt, "2026-06-12T23:45:00.000Z");
    assert.equal(report.totalEventDurationMs, 45 * 60 * 1000);
    assert.equal(report.warningCount, 2);
    assert.equal(report.criticalFailureCount, 1);
    assert.equal(report.hardBlockCount, 1);
    assert.equal(report.recordingStatus, "active");
    assert.match(report.distributionHealthSummary, /connected/i);
    assert.match(report.mediaCoreHealthSummary, /Media Core connected/i);
  });

  it("ranks top repeated issues from guardian and readiness log lines", () => {
    const report = generatePostEventReport({
      productionLog: [
        logEntry({
          severity: "orange",
          message: "Stream is live but ISO recording is not running. → Enable recording",
          metadata: { ruleId: "recording_off_while_live" },
        }),
        logEntry({
          severity: "orange",
          message: "Stream is live but ISO recording is not running. → Enable recording",
          metadata: { ruleId: "recording_off_while_live" },
        }),
        logEntry({
          severity: "red",
          message: "Master bus is clipping. → Reduce gain",
          metadata: { ruleId: "audio_clipping" },
        }),
      ],
    });

    assert.equal(report.topRepeatedIssues[0]?.label, "Stream is live but ISO recording is not running.");
    assert.equal(report.topRepeatedIssues[0]?.count, 2);
  });
});

describe("Rehearsal Mode", () => {
  it("simulates distribution telemetry without adapter streaming", () => {
    const stream = new StreamHealthService();
    stream.setRehearsalLive(true);
    const telemetry = stream.getPipelineStatus();

    assert.equal(telemetry.destinations.every((dest) => dest.live), true);
    assert.ok(telemetry.bitrateKbps > 0);

    stream.setRehearsalLive(false);
    assert.equal(stream.getPipelineStatus().destinations.length >= 0, true);
  });

  it("go live in rehearsal mode skips adapter streaming methods", async () => {
    const previousDevMode = process.env.BROADCAST_DEV_MODE;
    process.env.BROADCAST_DEV_MODE = "true";

    try {
      const brain = new ProductionBrain();
      brain.reset();

      let streamingStarted = false;
      let streamingStopped = false;
      brain.adapters.vmix.startStreaming = async () => {
        streamingStarted = true;
      };
      brain.adapters.vmix.stopStreaming = async () => {
        streamingStopped = true;
      };

      const sources = [onlineSource("cam-1"), onlineSource("cam-2"), onlineSource("cam-3")];
      for (const source of sources) {
        brain.sources.register(source);
      }

      const store = await brain.executeCommand(
        { type: "go_live" },
        {
          rehearsalMode: true,
          supervisorOverride: false,
          supervisorReason: "",
        },
      );

      assert.equal(streamingStarted, false);
      assert.equal(store.production.isLive, true);
      assert.equal(store.meta.rehearsalMode, true);
      assert.ok(store.streamTelemetry.destinations.some((dest) => dest.live));

      const ended = await brain.executeCommand(
        { type: "end_live" },
        { rehearsalMode: true },
      );

      assert.equal(streamingStopped, false);
      assert.equal(ended.production.isLive, false);
      brain.reset();
    } finally {
      if (previousDevMode === undefined) {
        delete process.env.BROADCAST_DEV_MODE;
      } else {
        process.env.BROADCAST_DEV_MODE = previousDevMode;
      }
    }
  });
});

describe("BroadcastSourceService", () => {
  it("does not create duplicate discovery intervals", () => {
    const service = new BroadcastSourceService();
    const originalSetInterval = globalThis.setInterval;
    let intervalCount = 0;

    globalThis.setInterval = ((handler: TimerHandler, timeout?: number) => {
      intervalCount += 1;
      return originalSetInterval(handler, timeout);
    }) as typeof setInterval;

    try {
      service.startAutoDiscovery();
      service.startAutoDiscovery();
      assert.equal(intervalCount, 1);
    } finally {
      globalThis.setInterval = originalSetInterval;
      service.stopAutoDiscovery();
    }
  });

  it("marks expired heartbeat sources offline", () => {
    const service = new BroadcastSourceService();
    const stale = new Date(Date.now() - 60_000).toISOString();

    service.register({
      ...onlineSource("stale-cam"),
      lastHeartbeatAt: stale,
    });

    service.expireStaleHeartbeats(Date.now());
    const updated = service.getActiveRegistry().find((s) => s.id === "stale-cam");
    assert.equal(updated?.online, false);
  });
});
