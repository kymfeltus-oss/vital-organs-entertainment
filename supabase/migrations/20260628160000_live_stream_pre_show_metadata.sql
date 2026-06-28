-- Pre-show desk metadata and gate controls for the live_stream_state singleton.
ALTER TABLE public.live_stream_state
  ADD COLUMN IF NOT EXISTS current_state text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS imminent_live_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS playback_status text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS playback_error_message text,
  ADD COLUMN IF NOT EXISTS publish_error_message text,
  ADD COLUMN IF NOT EXISTS concert_title text NOT NULL DEFAULT 'The Awakening Experience',
  ADD COLUMN IF NOT EXISTS headliner_name text NOT NULL DEFAULT 'Pastor David Jenkins',
  ADD COLUMN IF NOT EXISTS ticket_capacity_limit integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS gates_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_show_vip_only boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS audio_master_presets jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.live_stream_state
  DROP CONSTRAINT IF EXISTS live_stream_state_current_state_check;

ALTER TABLE public.live_stream_state
  ADD CONSTRAINT live_stream_state_current_state_check
  CHECK (current_state IN ('offline', 'scheduled', 'imminent_live', 'live'));

ALTER TABLE public.live_stream_state
  DROP CONSTRAINT IF EXISTS live_stream_state_ticket_capacity_limit_check;

ALTER TABLE public.live_stream_state
  ADD CONSTRAINT live_stream_state_ticket_capacity_limit_check
  CHECK (ticket_capacity_limit > 0);

COMMENT ON COLUMN public.live_stream_state.current_state IS
  'Broadcast gate state: offline | scheduled | imminent_live | live.';
COMMENT ON COLUMN public.live_stream_state.imminent_live_started_at IS
  'Server UTC anchor for the 10-second attendee drop-curtain countdown.';
COMMENT ON COLUMN public.live_stream_state.concert_title IS
  'Plain-English public title for the pre-show and live experience.';
COMMENT ON COLUMN public.live_stream_state.headliner_name IS
  'Plain-English lead pastor or headliner display name.';
COMMENT ON COLUMN public.live_stream_state.gates_locked IS
  'When true, general admission stays in the holding layer.';
COMMENT ON COLUMN public.live_stream_state.pre_show_vip_only IS
  'When true, only VIP attendees may enter the pre-show lounge early.';

NOTIFY pgrst, 'reload schema';
