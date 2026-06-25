export const STREAMING_SETUP_PROFILES_MIGRATION = "20260705120000_streaming_setup_profiles.sql";
export const STREAMING_VALIDATION_MIGRATION = "20260707120000_streaming_destination_validation.sql";

export type StreamingSchemaMigrationKind = "setup_profiles" | "validation";

const MIGRATION_FILE_BY_KIND: Record<StreamingSchemaMigrationKind, string> = {
  setup_profiles: STREAMING_SETUP_PROFILES_MIGRATION,
  validation: STREAMING_VALIDATION_MIGRATION,
};

export class StreamingSchemaMigrationError extends Error {
  readonly code = "STREAMING_SCHEMA_MIGRATION_MISSING" as const;
  readonly kind: StreamingSchemaMigrationKind;

  constructor(kind: StreamingSchemaMigrationKind, technicalMessage: string) {
    super(technicalMessage);
    this.name = "StreamingSchemaMigrationError";
    this.kind = kind;
  }

  get migrationFile(): string {
    return MIGRATION_FILE_BY_KIND[this.kind];
  }
}

export function isStreamingSchemaMigrationError(error: unknown): error is StreamingSchemaMigrationError {
  return error instanceof StreamingSchemaMigrationError;
}

export function isStreamingSchemaMigrationMessage(message: string): StreamingSchemaMigrationKind | null {
  const lower = message.toLowerCase();
  if (
    lower.includes("streaming_setup_profiles") ||
    lower.includes("video_profile_json") ||
    lower.includes("audio_profile_json") ||
    lower.includes("encoder_profile_json") ||
    lower.includes("network_test_json") ||
    lower.includes("wizard profile columns")
  ) {
    return "setup_profiles";
  }
  if (
    lower.includes("streaming_destination_validation") ||
    lower.includes("oauth_status") ||
    lower.includes("destination_status") ||
    lower.includes("validation columns")
  ) {
    return "validation";
  }
  if (lower.includes("streaming database columns are missing") || lower.includes("schema cache")) {
    return "setup_profiles";
  }
  return null;
}

export function streamingSchemaMigrationError(
  kind: StreamingSchemaMigrationKind,
  technicalDetail: string,
): StreamingSchemaMigrationError {
  return new StreamingSchemaMigrationError(kind, technicalDetail);
}

export function publicStreamingMigrationMessage(kind: StreamingSchemaMigrationKind): string {
  const migrationFile = MIGRATION_FILE_BY_KIND[kind];
  if (process.env.NODE_ENV === "development") {
    return `Streaming setup database migration is missing. Apply ${migrationFile}.`;
  }
  return "Streaming setup is not ready yet. Please contact support.";
}

export type ServiceApiErrorResponse = {
  message: string;
  status: number;
  technicalDetail: string;
};

export function formatServiceApiError(error: unknown): ServiceApiErrorResponse {
  if (isStreamingSchemaMigrationError(error)) {
    return {
      message: publicStreamingMigrationMessage(error.kind),
      status: 503,
      technicalDetail: error.message,
    };
  }

  if (error instanceof Error) {
    const kind = isStreamingSchemaMigrationMessage(error.message);
    if (kind) {
      return {
        message: publicStreamingMigrationMessage(kind),
        status: 503,
        technicalDetail: error.message,
      };
    }
    return {
      message: error.message,
      status: 500,
      technicalDetail: error.message,
    };
  }

  return {
    message: "Request failed.",
    status: 500,
    technicalDetail: String(error),
  };
}
