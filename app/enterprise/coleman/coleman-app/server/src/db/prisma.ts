import path from "path";

declare const __dirname: string;

function loadPrismaClient() {
  const clientPath = path.join(__dirname, "../../../../lib/generated/prisma");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require(clientPath) as { PrismaClient: new () => PrismaClientLike };
  return module.PrismaClient;
}

type PrismaClientLike = {
  track: {
    findMany: (args: unknown) => Promise<TrackWithAssets[]>;
    findUnique: (args: unknown) => Promise<TrackWithAssets | null>;
    findUniqueOrThrow: (args: unknown) => Promise<TrackWithAssets>;
    create: (args: unknown) => Promise<TrackWithAssets>;
  };
  audioAsset: { create: (args: unknown) => Promise<unknown> };
  playbackHistory: {
    findMany: (args: unknown) => Promise<HistoryWithTrack[]>;
    create: (args: unknown) => Promise<HistoryWithTrack>;
  };
  theoryProgression: {
    findMany: (args: unknown) => Promise<TheoryRecord[]>;
  };
  $queryRaw: (args: unknown) => Promise<unknown>;
  $disconnect: () => Promise<void>;
};

export type TrackWithAssets = {
  id: string;
  title: string;
  artist: string | null;
  musicalKey: string;
  bpm: number | null;
  createdAt: Date;
  audioFiles: Array<{ filename: string }>;
};

export type HistoryWithTrack = {
  id: string;
  trackId: string;
  playedAt: Date;
  track: { title: string };
};

export type TheoryRecord = {
  id: string;
  name: string;
  numbers: string;
  chords: string;
  description: string | null;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientLike | undefined;
};

const PrismaClient = loadPrismaClient();

export const prisma: PrismaClientLike =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
