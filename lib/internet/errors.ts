const SCHEMA_ERROR_PATTERN =
  /schema cache|connection_type|could not find the .* column|column .* does not exist/i;

export const INTERNET_SETUP_NOT_READY_MESSAGE =
  "Internet setup is not ready yet. Please try again after setup finishes.";

export function isInternetSchemaError(message: string): boolean {
  return SCHEMA_ERROR_PATTERN.test(message);
}

export function sanitizeInternetError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Request failed.";
  if (isInternetSchemaError(message)) {
    return INTERNET_SETUP_NOT_READY_MESSAGE;
  }
  return message;
}

export function logInternetError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[INTERNET_SETUP] ${context}:`, error);
  if (isInternetSchemaError(message)) {
    console.error(
      "[INTERNET_SETUP] Schema mismatch — run supabase/migrations/20260702130000_internet_connections_schema.sql",
    );
  }
}
