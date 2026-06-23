import { isValidHlsUrl } from "@/lib/live/hls";

function resolveMobileOperatorHlsBase(): string | null {
  const fromEnv =
    process.env.NEXT_PUBLIC_MOBILE_OPERATOR_HLS_BASE?.trim() ??
    process.env.MOBILE_OPERATOR_HLS_BASE?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/+$/, "") : null;
}

/** Build the HLS preview URL the director console listens on for a mobile operator key. */
export function resolveMobileOperatorPreviewHlsUrl(
  streamKey: string | null | undefined,
): string | null {
  const key = streamKey?.trim() ?? "";
  if (!key) return null;

  const base = resolveMobileOperatorHlsBase();
  if (!base) return null;

  const candidate = `${base}/${key}.m3u8`;
  return isValidHlsUrl(candidate) ? candidate : null;
}

export function isMobileOperatorStreamKey(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return /^awakening_[a-z0-9_]+_[a-f0-9]{8}$/.test(trimmed);
}
