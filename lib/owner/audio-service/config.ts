/** Server-only — FastAPI audio worker (X32 OSC bridge). */
export function resolveAudioServiceBaseUrl(): string | null {
  const raw = process.env.AUDIO_SERVICE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function resolveAudioServiceToken(): string | null {
  const raw = process.env.AUDIO_SERVICE_TOKEN?.trim();
  return raw || null;
}

export function isAudioServiceConfigured(): boolean {
  return Boolean(resolveAudioServiceBaseUrl() && resolveAudioServiceToken());
}
