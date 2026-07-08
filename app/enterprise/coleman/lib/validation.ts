const ALLOWED_AUDIO_EXTENSIONS = new Set([
  ".wav",
  ".mp3",
  ".m4a",
  ".aiff",
  ".aac",
  ".flac",
  ".ogg",
]);

const ALLOWED_AUDIO_MIME = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aiff",
  "audio/x-aiff",
  "audio/aac",
  "audio/flac",
  "audio/ogg",
]);

export type CreateTrackInput = {
  title: string;
  musicalKey: string;
  bpm: number;
  duration: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateCreateTrack(body: unknown): ValidationResult<CreateTrackInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body is required." };
  }

  const record = body as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";

  if (!title) {
    return { ok: false, error: "Song title is required." };
  }

  if (title.length > 120) {
    return { ok: false, error: "Song title must be 120 characters or fewer." };
  }

  const musicalKey =
    typeof record.musicalKey === "string" && record.musicalKey.trim()
      ? record.musicalKey.trim()
      : "Open Pitch";

  let bpm = 0;
  if (record.bpm !== undefined && record.bpm !== null && record.bpm !== "") {
    const parsed = Number(record.bpm);
    if (!Number.isFinite(parsed) || parsed < 40 || parsed > 240) {
      return { ok: false, error: "BPM must be a number between 40 and 240." };
    }
    bpm = Math.round(parsed);
  }

  const duration =
    typeof record.duration === "string" && record.duration.trim()
      ? record.duration.trim()
      : "—";

  return {
    ok: true,
    value: {
      title: title.toUpperCase(),
      musicalKey,
      bpm,
      duration,
    },
  };
}

export function validateAudioUpload(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
): ValidationResult<{ fileName: string; mimeType: string }> {
  if (!fileName.trim()) {
    return { ok: false, error: "Uploaded file name is missing." };
  }

  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";

  if (!ALLOWED_AUDIO_EXTENSIONS.has(ext) && !ALLOWED_AUDIO_MIME.has(mimeType)) {
    return {
      ok: false,
      error: "Only WAV, MP3, M4A, AIFF, AAC, FLAC, or OGG files are allowed.",
    };
  }

  const maxBytes = 100 * 1024 * 1024;
  if (sizeBytes <= 0) {
    return { ok: false, error: "Uploaded file is empty." };
  }

  if (sizeBytes > maxBytes) {
    return { ok: false, error: "Uploaded file exceeds the 100 MB limit." };
  }

  return { ok: true, value: { fileName, mimeType } };
}

export function parseKeyBpmField(raw: string): { key: string; bpm: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { key: "", bpm: "" };
  }

  const bpmMatch = trimmed.match(/(\d{2,3})\s*bpm/i);
  const bpm = bpmMatch ? bpmMatch[1] : "";
  const key = trimmed
    .replace(/(\d{2,3})\s*bpm/gi, "")
    .replace(/[•|/]/g, " ")
    .trim();

  return { key, bpm };
}
