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

