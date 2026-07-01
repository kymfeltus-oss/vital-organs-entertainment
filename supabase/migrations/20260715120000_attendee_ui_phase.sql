-- Attendee /live surface authority — operator-controlled, not wall-clock derived.
ALTER TABLE public.live_stream_state
  ADD COLUMN IF NOT EXISTS attendee_ui_phase text NOT NULL DEFAULT 'pre_show';

ALTER TABLE public.live_stream_state
  DROP CONSTRAINT IF EXISTS live_stream_state_attendee_ui_phase_check;

ALTER TABLE public.live_stream_state
  ADD CONSTRAINT live_stream_state_attendee_ui_phase_check
  CHECK (attendee_ui_phase IN ('pre_show', 'live', 'ended'));

COMMENT ON COLUMN public.live_stream_state.attendee_ui_phase IS
  'Attendee /live UI routing: pre_show (holding+countdown), live (stream shell), ended (outro). Set by owner go-live / end broadcast.';

-- Backfill from existing broadcast flag.
UPDATE public.live_stream_state
SET attendee_ui_phase = CASE
  WHEN is_live = true THEN 'live'
  ELSE 'pre_show'
END
WHERE attendee_ui_phase IS NULL OR attendee_ui_phase = 'pre_show';
