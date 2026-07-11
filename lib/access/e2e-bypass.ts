/** Server-only — shared gate for synthetic owner auth and proxy route bypass in E2E/dev. */
export function isE2EBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PUBLIC_E2E_BYPASS === "true" ||
    process.env.OPS_ADMIN_DEV_BYPASS === "true"
  );
}