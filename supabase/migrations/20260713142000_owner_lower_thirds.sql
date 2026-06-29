CREATE TABLE IF NOT EXISTS public.owner_lower_thirds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  speaker_name text NOT NULL,
  speaker_role text NOT NULL,
  theme_style text NOT NULL DEFAULT 'CYAN_GLOW',
  display_order integer NOT NULL DEFAULT 0,
  is_active_on_stream boolean NOT NULL DEFAULT false,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_lower_thirds_speaker_name_bounds CHECK (char_length(trim(speaker_name)) BETWEEN 1 AND 120),
  CONSTRAINT owner_lower_thirds_speaker_role_bounds CHECK (char_length(trim(speaker_role)) BETWEEN 1 AND 120),
  CONSTRAINT owner_lower_thirds_display_order_bounds CHECK (display_order BETWEEN 0 AND 999),
  CONSTRAINT owner_lower_thirds_theme_style_check
    CHECK (theme_style IN ('NEON_PURPLE_SLIDE', 'MINIMAL_GLASS_FADE', 'CYAN_GLOW'))
);

CREATE INDEX IF NOT EXISTS owner_lower_thirds_event_order_idx
  ON public.owner_lower_thirds (event_id, display_order, created_at);

ALTER TABLE public.owner_lower_thirds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_lower_thirds FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_lower_thirds FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.owner_lower_thirds TO authenticated;
GRANT ALL ON public.owner_lower_thirds TO service_role;

DROP POLICY IF EXISTS "Authenticated operators can observe owner lower thirds"
  ON public.owner_lower_thirds;
CREATE POLICY "Authenticated operators can observe owner lower thirds"
  ON public.owner_lower_thirds FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_lower_thirds;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

INSERT INTO public.owner_lower_thirds (
  event_id,
  speaker_name,
  speaker_role,
  theme_style,
  display_order,
  is_active_on_stream
)
VALUES (
  '300-awakening',
  'SARAH JENKINS',
  'AUDIO ENGINEER',
  'NEON_PURPLE_SLIDE',
  1,
  false
)
ON CONFLICT DO NOTHING;
