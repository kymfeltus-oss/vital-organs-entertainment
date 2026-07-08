"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("./db/prisma");
const mappers_1 = require("./db/mappers");
const storage_1 = require("./storage");
const validation_1 = require("./validation");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
(0, storage_1.initStorage)();
const uploadsDir = (0, storage_1.getUploadsDir)();
app.use("/audio-stream", express_1.default.static(uploadsDir));
const diskStorageEngine = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const cleanName = file.originalname.replace(/[^\w.\-()+]/g, "_");
        cb(null, `${timestamp}-${cleanName}`);
    },
});
const uploadParser = (0, multer_1.default)({
    storage: diskStorageEngine,
    limits: { fileSize: 100 * 1024 * 1024 },
});
function asyncHandler(handler) {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
    };
}
async function fetchSetlist(_req, res) {
    const tracks = await prisma_1.prisma.track.findMany({
        include: { audioFiles: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(tracks.map(mappers_1.toTrackResponse));
}
async function createTrack(req, res) {
    const validation = (0, validation_1.validateCreateTrack)(req.body);
    if (validation.ok === false) {
        res.status(400).json({ error: validation.error });
        return;
    }
    const created = await prisma_1.prisma.track.create({
        data: {
            title: validation.title,
            artist: validation.artist,
            musicalKey: validation.musicalKey,
            bpm: validation.bpm,
        },
        include: { audioFiles: true },
    });
    res.status(201).json((0, mappers_1.toTrackResponse)(created));
}
async function uploadStem(req, res) {
    const { trackId } = req.params;
    if (!trackId?.trim()) {
        res.status(400).json({ error: "Track id is required." });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: "Missing active multipart file stream" });
        return;
    }
    const fileValidation = (0, validation_1.validateUploadedFile)(req.file.originalname, req.file.mimetype, req.file.size);
    if (fileValidation.ok === false) {
        res.status(400).json({ error: fileValidation.error });
        return;
    }
    const track = await prisma_1.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
        res.status(404).json({ error: "Targeted service track record mapping not found" });
        return;
    }
    const stemTypeField = typeof req.body?.stemType === "string" ? req.body.stemType : "";
    const stemType = stemTypeField.trim() || (0, storage_1.inferStemType)(req.file.originalname);
    await prisma_1.prisma.audioAsset.create({
        data: {
            filename: req.file.filename,
            originName: req.file.originalname,
            stemType,
            fileSize: req.file.size,
            trackId,
        },
    });
    const updated = await prisma_1.prisma.track.findUniqueOrThrow({
        where: { id: trackId },
        include: { audioFiles: true },
    });
    res.json((0, mappers_1.toTrackResponse)(updated));
}
async function streamAudio(req, res) {
    const filename = req.params.filename;
    const filePath = (0, storage_1.resolveUploadPath)(filename);
    if (!filePath) {
        res.status(404).json({ error: "Audio file not found." });
        return;
    }
    const ext = path_1.default.extname(filePath).toLowerCase();
    const mimeByExt = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".aiff": "audio/aiff",
        ".aac": "audio/aac",
        ".flac": "audio/flac",
        ".ogg": "audio/ogg",
    };
    res.type(mimeByExt[ext] ?? "application/octet-stream");
    res.sendFile(filePath);
}
async function fetchHistory(_req, res) {
    const history = await prisma_1.prisma.playbackHistory.findMany({
        include: { track: true },
        orderBy: { playedAt: "desc" },
        take: 200,
    });
    res.json(history.map(mappers_1.toHistoryResponse));
}
async function recordHistory(req, res) {
    const trackId = typeof req.body?.trackId === "string" ? req.body.trackId.trim() : "";
    if (!trackId) {
        res.status(400).json({ error: "trackId is required." });
        return;
    }
    const track = await prisma_1.prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
        res.status(404).json({ error: "Track not found." });
        return;
    }
    const entry = await prisma_1.prisma.playbackHistory.create({
        data: { trackId },
        include: { track: true },
    });
    res.status(201).json((0, mappers_1.toHistoryResponse)(entry));
}
async function fetchTheory(_req, res) {
    const catalog = await prisma_1.prisma.theoryProgression.findMany({
        orderBy: { createdAt: "asc" },
    });
    res.json(catalog.map(mappers_1.toTheoryResponse));
}
async function healthCheck(_req, res) {
    await prisma_1.prisma.$queryRaw `SELECT 1`;
    res.json({ ok: true, service: "coleman-unified-backend", database: "connected" });
}
app.get("/health", asyncHandler(healthCheck));
app.get("/api/coleman/health", asyncHandler(healthCheck));
app.get("/api/setlist", asyncHandler(fetchSetlist));
app.get("/api/coleman/setlist", asyncHandler(fetchSetlist));
app.post("/api/setlist/track", asyncHandler(createTrack));
app.post("/api/coleman/setlist/track", asyncHandler(createTrack));
app.post("/api/coleman/setlist", asyncHandler(createTrack));
app.post("/api/setlist/upload/:trackId", uploadParser.single("stem"), asyncHandler(uploadStem));
app.post("/api/coleman/setlist/upload/:trackId", uploadParser.single("stem"), asyncHandler(uploadStem));
app.get("/api/coleman/audio/:filename", asyncHandler(streamAudio));
app.get("/api/coleman/history", asyncHandler(fetchHistory));
app.post("/api/coleman/history", asyncHandler(recordHistory));
app.get("/api/coleman/theory", asyncHandler(fetchTheory));
app.use((error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
});
app.listen(PORT, () => {
    console.log(`COLEMAN Unified Backend running live on address endpoint: http://localhost:${PORT}`);
});
