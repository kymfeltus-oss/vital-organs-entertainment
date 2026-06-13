import { TypedEvent } from "@/services/broadcast/EventBus";
import {
  evaluateEventGuardianRules,
  eventGuardianHeadline,
  type EventGuardianRecommendation,
} from "@/services/broadcast/eventGuardian";
import type {
  AdapterConnectionMeta,
  AudioTelemetry,
  HardwareSource,
  HealthStatus,
  ProductionSafetyAction,
  ProductionState,
  ReadinessReport,
  StreamTelemetry,
} from "@/lib/broadcast/types";

export type SafetyEngineEvent =
  | { type: "safetyActionsUpdated"; actions: ProductionSafetyAction[] }
  | { type: "safetyActionExecuted"; actionId: string };

let actionCounter = 0;

function nextActionId(): string {
  actionCounter += 1;
  return `safety-${actionCounter}`;
}

export class ProductionSafetyEngine {
  readonly events = new TypedEvent<SafetyEngineEvent>();

  private actions: ProductionSafetyAction[] = [];

  rebuild(input: {
    sources: HardwareSource[];
    audio: AudioTelemetry;
    stream: StreamTelemetry;
    readiness: ReadinessReport;
    production: ProductionState;
    mediaCore: AdapterConnectionMeta;
  }): ProductionSafetyAction[] {
    const guardianRules = evaluateEventGuardianRules(input);
    const actions = guardianRules.map((rule) => this.fromGuardianRule(rule));

    this.actions = actions;
    this.events.emit({ type: "safetyActionsUpdated", actions });
    return actions;
  }

  getActions(): ProductionSafetyAction[] {
    return this.actions;
  }

  executeAction(actionId: string, adapterSupports = false): ProductionSafetyAction | null {
    const action = this.actions.find((item) => item.id === actionId);
    if (!action || !action.executable || !adapterSupports) return null;

    action.executed = true;
    this.events.emit({ type: "safetyActionExecuted", actionId });
    return action;
  }

  reset(): void {
    this.actions = [];
  }

  private fromGuardianRule(rule: EventGuardianRecommendation): ProductionSafetyAction {
    return this.createAction({
      category: rule.category,
      severity: rule.severity,
      title: eventGuardianHeadline(rule.ruleId),
      issue: rule.issue,
      recommendation: rule.recommendation,
      estimatedImpact: rule.estimatedImpact,
      timestamp: rule.timestamp,
      ruleId: rule.ruleId,
      relatedCheckId: rule.relatedCheckId,
      executable: false,
    });
  }

  private createAction(input: {
    category: ProductionSafetyAction["category"];
    severity: HealthStatus;
    title: string;
    issue?: string;
    recommendation: string;
    estimatedImpact?: string;
    timestamp?: string;
    ruleId?: string;
    relatedCheckId: string | null;
    executable: boolean;
  }): ProductionSafetyAction {
    return {
      id: nextActionId(),
      category: input.category,
      severity: input.severity,
      title: input.title,
      issue: input.issue,
      recommendation: input.recommendation,
      estimatedImpact: input.estimatedImpact,
      timestamp: input.timestamp,
      ruleId: input.ruleId,
      relatedCheckId: input.relatedCheckId,
      executable: input.executable,
      executed: false,
    };
  }
}

export const productionSafetyEngine = new ProductionSafetyEngine();
