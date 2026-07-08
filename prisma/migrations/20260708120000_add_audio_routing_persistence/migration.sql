-- CreateTable: AudioRoutingConfig
CREATE TABLE "AudioRoutingConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedMode" TEXT NOT NULL DEFAULT 'SPEAKER',
    "inputSource" TEXT NOT NULL DEFAULT 'ACOUSTIC_AIR',
    "noiseGateDb" DOUBLE PRECISION NOT NULL DEFAULT -45.0,
    "lowPassCutoffHz" DOUBLE PRECISION NOT NULL DEFAULT 800.0,
    "latencyOffsetMs" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioRoutingConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AudioRoutingConfig_userId_key" ON "AudioRoutingConfig"("userId");
