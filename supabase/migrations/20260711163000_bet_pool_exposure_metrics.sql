-- LIV Golf in-stream micro-bet pool exposure metrics (real-time risk monitoring)
CREATE TABLE IF NOT EXISTS public.bet_pool_exposure_metrics (
  room_id text NOT NULL,
  bet_id text NOT NULL,
  total_yes_tickets integer NOT NULL DEFAULT 0,
  total_no_tickets integer NOT NULL DEFAULT 0,
  total_token_risk integer NOT NULL DEFAULT 0,
  max_liability_payout integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (room_id, bet_id)
);

COMMENT ON TABLE public.bet_pool_exposure_metrics IS
  'Per-room micro-bet pool exposure counters for operator risk telemetry.';

ALTER TABLE public.bet_pool_exposure_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_pool_exposure_metrics FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.bet_pool_exposure_metrics FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.bet_pool_exposure_metrics TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.bet_pool_exposure_metrics;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'bet_pool_exposure_metrics already in supabase_realtime publication';
    END;
  END IF;
END $$;
