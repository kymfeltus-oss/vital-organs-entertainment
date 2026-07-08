"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateTrack = validateCreateTrack;
exports.validateUploadedFile = validateUploadedFile;
const ALLOWED_AUDIO_EXTENSIONS = new Set([
    ".wav",
    ".mp3",
    ".m4a",
    ".aiff",
    ".aac",
    ".flac",
    ".ogg",
]);
function validateCreateTrack(body) {
    if (!body || typeof body !== "object") {
        return { ok: false, error: "Request body is required." };
    }
    const record = body;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) {
        return { ok: false, error: "Song title parameter required" };
    }
    if (title.length > 120) {
        return { ok: false, error: "Song title must be 120 characters or fewer." };
    }
    const musicalKey = typeof record.musicalKey === "string" && record.musicalKey.trim()
        ? record.musicalKey.trim()
        : "Open Pitch";
    let bpm = null;
    if (record.bpm !== undefined && record.bpm !== null && record.bpm !== "") {
        const parsed = Number(record.bpm);
        if (!Number.isFinite(parsed) || parsed < 40 || parsed > 240) {
            return { ok: false, error: "BPM must be a number between 40 and 240." };
        }
        bpm = Math.round(parsed);
    }
    const artist = typeof record.artist === "string" && record.artist.trim()
        ? record.artist.trim()
        : "Unknown Artist";
    return {
        ok: true,
        title: title.toUpperCase(),
        musicalKey,
        bpm,
        artist,
    };
}
function validateUploadedFile(fileName, mimeType, sizeBytes) {
    const ext = fileName.includes(".")
        ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
        : "";
    if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
        return {
            ok: false,
            error: "Only WAV, MP3, M4A, AIFF, AAC, FLAC, or OGG files are allowed.",
        };
    }
    if (sizeBytes <= 0) {
        return { ok: false, error: "Uploaded file is empty." };
    }
    if (sizeBytes > 100 * 1024 * 1024) {
        return { ok: false, error: "Uploaded file exceeds the 100 MB limit." };
    }
    if (!mimeType.startsWith("audio/") && mimeType !== "application/octet-stream") {
        return { ok: false, error: "Invalid audio MIME type." };
    }
    return { ok: true };
}
