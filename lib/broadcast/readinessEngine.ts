export {
  flattenReadinessChecks,
  mapStoreToUiViews,
  resolveSourceCardStatus,
} from "@/services/broadcast/ProductionBrain";
export {
  ReadinessEngine,
  readinessEngine,
} from "@/services/broadcast/ReadinessEngine";
export type { ReadinessInput } from "@/services/broadcast/ReadinessEngine";

import { readinessEngine } from "@/services/broadcast/ReadinessEngine";
import type { ProductionStore, ReadinessCheck } from "@/lib/broadcast/types";
import { flattenReadinessChecks } from "@/services/broadcast/ProductionBrain";

export function computeReadinessScore(report: ProductionStore["readinessReport"]): number {
  return report.score;
}

export function canGoLive(
  report: ProductionStore["readinessReport"],
  supervisorOverride: boolean,
  supervisorReason: string,
): boolean {
  return readinessEngine.canLaunchWithOverride(
    report,
    supervisorOverride,
    supervisorReason,
  );
}

export function deriveReadinessChecks(store: ProductionStore): ReadinessCheck[] {
  return flattenReadinessChecks(store.readinessReport);
}

/** @deprecated Pass ProductionStore.readinessReport directly */
export function deriveReadinessChecksFromLegacy(): ReadinessCheck[] {
  return [];
}
