import { isE2EBypassEnabled } from "@/lib/access/e2e-bypass";

/**
 * Server-only live ticket bypass for local/build testing.
 * Never expose via NEXT_PUBLIC_ — keep in API routes only.
 */
export function isLiveAccessDevBypassEnabled(): boolean {
  return (
    isE2EBypassEnabled() ||
    process.env.LIVE_ACCESS_DEV_BYPASS?.trim().toLowerCase() === "true"
  );
}
