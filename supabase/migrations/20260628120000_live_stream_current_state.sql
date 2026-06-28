-- Instant Go-Live override — decoupled from event_countdown_config schedule registry.
ALTER TABLE public.live_stream_state
  ADD COLUMN IF NOT EXISTS current_state text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS imminent_live_started_at timestamptz;

ALTER TABLE public.live_stream_state
  DROP CONSTRAINT IF EXISTS live_stream_state_current_state_check;

ALTER TABLE public.live_stream_state
  ADD CONSTRAINT live_stream_state_current_state_check
  CHECK (current_state IN ('offline', 'imminent_live', 'live'));

COMMENT ON COLUMN public.live_stream_state.current_state IS
  'Broadcast override state — imminent_live bypasses schedule; does not mutate event_countdown_config.';
COMMENT ON COLUMN public.live_stream_state.imminent_live_started_at IS
  'Server anchor for attendee drop-curtain countdown (local client timer from this timestamp).';
