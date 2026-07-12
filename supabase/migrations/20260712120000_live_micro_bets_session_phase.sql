-- Session phase + resolution window for LIV Golf micro-bet showcase orchestration.

ALTER TABLE public.live_micro_bets_session
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_winner text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'live_micro_bets_session_phase_check'
  ) THEN
    ALTER TABLE public.live_micro_bets_session
      ADD CONSTRAINT live_micro_bets_session_phase_check
      CHECK (phase IN ('OPEN', 'CLOSING_SOON', 'LOCKED', 'RESOLVED'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'live_micro_bets_session_resolved_winner_check'
  ) THEN
    ALTER TABLE public.live_micro_bets_session
      ADD CONSTRAINT live_micro_bets_session_resolved_winner_check
      CHECK (resolved_winner IS NULL OR resolved_winner IN ('Yes', 'No'));
  END IF;
END $$;

COMMENT ON COLUMN public.live_micro_bets_session.phase IS
  'Authoritative wagering lifecycle phase surfaced to fan overlay + studio controls.';
COMMENT ON COLUMN public.live_micro_bets_session.ends_at IS
  'Server-computed wagering window deadline (ISO timestamptz).';
COMMENT ON COLUMN public.live_micro_bets_session.resolved_winner IS
  'Winning Yes/No selection after studio resolution.';
