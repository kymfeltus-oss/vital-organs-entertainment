import { isLiveStreamRtmpSchemaError } from "@/lib/ops/fetch-live-stream-state-row";

export const STREAM_SCHEMA_MIGRATION_HINT =
  "Ops stream columns are missing in Supabase. Run scripts/apply-ops-stream-schema.sql in the SQL editor, then save again.";

export function readPostgrestErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (error instanceof Error) return error.message;
  return "Unknown database error.";
}

export function isStreamStateSchemaDeferredAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

export function shouldDeferStreamStateSchemaWrite(error: unknown): boolean {
  return (
    isStreamStateSchemaDeferredAllowed() &&
    isLiveStreamRtmpSchemaError(readPostgrestErrorMessage(error))
  );
}
