import {
  ARCHITECTURE_VERSION,
  BROADCAST_SNAPSHOT_POLL_MS,
  isBroadcastDevMode,
  VMIX_POLL_INTERVAL_MS,
} from "@/services/broadcast/config";
import { AudioHealthService } from "@/services/broadcast/AudioHealthService";
import {
  FacebookAdapter,
  ObsAdapter,
  RestreamAdapter,
  VmixAdapter,
  YoutubeAdapter,
} from "@/services/broadcast/adapters";
import { BroadcastSourceService } from "@/services/broadcast/BroadcastSourceService";
import {
  buildPipelineTrace,
  ProductionLogService,
  type ObservationSnapshot,
} from "@/services/broadcast/ProductionLogService";
import { guardianActionSignature } from "@/services/broadcast/eventGuardian";
import { ProductionSafetyEngine } from "@/services/broadcast/ProductionSafetyEngine";
import { ReadinessEngine } from "@/services/broadcast/ReadinessEngine";
import { StreamHealthService } from "@/services/broadcast/StreamHealthService";
import type {
  AdapterConnectionMeta,
  AdapterId,
  ProductionExecutionFlagsMeta,
  ProductionState,
  ProductionStore,
  ReadinessCheck,
  ReadinessFailure,
  ReadinessReport,
  TransitionType,
  VmixAdapterHealthMeta,
} from "@/lib/broadcast/types";

export { ARCHITECTURE_VERSION, BROADCAST_SNAPSHOT_POLL_MS };

export class GoLiveBlockedError extends Error {
  constructor(message = "Go live blocked by readiness interlock.") {
    super(message);
    this.name = "GoLiveBlockedError";
  }
}

export type UiOverrides = Partial<
  Pick<ProductionState, "supervisorOverride" | "supervisorReason">
> & {
  rehearsalMode?: boolean;
};

export type HydrateOptions = {
  mitigationCheckId?: string;
};

export type ProductionCommand =
  | { type: "set_preview"; sourceId: string }
  | { type: "transition"; transition: TransitionType }
  | { type: "go_live" }
  | { type: "end_live" };

function defaultProductionState(): ProductionState {
  return {
    previewSourceId: null,
    programSourceId: null,
    isLive: false,
    isRecording: false,
    lastTransition: null,
    stingerActive: false,
    fadeProgress: 1,
    supervisorOverride: false,
    supervisorReason: "",
    storageAvailableGb: 128,
  };
}

function failureToCheck(failure: ReadinessFailure, passed = false): ReadinessCheck {
  return {
    id: failure.id,
    label: failure.label,
    severity: failure.status,
    message: failure.message,
    passed,
    blocksGoLive: failure.hardBlock || failure.status === "red" || failure.status === "black",
    hardBlock: failure.hardBlock,
  };
}

/**
 * Central orchestrator — Observe → Evaluate → Interlock → Mitigate → Log
 */
export class ProductionBrain {
  readonly sources = new BroadcastSourceService();
  readonly audio = new AudioHealthService();
  readonly stream = new StreamHealthService();
  readonly readiness = new ReadinessEngine();
  readonly safety = new ProductionSafetyEngine();
  readonly log = new ProductionLogService();

  readonly adapters = {
    vmix: new VmixAdapter(),
    obs: new ObsAdapter(),
    restream: new RestreamAdapter(),
    youtube: new YoutubeAdapter(),
    facebook: new FacebookAdapter(),
  };

  private production: ProductionState = defaultProductionState();
  private started = false;
  private vmixPollInterval: ReturnType<typeof setInterval> | null = null;
  private lastVmixPollLatencyMs: number | null = null;
  private lastVmixSuccessfulPollAt: string | null = null;
  private lastGuardianLogSignature = "";
  private liveSessionIsRehearsal = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    if (this.adapters.vmix.resolveBaseUrl()) {
      void this.adapters.vmix.connect();
      this.vmixPollInterval = setInterval(() => {
        void this.adapters.vmix.poll();
      }, VMIX_POLL_INTERVAL_MS);
    } else if (isBroadcastDevMode()) {
      this.sources.startAutoDiscovery();
    }
  }

  /** Full pipeline cycle — sole source of hydrated ProductionStore truth. */
  async hydrateStore(
    uiOverrides: UiOverrides = {},
    options: HydrateOptions = {},
  ): Promise<ProductionStore> {
    this.start();
    await this.ingestAdapterTelemetry();

    const observation = this.observe();
    const production = this.resolveProductionState(observation, uiOverrides);
    const readinessReport = this.evaluate(observation, production);
    this.interlock(readinessReport, production);
    const safetyActions = this.mitigate(observation, readinessReport, production);
    this.recordLogCycle(observation, readinessReport, safetyActions, options);

    const dataMode = this.resolveDataMode(observation);

    const pipelineTrace = buildPipelineTrace({
      observation,
      readinessCanGoLive: readinessReport.canGoLive,
      hardBlockCount: readinessReport.hardBlocks.length,
      mitigationActionCount: safetyActions.length,
    });

    return {
      sources: observation.sources,
      previewSourceId: production.previewSourceId,
      programSourceId: production.programSourceId,
      audioTelemetry: observation.audioTelemetry,
      streamTelemetry: observation.streamTelemetry,
      readinessReport,
      safetyActions,
      productionLog: this.log.getRecent(),
      production,
      adapterConnectionStates: observation.adapterConnectionStates,
      meta: {
        hydratedAt: new Date().toISOString(),
        devMode: observation.devMode,
        dataMode,
        dataSourceLabel: this.buildDataSourceLabel(dataMode),
        adapterConnections: Object.values(observation.adapterConnectionStates),
        pipelineTrace,
        architectureVersion: ARCHITECTURE_VERSION,
        vmixHealth: this.buildVmixHealthMeta(observation),
        executionFlags: this.buildExecutionFlags(production),
        rehearsalMode: uiOverrides.rehearsalMode === true,
      },
    };
  }

  private resolveDataMode(observation: ObservationSnapshot): ProductionStore["meta"]["dataMode"] {
    if (observation.sources.length === 0) return "unavailable";
    if (this.adapters.vmix.isAvailable) return "live";
    if (observation.devMode) return "simulated";
    return "unavailable";
  }

  private async ingestAdapterTelemetry(): Promise<void> {
    const pollStartedAt = Date.now();
    const vmixSnapshot = await this.adapters.vmix.poll();
    this.lastVmixPollLatencyMs = Date.now() - pollStartedAt;

    if (vmixSnapshot.ok && vmixSnapshot.fetchedAt) {
      this.lastVmixSuccessfulPollAt = vmixSnapshot.fetchedAt;
    }

    if (vmixSnapshot.ok) {
      this.sources.stopAutoDiscovery();
      this.sources.syncFromAdapter(vmixSnapshot.sources, "vmix");

      if (vmixSnapshot.previewSourceId) {
        this.production.previewSourceId = vmixSnapshot.previewSourceId;
      }
      if (vmixSnapshot.programSourceId) {
        this.production.programSourceId = vmixSnapshot.programSourceId;
      }
      this.production.isRecording = vmixSnapshot.isRecording;
      this.audio.ingestFromAdapter(vmixSnapshot.audioChannels);
      return;
    }

    if (this.adapters.vmix.resolveBaseUrl()) {
      this.sources.clearAdapterSources("vmix");
      this.audio.ingestFromAdapter([]);
      this.production.previewSourceId = null;
      this.production.programSourceId = null;
      this.production.isRecording = false;
    }

    if (isBroadcastDevMode() && !this.sources.getActiveRegistry().length) {
      this.sources.startAutoDiscovery();
    }
  }

  async executeCommand(
    command: ProductionCommand,
    uiOverrides: UiOverrides = {},
  ): Promise<ProductionStore> {
    switch (command.type) {
      case "set_preview":
        this.production.previewSourceId = command.sourceId;
        await this.adapters.vmix.setPreview(
          this.resolveVmixInputNumber(command.sourceId) ?? 0,
        );
        this.log.append({
          phase: "command",
          severity: "green",
          message: `Preview set to ${command.sourceId}`,
          metadata: { command: "set_preview", sourceId: command.sourceId },
        });
        break;
      case "transition":
        await this.runTransition(command.transition);
        this.log.append({
          phase: "command",
          severity: "green",
          message: `Transition executed: ${command.transition}`,
          metadata: { command: "transition", transition: command.transition },
        });
        break;
      case "go_live": {
        const preflight = await this.hydrateStore(uiOverrides);
        const allowed = this.readiness.canLaunchWithOverride(
          preflight.readinessReport,
          preflight.production.supervisorOverride,
          preflight.production.supervisorReason,
        );
        if (!allowed) {
          this.log.append({
            phase: "interlock",
            severity: "black",
            message: "Go live blocked by readiness interlock",
            metadata: { command: "go_live" },
          });
          throw new GoLiveBlockedError();
        }

        const rehearsalMode = uiOverrides.rehearsalMode === true;
        if (rehearsalMode) {
          this.liveSessionIsRehearsal = true;
          this.production.isLive = true;
          this.stream.setRehearsalLive(true);
          this.log.append({
            phase: "command",
            severity: "yellow",
            message: preflight.production.supervisorOverride
              ? "Rehearsal go live simulated with supervisor override"
              : "Rehearsal go live simulated — adapter streaming not started",
            metadata: {
              command: "go_live",
              rehearsalMode: "true",
              supervisorOverride: String(preflight.production.supervisorOverride),
            },
          });
          break;
        }

        this.liveSessionIsRehearsal = false;
        await this.adapters.vmix.startStreaming();
        this.production.isLive = true;
        this.stream.setDevLive(true);
        this.log.append({
          phase: "command",
          severity: "green",
          message: preflight.production.supervisorOverride
            ? "Go live with supervisor override — failures remain logged"
            : "Go live approved by interlock",
          metadata: {
            command: "go_live",
            supervisorOverride: String(preflight.production.supervisorOverride),
          },
        });
        break;
      }
      case "end_live": {
        const rehearsalEnd = this.liveSessionIsRehearsal;
        this.production.isLive = false;

        if (rehearsalEnd) {
          this.stream.setRehearsalLive(false);
          this.liveSessionIsRehearsal = false;
          this.log.append({
            phase: "command",
            severity: "yellow",
            message: "Rehearsal ended — adapter streaming unchanged",
            metadata: { command: "stop_live", rehearsalMode: "true" },
          });
          break;
        }

        this.stream.setDevLive(false);
        await this.adapters.vmix.stopStreaming();
        this.log.append({
          phase: "command",
          severity: "yellow",
          message: "Broadcast ended",
          metadata: { command: "stop_live" },
        });
        break;
      }
      default:
        break;
    }

    return this.hydrateStore(uiOverrides);
  }

  async recordMitigationIntent(
    checkId: string,
    uiOverrides: UiOverrides = {},
  ): Promise<ProductionStore> {
    return this.hydrateStore(uiOverrides, { mitigationCheckId: checkId });
  }

  reset(): void {
    if (this.vmixPollInterval) {
      clearInterval(this.vmixPollInterval);
      this.vmixPollInterval = null;
    }
    this.sources.reset();
    this.audio.reset();
    this.stream.reset();
    this.safety.reset();
    this.log.reset();
    this.lastGuardianLogSignature = "";
    this.liveSessionIsRehearsal = false;
    this.production = defaultProductionState();
    this.started = false;
    this.lastVmixPollLatencyMs = null;
    this.lastVmixSuccessfulPollAt = null;
  }

  /** Phase 1 — Observe: ingest live telemetry from services and adapters. */
  private observe(): ObservationSnapshot {
    const devMode = isBroadcastDevMode();
    const sources = this.sources.getActiveRegistry();
    const audioTelemetry = this.audio.getLiveMixerLevels();
    const streamTelemetry = this.stream.getPipelineStatus();
    const adapterConnectionStates = this.buildAdapterStates();

    this.log.append({
      phase: "observe",
      severity: sources.length > 0 ? "green" : devMode ? "yellow" : "red",
      message:
        sources.length > 0
          ? `Observed ${sources.length} source(s) — vMix ${this.adapters.vmix.isAvailable ? "connected" : "pending"}`
          : devMode
            ? "Observed empty registry — DEV_MODE discovery pending"
            : "Observed empty registry — awaiting adapter connection",
      metadata: {
        sourceCount: String(sources.length),
        devMode: String(devMode),
      },
    });

    return {
      devMode,
      sources,
      audioTelemetry,
      streamTelemetry,
      adapterConnectionStates,
    };
  }

  /** Phase 2 — Evaluate: deterministic readiness scoring. */
  private evaluate(
    observation: ObservationSnapshot,
    production: ProductionState,
  ): ReadinessReport {
    const report = this.readiness.evaluate({
      sources: observation.sources,
      audio: observation.audioTelemetry,
      stream: observation.streamTelemetry,
      production,
      devMode: observation.devMode,
    });

    const severity =
      report.hardBlocks.length > 0
        ? "black"
        : report.criticalFailures.length > 0
          ? "red"
          : report.warnings.length > 0
            ? "yellow"
            : "green";

    this.log.append({
      phase: "evaluate",
      severity,
      message: `Readiness score ${report.score} — ${report.canGoLive ? "passing" : "issues detected"}`,
      metadata: {
        score: String(report.score),
        canGoLive: String(report.canGoLive),
        hardBlocks: String(report.hardBlocks.length),
      },
    });

    return report;
  }

  /** Phase 3 — Interlock: launch gate with override rules (failures stay visible). */
  private interlock(report: ReadinessReport, production: ProductionState): void {
    const overrideEligible = this.readiness.canLaunchWithOverride(
      report,
      production.supervisorOverride,
      production.supervisorReason,
    );

    this.log.append({
      phase: "interlock",
      severity: report.hardBlocks.length > 0 ? "black" : report.canGoLive ? "green" : "orange",
      message: report.hardBlocks.length > 0
        ? `${report.hardBlocks.length} BLACK hard-block(s) — override impossible`
        : report.canGoLive
          ? "Interlock open — go live permitted"
          : production.supervisorOverride
            ? overrideEligible
              ? "Supervisor override active — failures remain logged"
              : "Supervisor override insufficient (reason ≥ 8 chars required)"
            : "Interlock closed — resolve failures or apply supervisor override",
      metadata: {
        hardBlocks: String(report.hardBlocks.length),
        supervisorOverride: String(production.supervisorOverride),
      },
    });
  }

  /** Phase 4 — Mitigate: ProductionSafetyEngine recommendations (never hides failures). */
  private mitigate(
    observation: ObservationSnapshot,
    readinessReport: ReadinessReport,
    production: ProductionState,
  ) {
    const actions = this.safety.rebuild({
      sources: observation.sources,
      audio: observation.audioTelemetry,
      stream: observation.streamTelemetry,
      readiness: readinessReport,
      production,
      mediaCore: observation.adapterConnectionStates.vmix,
    });

    this.logGuardianRecommendations(actions);

    this.log.append({
      phase: "mitigate",
      severity: actions.some((a) => a.severity === "black")
        ? "black"
        : actions.length > 0
          ? "orange"
          : "green",
      message:
        actions.length > 0
          ? `${actions.length} Event Guardian recommendation(s) — human approval required`
          : "No active Event Guardian recommendations",
      metadata: { actionCount: String(actions.length) },
    });

    return actions;
  }

  private logGuardianRecommendations(actions: ReturnType<ProductionSafetyEngine["rebuild"]>): void {
    const guardianActions = actions.filter((action) => action.ruleId);
    const signature = guardianActionSignature(guardianActions);

    if (signature === this.lastGuardianLogSignature) return;
    this.lastGuardianLogSignature = signature;

    for (const action of guardianActions) {
      this.log.append({
        phase: "mitigate",
        severity: action.severity,
        message: `${action.issue ?? action.title} → ${action.recommendation}`,
        metadata: {
          ruleId: action.ruleId ?? "",
          impact: action.estimatedImpact ?? "",
          timestamp: action.timestamp ?? new Date().toISOString(),
        },
      });
    }
  }

  /** Phase 5 — Log: audit trail for operator and downstream systems. */
  private recordLogCycle(
    observation: ObservationSnapshot,
    readinessReport: ReadinessReport,
    safetyActions: ReturnType<ProductionSafetyEngine["rebuild"]>,
    options: HydrateOptions,
  ): void {
    if (options.mitigationCheckId) {
      this.log.append({
        phase: "mitigate",
        severity: "orange",
        message: `Mitigation intent recorded for ${options.mitigationCheckId} — interlock state unchanged`,
        metadata: { checkId: options.mitigationCheckId },
      });
    }

    this.log.append({
      phase: "log",
      severity: "green",
      message: "Production cycle logged",
      metadata: {
        dataMode: this.resolveDataMode(observation),
        failures: String(
          readinessReport.hardBlocks.length +
            readinessReport.criticalFailures.length +
            readinessReport.warnings.length,
        ),
        mitigations: String(safetyActions.length),
      },
    });
  }

  private resolveProductionState(
    observation: ObservationSnapshot,
    uiOverrides: UiOverrides,
  ): ProductionState {
    const production: ProductionState = {
      ...this.production,
      ...uiOverrides,
    };

    if (observation.devMode && !production.previewSourceId && observation.sources.length > 1) {
      production.previewSourceId = observation.sources[1]?.id ?? null;
    }
    if (observation.devMode && !production.programSourceId && observation.sources.length > 0) {
      production.programSourceId = observation.sources[0]?.id ?? null;
    }

    return production;
  }

  private async runTransition(transition: TransitionType): Promise<void> {
    this.production.lastTransition = transition;

    if (transition === "cut" || transition === "take") {
      await this.adapters.vmix.cut();
      this.production.programSourceId = this.production.previewSourceId;
    } else if (transition === "fade") {
      await this.adapters.vmix.fade();
      this.production.programSourceId = this.production.previewSourceId;
    } else if (transition === "stinger") {
      await this.adapters.vmix.triggerStinger();
      this.production.stingerActive = true;
      this.production.programSourceId = this.production.previewSourceId;
      this.production.stingerActive = false;
    }
  }

  private resolveVmixInputNumber(sourceId: string): number | null {
    const source = this.sources.getActiveRegistry().find((item) => item.id === sourceId);
    return source?.vmixInputNumber ?? null;
  }

  private buildAdapterStates(): Record<AdapterId, AdapterConnectionMeta> {
    const entries = Object.entries(this.adapters) as Array<
      [AdapterId, (typeof this.adapters)[AdapterId]]
    >;

    return entries.reduce(
      (acc, [adapterId, adapter]) => {
        acc[adapterId] = {
          adapterId,
          connectionState: adapter.connectionState,
          lastError: adapter.lastError,
          isAvailable: adapter.isAvailable,
        };
        return acc;
      },
      {} as Record<AdapterId, AdapterConnectionMeta>,
    );
  }

  private buildDataSourceLabel(dataMode: ProductionStore["meta"]["dataMode"]): string {
    if (dataMode === "simulated") return "Simulated telemetry";
    if (dataMode === "live") return "Live adapter data";
    return "Unavailable";
  }

  private buildVmixHealthMeta(observation: ObservationSnapshot): VmixAdapterHealthMeta {
    const vmix = observation.adapterConnectionStates.vmix;
    const inputCount = observation.sources.filter((source) => source.adapterId === "vmix").length;
    const vmixConfigured = Boolean(this.adapters.vmix.resolveBaseUrl());

    let status: VmixAdapterHealthMeta["status"];
    if (!vmixConfigured && !observation.devMode) {
      status = "disconnected";
    } else if (vmix.isAvailable && vmix.connectionState === "connected" && !vmix.lastError) {
      status = "connected";
    } else if (vmix.isAvailable || vmix.lastError) {
      status = "degraded";
    } else {
      status = "disconnected";
    }

    return {
      status,
      pollLatencyMs: this.lastVmixPollLatencyMs,
      inputCount,
      lastSuccessfulPollAt: this.lastVmixSuccessfulPollAt,
      lastError: vmix.lastError,
    };
  }

  private buildExecutionFlags(production: ProductionState): ProductionExecutionFlagsMeta {
    return {
      recording: production.isRecording ? "active" : "off",
      stream: production.isLive ? "live" : "standby",
    };
  }
}

let brainSingleton: ProductionBrain | null = null;

export function getProductionBrain(): ProductionBrain {
  if (!brainSingleton) {
    brainSingleton = new ProductionBrain();
  }
  return brainSingleton;
}

export function flattenReadinessChecks(report: ProductionStore["readinessReport"]): ReadinessCheck[] {
  const failing = [...report.hardBlocks, ...report.criticalFailures, ...report.warnings];
  const unique = new Map<string, ReadinessFailure>();
  for (const item of failing) unique.set(item.id, item);

  const checks = [...unique.values()].map((failure) => failureToCheck(failure, false));

  if (report.canGoLive && checks.length === 0) {
    checks.push({
      id: "all_systems",
      label: "Production Interlock",
      severity: "green",
      message: "All critical checks passing",
      passed: true,
      blocksGoLive: false,
      hardBlock: false,
    });
  }

  return checks;
}

export function resolveSourceCardStatus(
  sourceId: string,
  previewId: string | null,
  programId: string | null,
  online: boolean,
): "active" | "preview" | "idle" | "offline" {
  if (!online) return "offline";
  if (sourceId === programId) return "active";
  if (sourceId === previewId) return "preview";
  return "idle";
}

export function mapStoreToUiViews(store: ProductionStore) {
  return {
    sources: store.sources.map((source) => ({
      id: source.id,
      name: source.name,
      connectionType:
        source.protocol === "unknown" ? ("hdmi" as const) : source.protocol,
      online: source.online,
      isDark: source.isDark,
      isOverexposed: source.isOverexposed,
      signalStrength: source.signalStrength,
      vmixInputNumber: source.vmixInputNumber,
      adapterSource: source.adapterId ?? undefined,
    })),
    audioChannels: store.audioTelemetry.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      volume: channel.volume,
      muted: channel.muted,
      meterLevel: channel.meterLevel,
      clipping: channel.clipping,
      autoGain: channel.autoGain,
    })),
    destinations: store.streamTelemetry.destinations.map((dest) => ({
      id: dest.id,
      name: dest.name,
      connected: dest.connected,
      live: dest.live,
      bitrateKbps: dest.bitrateKbps,
      error: dest.error,
    })),
  };
}
