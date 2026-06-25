import type { ChurchWebsiteSettings } from "@/lib/streaming/types";

/** Friendly label shown on the dashboard — not a URL. */
export const DEFAULT_CHURCH_WEBSITE_NAME = "Vital Organs Entertainment";

/** Public attendee live page on your church site (`/live`). */
export const DEFAULT_CHURCH_STREAM_PAGE_URL = "https://www.vitalorgansent.com/live";

export function createDefaultChurchWebsiteSettings(): ChurchWebsiteSettings {
  return {
    websiteName: DEFAULT_CHURCH_WEBSITE_NAME,
    streamPageUrl: DEFAULT_CHURCH_STREAM_PAGE_URL,
    embedMethod: "iframe",
  };
}

/** Fill empty Church Website fields with production defaults. */
export function withChurchWebsiteDefaults(
  input?: Partial<ChurchWebsiteSettings> | null,
): ChurchWebsiteSettings {
  const defaults = createDefaultChurchWebsiteSettings();
  if (!input) return defaults;
  return {
    websiteName: String(input.websiteName ?? "").trim() || defaults.websiteName,
    streamPageUrl: String(input.streamPageUrl ?? "").trim() || defaults.streamPageUrl,
    embedMethod: input.embedMethod === "link" ? "link" : defaults.embedMethod,
  };
}

export type ChurchWebsiteSettingsNormalized = {
  websiteName: string;
  websiteUrl: string;
  streamPageUrl: string;
  embedMethod: "iframe" | "link";
};

function normalizeHttpsUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function toValidUrl(value: string): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function normalizeChurchWebsiteSettings(input: {
  websiteName?: string | null;
  websiteUrl?: string | null;
  streamPageUrl?: string | null;
  embedMethod?: string | null;
}): ChurchWebsiteSettingsNormalized {
  const streamPageUrl = normalizeHttpsUrl(String(input.streamPageUrl ?? ""));
  const websiteUrlExplicit = normalizeHttpsUrl(String(input.websiteUrl ?? ""));
  const streamUrl = toValidUrl(streamPageUrl);
  const websiteUrl = websiteUrlExplicit || (streamUrl ? `${streamUrl.protocol}//${streamUrl.host}` : "");
  const embedMethod = input.embedMethod === "link" ? "link" : "iframe";
  return {
    websiteName: String(input.websiteName ?? "").trim(),
    websiteUrl,
    streamPageUrl,
    embedMethod,
  };
}

