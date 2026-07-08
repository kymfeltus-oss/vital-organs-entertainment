-- CreateTable: Track
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT DEFAULT 'Unknown Artist',
    "musicalKey" TEXT NOT NULL DEFAULT 'Open Pitch',
    "bpm" INTEGER,
    "serviceName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AudioAsset
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originName" TEXT NOT NULL,
    "stemType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT NOT NULL,
    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TheoryProgression
CREATE TABLE "TheoryProgression" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numbers" TEXT NOT NULL,
    "chords" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TheoryProgression_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorshipLookup
CREATE TABLE "WorshipLookup" (
    "id" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "targetBpm" INTEGER NOT NULL,
    "roadmap" TEXT NOT NULL,
    CONSTRAINT "WorshipLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlaybackHistory
CREATE TABLE "PlaybackHistory" (
    "id" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT NOT NULL,
    CONSTRAINT "PlaybackHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioAsset_filename_key" ON "AudioAsset"("filename");
CREATE UNIQUE INDEX "WorshipLookup_songTitle_key" ON "WorshipLookup"("songTitle");

-- AddForeignKey Constraints
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaybackHistory" ADD CONSTRAINT "PlaybackHistory_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
