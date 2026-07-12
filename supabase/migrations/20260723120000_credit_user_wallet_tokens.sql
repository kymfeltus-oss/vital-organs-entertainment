-- Direct token recharge: atomic wallet credit + seed ledger entry.

CREATE OR REPLACE FUNCTION public.credit_user_wallet_tokens(
  p_user_id uuid,
  p_token_amount integer,
  p_reference_tag text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF p_token_amount <= 0 THEN
    RAISE EXCEPTION 'token amount must be positive';
  END IF;

  -- Serialize concurrent credits on the same wallet row.
  INSERT INTO public.seed_wallets (user_id, balance, updated_at)
  VALUES (p_user_id, p_token_amount, timezone('utc', now()))
  ON CONFLICT (user_id) DO UPDATE
  SET
    balance = public.seed_wallets.balance + EXCLUDED.balance,
    updated_at = timezone('utc', now())
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.seed_transactions (
    profile_id,
    amount,
    transaction_type,
    description
  )
  VALUES (
    p_user_id,
    p_token_amount,
    'token_purchase_direct',
    p_reference_tag
  );

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_user_wallet_tokens(uuid, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_user_wallet_tokens(uuid, integer, text)
  TO service_role;
