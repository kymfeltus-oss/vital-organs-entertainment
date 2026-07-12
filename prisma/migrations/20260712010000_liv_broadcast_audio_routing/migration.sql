-- LIV Golf tournament broadcast audio routing persistence (production singleton per room).
CREATE TABLE IF NOT EXISTS "LivBroadcastAudioRouting" (
  "roomId" TEXT NOT NULL,
  "masterOutputMode" TEXT NOT NULL DEFAULT 'WORLD_MIX',
  "onCourseMatrix" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "commentaryTracks" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT,
  CONSTRAINT "LivBroadcastAudioRouting_pkey" PRIMARY KEY ("roomId")
);

CREATE INDEX IF NOT EXISTS "LivBroadcastAudioRouting_updatedAt_idx"
  ON "LivBroadcastAudioRouting"("updatedAt");
