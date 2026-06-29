CREATE TABLE IF NOT EXISTS public.public_graphics_program_state (
  event_id text PRIMARY KEY,
  active_asset_id uuid,
  speaker_name text,
  speaker_role text,
  theme_style text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

WITH ranked_live_graphics AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY event_id ORDER BY updated_at DESC, id DESC) AS live_rank
  FROM public.owner_lower_thirds
  WHERE is_active_on_stream = true
)
UPDATE public.owner_lower_thirds AS asset
SET is_active_on_stream = false,
    updated_at = timezone('utc', now())
FROM ranked_live_graphics AS ranked
WHERE asset.id = ranked.id
  AND ranked.live_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS owner_lower_thirds_one_live_asset_per_event_idx
  ON public.owner_lower_thirds (event_id)
  WHERE is_active_on_stream = true;

ALTER TABLE public.public_graphics_program_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_graphics_program_state FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.public_graphics_program_state FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_graphics_program_state TO anon, authenticated;
GRANT ALL ON public.public_graphics_program_state TO service_role;

DROP POLICY IF EXISTS "Public can observe sanitized program graphics state"
  ON public.public_graphics_program_state;
CREATE POLICY "Public can observe sanitized program graphics state"
  ON public.public_graphics_program_state FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_graphics_program_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_event_id text;
  active_row public.owner_lower_thirds%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_event_id := OLD.event_id;
  ELSE
    target_event_id := NEW.event_id;
  END IF;

  SELECT * INTO active_row
  FROM public.owner_lower_thirds
  WHERE event_id = target_event_id
    AND is_active_on_stream = true
  ORDER BY updated_at DESC
  LIMIT 1;

  INSERT INTO public.public_graphics_program_state (
    event_id,
    active_asset_id,
    speaker_name,
    speaker_role,
    theme_style,
    updated_at
  )
  VALUES (
    target_event_id,
    active_row.id,
    active_row.speaker_name,
    active_row.speaker_role,
    active_row.theme_style,
    timezone('utc', now())
  )
  ON CONFLICT (event_id) DO UPDATE SET
    active_asset_id = EXCLUDED.active_asset_id,
    speaker_name = EXCLUDED.speaker_name,
    speaker_role = EXCLUDED.speaker_role,
    theme_style = EXCLUDED.theme_style,
    updated_at = EXCLUDED.updated_at;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS owner_lower_thirds_sync_public_program_state
  ON public.owner_lower_thirds;
CREATE TRIGGER owner_lower_thirds_sync_public_program_state
AFTER INSERT OR UPDATE OR DELETE ON public.owner_lower_thirds
FOR EACH ROW EXECUTE FUNCTION public.sync_public_graphics_program_state();

INSERT INTO public.public_graphics_program_state (
  event_id,
  active_asset_id,
  speaker_name,
  speaker_role,
  theme_style
)
SELECT
  '300-awakening',
  active.id,
  active.speaker_name,
  active.speaker_role,
  active.theme_style
FROM (SELECT 1) seed
LEFT JOIN LATERAL (
  SELECT id, speaker_name, speaker_role, theme_style
  FROM public.owner_lower_thirds
  WHERE event_id = '300-awakening' AND is_active_on_stream = true
  ORDER BY updated_at DESC
  LIMIT 1
) active ON true
ON CONFLICT (event_id) DO NOTHING;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.public_graphics_program_state;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
