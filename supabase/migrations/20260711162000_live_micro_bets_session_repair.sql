-- Repair production drift: legacy live_micro_bets_session used room_id/uuid schema.
-- Align with application singleton session table (id = 'current').

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'live_micro_bets_session'
      AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.live_micro_bets_session
      RENAME TO live_micro_bets_session_legacy_room;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.live_micro_bets_session (
  id text PRIMARY KEY DEFAULT 'current',
  active_bet_id text,
  clear_overlays boolean NOT NULL DEFAULT false,
  launched_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

COMMENT ON TABLE public.live_micro_bets_session IS
  'Singleton production row tracking the active LIV Golf micro-bet session and overlay exclusivity state.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'liv_golf_live_ops'
  ) THEN
    INSERT INTO public.live_micro_bets_session (id, active_bet_id, clear_overlays, updated_at, updated_by)
    SELECT id, active_bet_id, false, updated_at, updated_by
    FROM public.liv_golf_live_ops
    ON CONFLICT (id) DO UPDATE
      SET active_bet_id = EXCLUDED.active_bet_id,
          updated_at = EXCLUDED.updated_at,
          updated_by = EXCLUDED.updated_by;

    DROP TABLE public.liv_golf_live_ops;
  END IF;
END $$;

INSERT INTO public.live_micro_bets_session (id, active_bet_id, clear_overlays)
VALUES ('current', NULL, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.live_micro_bets_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_micro_bets_session FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.live_micro_bets_session FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.live_micro_bets_session TO service_role;
