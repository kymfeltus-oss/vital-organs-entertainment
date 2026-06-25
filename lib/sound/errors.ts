export function plainEnglishSoundError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      return "Production audio agent is not running on this computer. Start the Parable audio service and try again.";
    }
    if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
      return "Audio agent authentication failed. Check AUDIO_SERVICE_TOKEN on this server.";
    }
    return msg;
  }
  return "Sound request failed.";
}

export function isSchemaCacheError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("schema cache") ||
    (msg.includes("Could not find") && msg.includes("column")) ||
    msg.includes("PGRST204") ||
    msg.includes("42703")
  );
}

export const SOUND_SETUP_SAVE_USER_MESSAGE =
  "Sound setup could not be saved yet. Please try again after setup finishes.";

export function toUserFacingSoundError(error: unknown): string {
  if (isSchemaCacheError(error)) {
    console.error("[SOUND_SCHEMA_ERR]", error);
    return SOUND_SETUP_SAVE_USER_MESSAGE;
  }
  return plainEnglishSoundError(error);
}
