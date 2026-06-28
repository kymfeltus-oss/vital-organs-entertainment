import type { PreflightCheck } from "@/lib/owner/contracts";

/** Preflight items that should block or warn before master go-live. */
export function derivePendingTodos(checks: PreflightCheck[]): PreflightCheck[] {
  return checks.filter((check) => check.status === "fail" || check.status === "warn");
}

export function hasBlockingTodos(checks: PreflightCheck[]): boolean {
  return checks.some((check) => check.status === "fail");
}
