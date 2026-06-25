import { getSupabaseAdmin } from "@/lib/supabase/server";
import { streamingSchemaMigrationError } from "@/lib/todays-service/migration-errors";

export type StreamingDestinationsSchema = {
  setupProfiles: boolean;
  validation: boolean;
  websiteValidation: boolean;
};

export const STREAMING_SETUP_PROFILE_DB_COLUMNS = [
  "channel_id",
  "channel_name",
  "profile_image_url",
  "oauth_permissions_json",
  "last_authenticated_at",
  "last_stream_at",
  "stream_category",
  "scheduled_start_at",
  "stream_tags",
  "video_profile_json",
  "audio_profile_json",
  "encoder_profile_json",
  "network_test_json",
  "connection_quality",
  "latency_mode",
] as const;

export const STREAMING_VALIDATION_DB_COLUMNS = [
  "oauth_status",
  "permission_status",
  "quota_status",
  "live_permission_status",
  "rtmp_status",
  "destination_status",
  "last_validated_at",
  "last_successful_validation_at",
  "last_validation_error",
] as const;

export const STREAMING_WEBSITE_VALIDATION_DB_COLUMNS = [
  "website_name",
  "website_url",
  "stream_page_url",
  "embed_method",
  "validation_status",
  "validation_reason",
] as const;

export const STREAMING_VALIDATION_CHECKS_DB_COLUMNS = ["validation_checks_json"] as const;

let cachedSchema: StreamingDestinationsSchema | null = null;
let schemaPromise: Promise<StreamingDestinationsSchema> | null = null;

function isMissingColumnProbeError(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  if (error.code === "PGRST204") return true;
  if (msg.includes("schema cache") && msg.includes("streaming_destinations")) return true;
  if (msg.includes("could not find") && msg.includes("column")) return true;
  return false;
}

async function probeColumn(column: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin().from("streaming_destinations").select(column).limit(0);
  if (!error) return true;
  if (isMissingColumnProbeError(error)) return false;
  throw new Error(error.message);
}

async function loadStreamingDestinationsSchema(): Promise<StreamingDestinationsSchema> {
  const [setupProfiles, validation, websiteValidation] = await Promise.all([
    probeColumn("video_profile_json"),
    probeColumn("oauth_status"),
    probeColumn("website_name"),
  ]);
  return { setupProfiles, validation, websiteValidation };
}

export async function getStreamingDestinationsSchema(): Promise<StreamingDestinationsSchema> {
  if (cachedSchema) return cachedSchema;
  if (!schemaPromise) {
    schemaPromise = loadStreamingDestinationsSchema().then((schema) => {
      cachedSchema = schema;
      return schema;
    });
  }
  return schemaPromise;
}

export function invalidateStreamingDestinationsSchemaCache(): void {
  cachedSchema = null;
  schemaPromise = null;
}

export async function assertStreamingSetupProfilesSchema(detail = "streaming setup profile columns"): Promise<void> {
  const schema = await getStreamingDestinationsSchema();
  if (!schema.setupProfiles) {
    throw streamingSchemaMigrationError(
      "setup_profiles",
      `Missing ${detail} on public.streaming_destinations.`,
    );
  }
}

export async function assertStreamingValidationSchema(detail = "streaming validation columns"): Promise<void> {
  const schema = await getStreamingDestinationsSchema();
  if (!schema.validation) {
    throw streamingSchemaMigrationError(
      "validation",
      `Missing ${detail} on public.streaming_destinations.`,
    );
  }
}

export function omitRecordKeys<T extends Record<string, unknown>>(
  record: T,
  keys: readonly string[],
): Partial<T> {
  const blocked = new Set<string>(keys);
  const next: Partial<T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!blocked.has(key)) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}
