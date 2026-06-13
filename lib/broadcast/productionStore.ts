import type { ProductionState, ProductionStore } from "@/lib/broadcast/types";

export type ProductionUiOverrides = Partial<
  Pick<ProductionState, "supervisorOverride" | "supervisorReason">
> & {
  rehearsalMode?: boolean;
};

export function mergeProductionStore(
  server: ProductionStore,
  uiOverrides: ProductionUiOverrides = {},
): ProductionStore {
  return {
    ...server,
    production: {
      ...server.production,
      supervisorOverride: uiOverrides.supervisorOverride ?? server.production.supervisorOverride,
      supervisorReason: uiOverrides.supervisorReason ?? server.production.supervisorReason,
    },
    meta: {
      ...server.meta,
      rehearsalMode: uiOverrides.rehearsalMode ?? server.meta.rehearsalMode ?? false,
    },
  };
}

export function dataSourceLabel(meta: ProductionStore["meta"]): string {
  return meta.dataSourceLabel;
}
