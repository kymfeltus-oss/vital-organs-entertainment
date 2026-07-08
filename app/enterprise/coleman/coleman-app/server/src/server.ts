import "dotenv/config";

import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import path from "path";

import { prisma } from "./db/prisma";
import {
  toHistoryResponse,
  toTheoryResponse,
  toTrackResponse,
} from "./db/mappers";
import {
  getUploadsDir,
  inferStemType,
  initStorage,
  resolveUploadPath,
  deleteUploadedFile,
} from "./storage";
import { validateCreateTrack, validateUploadedFile } from "./validation";

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

initStorage();

const uploadsDir = getUploadsDir();

app.use("/audio-stream", express.static(uploadsDir));

const diskStorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^\w.\-()+]/g, "_");
    cb(null, `${timestamp}-${cleanName}`);
  },
});

const uploadParser = multer({
  storage: diskStorageEngine,
  limits: { fileSize: 100 * 1024 * 1024 },
});

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

async function fetchSetlist(_req: Request, res: Response) {
  const tracks = await prisma.track.findMany({
    include: { audioFiles: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(tracks.map(toTrackResponse));
}

async function createTrack(req: Request, res: Response) {
  const validation = validateCreateTrack(req.body);
  if (validation.ok === false) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const created = await prisma.track.create({
    data: {
      title: validation.title,
      artist: validation.artist,
      musicalKey: validation.musicalKey,
      bpm: validation.bpm,
    },
    include: { audioFiles: true },
  });

  res.status(201).json(toTrackResponse(created));
}

async function uploadStem(req: Request, res: Response) {
  const { trackId } = req.params;

  if (!trackId?.trim()) {
    res.status(400).json({ error: "Track id is required." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Missing active multipart file stream" });
    return;
  }

  const fileValidation = validateUploadedFile(
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
  );

  if (fileValidation.ok === false) {
    res.status(400).json({ error: fileValidation.error });
    return;
  }

  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) {
    res.status(404).json({ error: "Targeted service track record mapping not found" });
    return;
  }

  const stemTypeField = typeof req.body?.stemType === "string" ? req.body.stemType : "";
  const stemType = stemTypeField.trim() || inferStemType(req.file.originalname);

  await prisma.audioAsset.create({
    data: {
      filename: req.file.filename,
      originName: req.file.originalname,
      stemType,
      fileSize: req.file.size,
      trackId,
    },
  });

  const updated = await prisma.track.findUniqueOrThrow({
    where: { id: trackId },
    include: { audioFiles: true },
  });

  res.json(toTrackResponse(updated));
}

async function removeStem(req: Request, res: Response) {
  const { stemId } = req.params;

  if (!stemId?.trim()) {
    res.status(400).json({ error: "Stem id is required." });
    return;
  }

  const asset = await prisma.audioAsset.findUnique({ where: { id: stemId } });
  if (!asset) {
    res.status(404).json({ error: "Stem not found." });
    return;
  }

  deleteUploadedFile(asset.filename);
  await prisma.audioAsset.delete({ where: { id: stemId } });
  res.json({ ok: true, id: stemId });
}

async function streamAudio(req: Request, res: Response) {
  const filename = req.params.filename;
  const filePath = resolveUploadPath(filename);

  if (!filePath) {
    res.status(404).json({ error: "Audio file not found." });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeByExt: Record<string, string> = {
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

async function fetchHistory(_req: Request, res: Response) {
  const history = await prisma.playbackHistory.findMany({
    include: { track: true },
    orderBy: { playedAt: "desc" },
    take: 200,
  });
  res.json(history.map(toHistoryResponse));
}

async function recordHistory(req: Request, res: Response) {
  const trackId = typeof req.body?.trackId === "string" ? req.body.trackId.trim() : "";
  if (!trackId) {
    res.status(400).json({ error: "trackId is required." });
    return;
  }

  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) {
    res.status(404).json({ error: "Track not found." });
    return;
  }

  const entry = await prisma.playbackHistory.create({
    data: { trackId },
    include: { track: true },
  });

  res.status(201).json(toHistoryResponse(entry));
}

async function fetchTheory(_req: Request, res: Response) {
  const catalog = await prisma.theoryProgression.findMany({
    orderBy: { createdAt: "asc" },
  });
  res.json(catalog.map(toTheoryResponse));
}

async function healthCheck(_req: Request, res: Response) {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, service: "coleman-unified-backend", database: "connected" });
}

app.get("/health", asyncHandler(healthCheck));
app.get("/api/coleman/health", asyncHandler(healthCheck));

app.get("/api/setlist", asyncHandler(fetchSetlist));
app.get("/api/coleman/setlist", asyncHandler(fetchSetlist));

app.post("/api/setlist/track", asyncHandler(createTrack));
app.post("/api/coleman/setlist/track", asyncHandler(createTrack));
app.post("/api/coleman/setlist", asyncHandler(createTrack));
app.post("/api/coleman/track/create", asyncHandler(createTrack));
app.post("/api/track/create", asyncHandler(createTrack));

app.post(
  "/api/setlist/upload/:trackId",
  uploadParser.single("stem"),
  asyncHandler(uploadStem),
);
app.post(
  "/api/coleman/setlist/upload/:trackId",
  uploadParser.single("stem"),
  asyncHandler(uploadStem),
);
app.post(
  "/api/coleman/track/upload-stem/:trackId",
  uploadParser.single("stem"),
  asyncHandler(uploadStem),
);
app.post(
  "/api/track/upload-stem/:trackId",
  uploadParser.single("stem"),
  asyncHandler(uploadStem),
);

app.delete("/api/coleman/stem/remove/:stemId", asyncHandler(removeStem));
app.delete("/api/stem/remove/:stemId", asyncHandler(removeStem));

app.get("/api/coleman/audio/:filename", asyncHandler(streamAudio));

app.get("/api/coleman/history", asyncHandler(fetchHistory));
app.post("/api/coleman/history", asyncHandler(recordHistory));

app.get("/api/coleman/theory", asyncHandler(fetchTheory));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(
    `COLEMAN Unified Backend running live on address endpoint: http://localhost:${PORT}`,
  );
});
