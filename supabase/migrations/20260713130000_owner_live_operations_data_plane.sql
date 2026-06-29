CREATE TABLE IF NOT EXISTS public.owner_audio_mix_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  channel_id text NOT NULL,
  label text NOT NULL,
  level integer NOT NULL DEFAULT 75,
  solo boolean NOT NULL DEFAULT false,
  mute boolean NOT NULL DEFAULT false,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_audio_mix_state_channel_id_bounds
    CHECK (length(trim(channel_id)) BETWEEN 1 AND 80),
  CONSTRAINT owner_audio_mix_state_label_bounds
    CHECK (length(trim(label)) BETWEEN 1 AND 120),
  CONSTRAINT owner_audio_mix_state_level_bounds
    CHECK (level BETWEEN 0 AND 100),
  CONSTRAINT owner_audio_mix_state_event_channel_unique
    UNIQUE (event_id, channel_id)
);

CREATE TABLE IF NOT EXISTS public.audio_master_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  ai_gain_guard_enabled boolean NOT NULL DEFAULT false,
  white_noise_suppressor integer NOT NULL DEFAULT 35,
  concert_eq_preset text NOT NULL DEFAULT 'full_choir',
  master_limiter_compressor integer NOT NULL DEFAULT 72,
  white_noise_suppression_preset text NOT NULL DEFAULT 'MEDIUM',
  eq_preset_mode text NOT NULL DEFAULT 'FULL_CHOIR',
  compressor_limiter_db integer NOT NULL DEFAULT -3,
  show_setup jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT audio_master_presets_event_unique UNIQUE (event_id),
  CONSTRAINT audio_master_presets_noise_bounds CHECK (white_noise_suppressor BETWEEN 0 AND 100),
  CONSTRAINT audio_master_presets_limiter_bounds CHECK (master_limiter_compressor BETWEEN 0 AND 100),
  CONSTRAINT audio_master_presets_eq_check
    CHECK (concert_eq_preset IN ('spoken_word', 'full_choir', 'acoustic_prayer')),
  CONSTRAINT audio_master_presets_limiter_db_bounds CHECK (compressor_limiter_db BETWEEN -24 AND 0)
);

CREATE TABLE IF NOT EXISTS public.owner_video_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  active_program_channel_id text,
  transition_type text NOT NULL DEFAULT 'CUT',
  twitch_restream_active boolean NOT NULL DEFAULT true,
  youtube_restream_active boolean NOT NULL DEFAULT true,
  facebook_restream_active boolean NOT NULL DEFAULT true,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_video_routing_event_unique UNIQUE (event_id),
  CONSTRAINT owner_video_routing_transition_check CHECK (transition_type IN ('CUT', 'AUTO_FADE'))
);

CREATE TABLE IF NOT EXISTS public.owner_archive_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id text NOT NULL,
  show_title text NOT NULL,
  target_type text NOT NULL DEFAULT 'DUAL_TRACK_BOTH',
  s3_bucket_path text NOT NULL DEFAULT 's3://parable-archive/300-awakening',
  resolution text NOT NULL DEFAULT '1080p',
  watermark_enabled boolean NOT NULL DEFAULT false,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_archive_policies_show_unique UNIQUE (show_id),
  CONSTRAINT owner_archive_policies_target_check
    CHECK (target_type IN ('CLEAN_ONLY', 'BURNED_CHAT_ONLY', 'DUAL_TRACK_BOTH')),
  CONSTRAINT owner_archive_policies_resolution_check CHECK (resolution IN ('1080p', '720p'))
);

CREATE TABLE IF NOT EXISTS public.owner_archive_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id text NOT NULL,
  show_title text NOT NULL,
  status text NOT NULL DEFAULT 'RECORDING',
  started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  ended_at timestamptz,
  error_log text,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_archive_jobs_status_check
    CHECK (status IN ('RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS public.owner_archive_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.owner_archive_jobs(id) ON DELETE CASCADE,
  show_id text NOT NULL,
  title text NOT NULL,
  asset_type text NOT NULL,
  video_url text NOT NULL,
  file_size_mb numeric NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_archive_assets_type_check CHECK (asset_type IN ('CLEAN_RAW', 'BURNED_CHAT')),
  CONSTRAINT owner_archive_assets_file_size_nonnegative CHECK (file_size_mb >= 0),
  CONSTRAINT owner_archive_assets_duration_nonnegative CHECK (duration_seconds >= 0)
);

CREATE INDEX IF NOT EXISTS owner_audio_mix_state_event_idx
  ON public.owner_audio_mix_state (event_id, channel_id);
CREATE INDEX IF NOT EXISTS owner_archive_jobs_show_idx
  ON public.owner_archive_jobs (show_id, started_at DESC);
CREATE INDEX IF NOT EXISTS owner_archive_assets_show_idx
  ON public.owner_archive_assets (show_id, created_at DESC);

ALTER TABLE public.owner_audio_mix_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_master_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_video_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_assets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.owner_audio_mix_state FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audio_master_presets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_video_routing FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_archive_assets FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_audio_mix_state FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.audio_master_presets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.owner_video_routing FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.owner_archive_policies FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.owner_archive_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.owner_archive_assets FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.owner_audio_mix_state TO authenticated;
GRANT SELECT ON public.audio_master_presets TO authenticated;
GRANT SELECT ON public.owner_video_routing TO authenticated;
GRANT SELECT ON public.owner_archive_policies TO authenticated;
GRANT SELECT ON public.owner_archive_jobs TO authenticated;
GRANT SELECT ON public.owner_archive_assets TO authenticated;

GRANT ALL ON public.owner_audio_mix_state TO service_role;
GRANT ALL ON public.audio_master_presets TO service_role;
GRANT ALL ON public.owner_video_routing TO service_role;
GRANT ALL ON public.owner_archive_policies TO service_role;
GRANT ALL ON public.owner_archive_jobs TO service_role;
GRANT ALL ON public.owner_archive_assets TO service_role;

DROP POLICY IF EXISTS "Authenticated operators can observe owner audio mix state"
  ON public.owner_audio_mix_state;
CREATE POLICY "Authenticated operators can observe owner audio mix state"
  ON public.owner_audio_mix_state FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated operators can observe audio master presets"
  ON public.audio_master_presets;
CREATE POLICY "Authenticated operators can observe audio master presets"
  ON public.audio_master_presets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated operators can observe owner video routing"
  ON public.owner_video_routing;
CREATE POLICY "Authenticated operators can observe owner video routing"
  ON public.owner_video_routing FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated operators can observe owner archives"
  ON public.owner_archive_policies;
CREATE POLICY "Authenticated operators can observe owner archives"
  ON public.owner_archive_policies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated operators can observe owner archive jobs"
  ON public.owner_archive_jobs;
CREATE POLICY "Authenticated operators can observe owner archive jobs"
  ON public.owner_archive_jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated operators can observe owner archive assets"
  ON public.owner_archive_assets;
CREATE POLICY "Authenticated operators can observe owner archive assets"
  ON public.owner_archive_assets FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_audio_mix_state;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_master_presets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_video_routing;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_archive_jobs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_archive_assets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

INSERT INTO public.audio_master_presets (
  event_id,
  white_noise_suppression_preset,
  eq_preset_mode,
  compressor_limiter_db,
  show_setup
)
VALUES ('300-awakening', 'MEDIUM', 'FLAT_BALANCED', -3, '{}'::jsonb)
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO public.owner_video_routing (event_id, active_program_channel_id, transition_type)
VALUES ('300-awakening', 'CAMERA_1', 'CUT')
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO public.owner_audio_mix_state (event_id, channel_id, label, level, solo, mute)
VALUES
  ('300-awakening', 'lead-vocal', 'Lead Vocal', 78, false, false),
  ('300-awakening', 'choir', 'Choir', 76, false, false),
  ('300-awakening', 'pastor-mic', 'Pastor Mic', 75, false, false),
  ('300-awakening', 'keys', 'Keys', 66, false, false),
  ('300-awakening', 'bass', 'Bass', 68, false, false),
  ('300-awakening', 'drums', 'Drums', 63, false, false),
  ('300-awakening', 'playback', 'Playback', 61, false, false),
  ('300-awakening', 'audience', 'Audience', 57, false, false),
  ('300-awakening', 'main-mix', 'Main Mix L/R', 78, false, false)
ON CONFLICT (event_id, channel_id) DO NOTHING;
