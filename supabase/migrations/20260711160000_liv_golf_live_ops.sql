-- LIV Golf production live-ops session state (active micro-bet, etc.)
CREATE TABLE IF NOT EXISTS public.liv_golf_live_ops (
  id text PRIMARY KEY DEFAULT 'current',
  active_bet_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

COMMENT ON TABLE public.liv_golf_live_ops IS
  'Singleton row for LIV Golf enterprise live production state (active micro-bet session).';

INSERT INTO public.liv_golf_live_ops (id, active_bet_id)
VALUES ('current', NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.liv_golf_live_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liv_golf_live_ops FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.liv_golf_live_ops FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.liv_golf_live_ops TO service_role;
