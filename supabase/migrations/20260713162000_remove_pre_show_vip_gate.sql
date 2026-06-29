ALTER TABLE IF EXISTS public.live_stream_state
  DROP COLUMN IF EXISTS pre_show_vip_only;

COMMENT ON TABLE public.live_stream_state IS
  'Live stream state for public attendee broadcast access. VIP pre-show gating is intentionally disabled.';
