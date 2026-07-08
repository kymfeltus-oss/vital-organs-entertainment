-- Align Track defaults with production live baseline (— / 0 BPM)
ALTER TABLE "Track" ALTER COLUMN "musicalKey" SET DEFAULT '—';
ALTER TABLE "Track" ALTER COLUMN "bpm" SET DEFAULT 0;
