import { cache } from "react";
import { loadTodaysService } from "@/lib/todays-service/service";
import { DEFAULT_SERVICE_TENANT_ID } from "@/lib/todays-service/types";

/**
 * Per-request deduplication for parallel Suspense boundaries.
 * Display loads skip Redis writes and alert sync (read-only path).
 */
export const getTodaysServiceForPage = cache(async (serviceId?: string) => {
  return loadTodaysService(DEFAULT_SERVICE_TENANT_ID, serviceId, { purpose: "display" });
});
