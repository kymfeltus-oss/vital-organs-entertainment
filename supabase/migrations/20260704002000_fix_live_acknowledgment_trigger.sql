-- Repair production drift: live_acknowledgments has no user_id/email columns.
-- Order fulfillment must not roll back when the acknowledgment trigger fires.

CREATE OR REPLACE FUNCTION public.enqueue_live_acknowledgment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_message text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') = 'paid' THEN
    RETURN NEW;
  END IF;

  v_display_name := split_part(lower(trim(NEW.email)), '@', 1);

  IF char_length(v_display_name) = 0 THEN
    v_display_name := 'Fan';
  ELSIF char_length(v_display_name) > 18 THEN
    v_display_name := left(v_display_name, 15) || '...';
  END IF;

  v_message := v_display_name || ' joined the Awakening Harvest';

  INSERT INTO public.live_acknowledgments (
    order_id,
    display_name,
    product_type,
    amount_total,
    message
  )
  VALUES (
    NEW.id,
    v_display_name,
    NEW.product_type,
    NEW.amount_total,
    v_message
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_live_acknowledgment ON public.orders;

CREATE TRIGGER trg_orders_live_acknowledgment
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_live_acknowledgment();

REVOKE EXECUTE ON FUNCTION public.enqueue_live_acknowledgment()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_live_acknowledgment() TO service_role;
