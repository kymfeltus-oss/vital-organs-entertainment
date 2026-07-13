-- LIV Golf fan bet tickets + atomic resolution payout engine
-- Compatible with the existing production schema.

ALTER TABLE public.fan_bet_tickets
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

UPDATE public.fan_bet_tickets
SET status =
  CASE
    WHEN COALESCE(is_resolved, false) = false THEN 'open'
    WHEN is_winner = true THEN 'paid'
    ELSE 'lost'
  END
WHERE status IS NULL;

ALTER TABLE public.fan_bet_tickets
  ALTER COLUMN status SET DEFAULT 'open',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.fan_bet_tickets
  DROP CONSTRAINT IF EXISTS fan_bet_tickets_status_check;

ALTER TABLE public.fan_bet_tickets
  ADD CONSTRAINT fan_bet_tickets_status_check
  CHECK (status IN ('open', 'won', 'lost', 'paid'));

CREATE UNIQUE INDEX IF NOT EXISTS fan_bet_tickets_room_bet_user_uidx
  ON public.fan_bet_tickets (room_id, bet_id, user_id);

DROP INDEX IF EXISTS public.fan_bet_tickets_open_pool_idx;

CREATE INDEX fan_bet_tickets_open_pool_idx
  ON public.fan_bet_tickets (room_id, bet_id, status)
  WHERE status = 'open';

COMMENT ON TABLE public.fan_bet_tickets IS
  'Per-fan LIV micro-bet tickets locked and settled by resolve_and_payout_micro_bet.';

CREATE TABLE IF NOT EXISTS public.liv_micro_bet_resolution_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  bet_id text NOT NULL,
  winning_option text NOT NULL
    CHECK (winning_option IN ('Yes', 'No')),
  total_tokens_distributed integer NOT NULL DEFAULT 0
    CHECK (total_tokens_distributed >= 0),
  tickets_resolved integer NOT NULL DEFAULT 0
    CHECK (tickets_resolved >= 0),
  resolved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS
  liv_micro_bet_resolution_archive_room_bet_uidx
ON public.liv_micro_bet_resolution_archive (room_id, bet_id);

COMMENT ON TABLE public.liv_micro_bet_resolution_archive IS
  'Permanent ledger archive for resolved LIV in-stream micro-bet pools.';

ALTER TABLE public.fan_bet_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_bet_tickets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.liv_micro_bet_resolution_archive
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.liv_micro_bet_resolution_archive
  FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.fan_bet_tickets
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON public.liv_micro_bet_resolution_archive
FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.fan_bet_tickets TO service_role;
GRANT ALL ON public.liv_micro_bet_resolution_archive TO service_role;

DROP FUNCTION IF EXISTS
  public.resolve_and_payout_micro_bet(text, text, text, uuid);

DROP FUNCTION IF EXISTS
  public.resolve_and_payout_micro_bet(uuid, text, text, uuid);

CREATE FUNCTION public.resolve_and_payout_micro_bet(
  p_room_id uuid,
  p_bet_id text,
  p_winning_option text,
  p_resolved_by uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.fan_bet_tickets%ROWTYPE;
  v_total_paid integer := 0;
  v_tickets_resolved integer := 0;
BEGIN
  IF p_room_id IS NULL THEN
    RAISE EXCEPTION 'room id is required';
  END IF;

  IF p_bet_id IS NULL OR btrim(p_bet_id) = '' THEN
    RAISE EXCEPTION 'bet id is required';
  END IF;

  IF p_winning_option NOT IN ('Yes', 'No') THEN
    RAISE EXCEPTION 'invalid winning option';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.liv_micro_bet_resolution_archive
    WHERE room_id = p_room_id
      AND bet_id = p_bet_id
  ) THEN
    RAISE EXCEPTION 'bet pool already resolved';
  END IF;

  FOR v_ticket IN
    SELECT *
    FROM public.fan_bet_tickets
    WHERE room_id = p_room_id
      AND bet_id = p_bet_id
      AND status = 'open'
    FOR UPDATE
  LOOP
    v_tickets_resolved := v_tickets_resolved + 1;

    IF v_ticket.selection = p_winning_option THEN
      PERFORM public.credit_seed_wallet(
        v_ticket.user_id,
        v_ticket.payout_amount
      );

      INSERT INTO public.seed_transactions (
        profile_id,
        amount,
        transaction_type,
        description,
        reference_id
      )
      VALUES (
        v_ticket.user_id,
        v_ticket.payout_amount,
        'liv_micro_bet_payout',
        format(
          'LIV micro-bet payout: %s -> %s',
          p_bet_id,
          p_winning_option
        ),
        v_ticket.id
      );

      UPDATE public.fan_bet_tickets
      SET
        status = 'paid',
        is_resolved = true,
        is_winner = true,
        resolved_at = timezone('utc', now())
      WHERE id = v_ticket.id;

      v_total_paid := v_total_paid + v_ticket.payout_amount;
    ELSE
      UPDATE public.fan_bet_tickets
      SET
        status = 'lost',
        is_resolved = true,
        is_winner = false,
        resolved_at = timezone('utc', now())
      WHERE id = v_ticket.id;
    END IF;
  END LOOP;

  INSERT INTO public.liv_micro_bet_resolution_archive (
    room_id,
    bet_id,
    winning_option,
    total_tokens_distributed,
    tickets_resolved,
    resolved_by
  )
  VALUES (
    p_room_id,
    p_bet_id,
    p_winning_option,
    v_total_paid,
    v_tickets_resolved,
    p_resolved_by
  );

  RETURN v_total_paid;
END;
$$;

REVOKE ALL ON FUNCTION
  public.resolve_and_payout_micro_bet(uuid, text, text, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.resolve_and_payout_micro_bet(uuid, text, text, uuid)
TO service_role;
