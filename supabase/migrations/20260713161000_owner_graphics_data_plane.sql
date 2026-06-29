CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.owner_graphics_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  type text NOT NULL CHECK (type IN ('LOWER_THIRD', 'TICKER', 'SLATE', 'SCRIPTURE', 'OFFERING')),
  content_primary text NOT NULL CHECK (length(trim(content_primary)) >= 1),
  content_secondary text DEFAULT '',
  is_active_on_stream boolean NOT NULL DEFAULT false,
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS owner_graphics_presets_event_created_idx
  ON public.owner_graphics_presets (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS owner_graphics_presets_event_active_idx
  ON public.owner_graphics_presets (event_id, is_active_on_stream)
  WHERE is_active_on_stream = true;

CREATE TABLE IF NOT EXISTS public.owner_graphics_global_theme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening' UNIQUE,
  corner_radius_px integer NOT NULL DEFAULT 8 CHECK (corner_radius_px BETWEEN 0 AND 24),
  padding_px integer NOT NULL DEFAULT 24 CHECK (padding_px BETWEEN 4 AND 64),
  background_opacity_percent integer NOT NULL DEFAULT 80 CHECK (background_opacity_percent BETWEEN 0 AND 100),
  placement_anchor text NOT NULL DEFAULT 'BOTTOM_LEFT' CHECK (placement_anchor IN ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER')),
  custom_logo_url text DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_owner_graphics_theme_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS owner_graphics_global_theme_touch_updated_at
  ON public.owner_graphics_global_theme;

CREATE TRIGGER owner_graphics_global_theme_touch_updated_at
BEFORE UPDATE ON public.owner_graphics_global_theme
FOR EACH ROW
EXECUTE FUNCTION public.set_owner_graphics_theme_updated_at();

ALTER TABLE public.owner_graphics_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_graphics_global_theme ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.owner_graphics_presets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.owner_graphics_global_theme FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_graphics_presets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.owner_graphics_global_theme FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.owner_graphics_presets TO anon, authenticated;
GRANT SELECT ON public.owner_graphics_global_theme TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.owner_graphics_presets TO authenticated;
GRANT UPDATE ON public.owner_graphics_global_theme TO authenticated;
GRANT ALL ON public.owner_graphics_presets TO service_role;
GRANT ALL ON public.owner_graphics_global_theme TO service_role;

DROP POLICY IF EXISTS owner_graphics_presets_public_select
  ON public.owner_graphics_presets;
CREATE POLICY owner_graphics_presets_public_select
  ON public.owner_graphics_presets
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS owner_graphics_presets_staff_insert
  ON public.owner_graphics_presets;
CREATE POLICY owner_graphics_presets_staff_insert
  ON public.owner_graphics_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS owner_graphics_presets_staff_update
  ON public.owner_graphics_presets;
CREATE POLICY owner_graphics_presets_staff_update
  ON public.owner_graphics_presets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS owner_graphics_presets_staff_delete
  ON public.owner_graphics_presets;
CREATE POLICY owner_graphics_presets_staff_delete
  ON public.owner_graphics_presets
  FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS owner_graphics_global_theme_public_select
  ON public.owner_graphics_global_theme;
CREATE POLICY owner_graphics_global_theme_public_select
  ON public.owner_graphics_global_theme
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS owner_graphics_global_theme_staff_update
  ON public.owner_graphics_global_theme;
CREATE POLICY owner_graphics_global_theme_staff_update
  ON public.owner_graphics_global_theme
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO public.owner_graphics_global_theme (
  event_id,
  corner_radius_px,
  padding_px,
  background_opacity_percent,
  placement_anchor
)
VALUES ('300-awakening', 8, 24, 80, 'BOTTOM_LEFT')
ON CONFLICT (event_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_graphics_presets;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'owner_graphics_presets already in supabase_realtime publication';
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_graphics_global_theme;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'owner_graphics_global_theme already in supabase_realtime publication';
    END;
  END IF;
END $$;
