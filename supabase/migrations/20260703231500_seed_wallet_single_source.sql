-- Keep seed purchases, balances, and deductions on one authoritative wallet.

CREATE OR REPLACE FUNCTION public.fulfill_seed_pack_checkout(
  p_stripe_session_id text,
  p_user_id uuid,
  p_email text,
  p_product_id text,
  p_amount_total integer,
  p_seed_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prior_status text;
  v_balance integer := 0;
BEGIN
  IF p_seed_count <= 0 THEN
    RAISE EXCEPTION 'seed count must be positive';
  END IF;

  -- Serialize retries even when a checkout was not staged before Stripe called us.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_session_id, 0));

  SELECT status
  INTO v_prior_status
  FROM public.orders
  WHERE stripe_session_id = p_stripe_session_id;

  IF COALESCE(v_prior_status, '') = 'paid' THEN
    SELECT balance
    INTO v_balance
    FROM public.seed_wallets
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'seeds_credited', 0,
      'seed_balance', COALESCE(v_balance, 0)
    );
  END IF;

  INSERT INTO public.orders (
    stripe_session_id,
    user_id,
    email,
    status,
    amount_total,
    product_type,
    created_at
  )
  VALUES (
    p_stripe_session_id,
    p_user_id,
    lower(trim(p_email)),
    'paid',
    p_amount_total,
    p_product_id,
    timezone('utc'::text, now())
  )
  ON CONFLICT (stripe_session_id)
  DO UPDATE SET
    status = 'paid',
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    amount_total = EXCLUDED.amount_total,
    product_type = EXCLUDED.product_type,
    created_at = timezone('utc'::text, now());

  v_balance := public.credit_seed_wallet(p_user_id, p_seed_count);

  RETURN jsonb_build_object(
    'seeds_credited', p_seed_count,
    'seed_balance', v_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_seed_pack_checkout(
  text, uuid, text, text, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_seed_pack_checkout(
  text, uuid, text, text, integer, integer
) TO service_role;
CREATE OR REPLACE FUNCTION public.deduct_seed_wallet(
  p_user_id uuid,
  p_cost integer,
  p_transaction_type text,
  p_description text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'seed cost must be positive';
  END IF;

  UPDATE public.seed_wallets
  SET
    balance = balance - p_cost,
    updated_at = timezone('utc', now())
  WHERE user_id = p_user_id
    AND balance >= p_cost
  RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient seed balance';
  END IF;

  INSERT INTO public.seed_transactions (
    profile_id,
    amount,
    transaction_type,
    description,
    reference_id
  )
  VALUES (
    p_user_id,
    -p_cost,
    p_transaction_type,
    p_description,
    p_reference_id
  );

  RETURN jsonb_build_object('balance', v_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_seed_wallet(
  uuid, integer, text, text, uuid
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_seed_wallet(
  uuid, integer, text, text, uuid
) TO service_role;
