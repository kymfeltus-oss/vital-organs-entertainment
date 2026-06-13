import type {
  AdapterConnectionMeta,
  AdapterId,
  AudioTelemetry,
  HardwareSource,
  HealthStatus,
  StreamTelemetry,
} from "@/lib/broadcast/types";

export type ProductionPipelinePhase =
  | "observe"
  | "evaluate"
  | "interlock"
  | "mitigate"
  | "log"
  | "command";

export type ProductionLogEntry = {
  id: string;
  timestamp: string;
  phase: ProductionPipelinePhase;
  severity: HealthStatus;
  message: string;
  metadata?: Record<string, string>;
};

export type ProductionPipelineTrace = {
  lastCycleAt: string;
  phasesCompleted: ProductionPipelinePhase[];
  observeSourceCount: number;
  interlockCanGoLive: boolean;
  interlockHardBlockCount: number;
  mitigationActionCount: number;
};

export type ObservationSnapshot = {
  devMode: boolean;
  sources: HardwareSource[];
  audioTelemetry: AudioTelemetry;
  streamTelemetry: StreamTelemetry;
  adapterConnectionStates: Record<AdapterId, AdapterConnectionMeta>;
};

let logCounter = 0;

export class ProductionLogService {
  private entries: ProductionLogEntry[] = [];
  private readonly maxEntries = 64;

  append(input: {
    phase: ProductionPipelinePhase;
    severity: HealthStatus;
    message: string;
    metadata?: Record<string, string>;
  }): ProductionLogEntry {
    logCounter += 1;
    const entry: ProductionLogEntry = {
      id: `log-${logCounter}`,
      timestamp: new Date().toISOString(),
      phase: input.phase,
      severity: input.severity,
      message: input.message,
      metadata: input.metadata,
    };
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }
    return entry;
  }

  getRecent(limit = 12): ProductionLogEntry[] {
    return this.entries.slice(0, limit);
  }

  reset(): void {
    this.entries = [];
  }
}

export function buildPipelineTrace(input: {
  observation: ObservationSnapshot;
  readinessCanGoLive: boolean;
  hardBlockCount: number;
  mitigationActionCount: number;
}): ProductionPipelineTrace {
  return {
    lastCycleAt: new Date().toISOString(),
    phasesCompleted: ["observe", "evaluate", "interlock", "mitigate", "log"],
    observeSourceCount: input.observation.sources.length,
    interlockCanGoLive: input.readinessCanGoLive,
    interlockHardBlockCount: input.hardBlockCount,
    mitigationActionCount: input.mitigationActionCount,
  };
}
