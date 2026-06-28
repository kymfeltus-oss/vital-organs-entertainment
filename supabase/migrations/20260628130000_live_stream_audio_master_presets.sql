-- Room 5 mastering desk presets persisted on the live broadcast session singleton.

ALTER TABLE public.live_stream_state
  ADD COLUMN IF NOT EXISTS audio_master_presets jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.live_stream_state.audio_master_presets IS
  'Packed JSON from POST /api/owner/audio/presets — Room 5 mastering desk FX rack configuration.';
