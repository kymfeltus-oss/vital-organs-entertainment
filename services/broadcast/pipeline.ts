/**
 * PARABLE Production Brain pipeline:
 * Observe → Evaluate → Interlock → Mitigate → Log
 */

export type {
  ObservationSnapshot,
  ProductionLogEntry,
  ProductionPipelinePhase,
  ProductionPipelineTrace,
} from "@/services/broadcast/ProductionLogService";
export { ProductionLogService, buildPipelineTrace } from "@/services/broadcast/ProductionLogService";

export const PRODUCTION_PIPELINE_ORDER = [
  "observe",
  "evaluate",
  "interlock",
  "mitigate",
  "log",
] as const;

export type ProductionPipelineStep = (typeof PRODUCTION_PIPELINE_ORDER)[number];

export const PRODUCTION_PIPELINE_LABEL: Record<ProductionPipelineStep, string> = {
  observe: "Observe",
  evaluate: "Evaluate",
  interlock: "Interlock",
  mitigate: "Mitigate",
  log: "Log",
};
