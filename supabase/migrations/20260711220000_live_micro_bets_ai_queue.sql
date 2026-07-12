-- LIV Golf AI-generated micro-bet suggestion queue (director review gate)

CREATE TABLE IF NOT EXISTS public.live_micro_bets_ai_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  suggested_bet_id text NOT NULL,
  question text NOT NULL,
  stake_amount integer NOT NULL CHECK (stake_amount > 0),
  payout_amount integer NOT NULL CHECK (payout_amount > 0),
  player_name text,
  lie_type text,
  hole_number integer,
  distance_to_hole integer,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'launched')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS live_micro_bets_ai_queue_room_status_idx
  ON public.live_micro_bets_ai_queue (room_id, status, created_at DESC);

COMMENT ON TABLE public.live_micro_bets_ai_queue IS
  'AI-generated LIV micro-bet suggestions awaiting production director approval.';

ALTER TABLE public.live_micro_bets_ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_micro_bets_ai_queue FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.live_micro_bets_ai_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.live_micro_bets_ai_queue TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.live_micro_bets_ai_queue;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'live_micro_bets_ai_queue already in supabase_realtime publication';
    END;
  END IF;
END $$;
