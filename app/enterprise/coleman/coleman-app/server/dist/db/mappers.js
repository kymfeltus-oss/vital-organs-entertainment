"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTrackResponse = toTrackResponse;
exports.toHistoryResponse = toHistoryResponse;
exports.toTheoryResponse = toTheoryResponse;
function toTrackResponse(track) {
    return {
        id: track.id,
        title: track.title,
        artist: track.artist ?? "Unknown Artist",
        musicalKey: track.musicalKey,
        bpm: track.bpm ?? 0,
        duration: "—",
        audioFiles: track.audioFiles.map((asset) => asset.filename),
        createdAt: track.createdAt.toISOString(),
    };
}
function toHistoryResponse(entry) {
    return {
        id: entry.id,
        trackId: entry.trackId,
        title: entry.track.title,
        playedAt: entry.playedAt.toISOString(),
    };
}
function toTheoryResponse(entry) {
    return {
        id: entry.id,
        title: entry.name,
        key: entry.chords,
        nashvilleNumbers: entry.numbers.replace(/-/g, "  -  "),
        progressionLabel: entry.numbers,
        churchMovement: entry.description ?? "",
    };
}
