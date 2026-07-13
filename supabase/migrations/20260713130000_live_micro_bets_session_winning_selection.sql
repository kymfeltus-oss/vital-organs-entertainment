-- Align live_micro_bets_session with production winning-selection resolution contract.

ALTER TABLE public.live_micro_bets_session
  ADD COLUMN IF NOT EXISTS winning_selection_id text;

COMMENT ON COLUMN public.live_micro_bets_session.winning_selection_id IS
  'Authoritative wager selection id when phase = RESOLVED (e.g. yes, no, or showcase selection id).';

-- Normalize any drifted rows before enforcing the invariant.
UPDATE public.live_micro_bets_session
SET
  winning_selection_id = NULL,
  resolved_winner = NULL
WHERE phase IS DISTINCT FROM 'RESOLVED';

UPDATE public.live_micro_bets_session
SET resolved_winner = NULL
WHERE phase IS DISTINCT FROM 'RESOLVED'
  AND resolved_winner IS NOT NULL;

ALTER TABLE public.live_micro_bets_session
  DROP CONSTRAINT IF EXISTS check_winning_resolution;

ALTER TABLE public.live_micro_bets_session
  ADD CONSTRAINT check_winning_resolution
  CHECK (
    (phase = 'RESOLVED' AND winning_selection_id IS NOT NULL)
    OR (phase IS DISTINCT FROM 'RESOLVED' AND winning_selection_id IS NULL)
  );

ALTER TABLE public.live_micro_bets_session
  DROP CONSTRAINT IF EXISTS live_micro_bets_session_resolved_winner_phase_check;

ALTER TABLE public.live_micro_bets_session
  ADD CONSTRAINT live_micro_bets_session_resolved_winner_phase_check
  CHECK (
    (phase = 'RESOLVED' AND resolved_winner IN ('Yes', 'No'))
    OR (phase IS DISTINCT FROM 'RESOLVED' AND resolved_winner IS NULL)
  );
