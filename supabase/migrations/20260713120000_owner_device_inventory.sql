CREATE TABLE IF NOT EXISTS public.owner_device_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL DEFAULT '300-awakening',
  display_name text NOT NULL,
  device_kind text NOT NULL,
  linked_hub text NOT NULL,
  input_channel integer NOT NULL,
  manufacturer text NOT NULL DEFAULT 'Generic',
  model text NOT NULL DEFAULT 'Standard',
  sovereign_ingest_arn text NOT NULL,
  health_status text NOT NULL DEFAULT 'LINKED',
  pre_show_active boolean NOT NULL DEFAULT false,
  muted boolean NOT NULL DEFAULT false,
  solo boolean NOT NULL DEFAULT false,
  volume integer NOT NULL DEFAULT 75,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT owner_device_inventory_display_name_bounds
    CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  CONSTRAINT owner_device_inventory_device_kind_check
    CHECK (device_kind IN ('MIC', 'CAMERA')),
  CONSTRAINT owner_device_inventory_linked_hub_check
    CHECK (linked_hub IN ('SOUND HUB', 'VIDEO HUB')),
  CONSTRAINT owner_device_inventory_kind_hub_match
    CHECK (
      (device_kind = 'MIC' AND linked_hub = 'SOUND HUB') OR
      (device_kind = 'CAMERA' AND linked_hub = 'VIDEO HUB')
    ),
  CONSTRAINT owner_device_inventory_input_channel_bounds
    CHECK (input_channel BETWEEN 1 AND 64),
  CONSTRAINT owner_device_inventory_health_status_check
    CHECK (health_status IN ('LINKED', 'DISCONNECTED', 'ERROR')),
  CONSTRAINT owner_device_inventory_volume_bounds
    CHECK (volume BETWEEN 0 AND 100),
  CONSTRAINT owner_device_inventory_event_hub_channel_unique
    UNIQUE (event_id, linked_hub, input_channel)
);

CREATE INDEX IF NOT EXISTS owner_device_inventory_event_idx
  ON public.owner_device_inventory (event_id, linked_hub, input_channel);

ALTER TABLE public.owner_device_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_device_inventory FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_device_inventory FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.owner_device_inventory TO authenticated;
GRANT ALL ON public.owner_device_inventory TO service_role;

DROP POLICY IF EXISTS "Authenticated operators can observe device inventory"
  ON public.owner_device_inventory;
CREATE POLICY "Authenticated operators can observe device inventory"
  ON public.owner_device_inventory
  FOR SELECT
  TO authenticated
  USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_device_inventory;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

INSERT INTO public.owner_device_inventory (
  event_id,
  display_name,
  device_kind,
  linked_hub,
  input_channel,
  manufacturer,
  model,
  sovereign_ingest_arn,
  health_status,
  pre_show_active,
  muted,
  solo,
  volume
) VALUES
  (
    '300-awakening',
    'LEAD VOCAL (SHURE BETA 58A)',
    'MIC',
    'SOUND HUB',
    1,
    'Shure',
    'Beta 58A',
    'arn:local:300-awakening:sound-hub:channel/1',
    'LINKED',
    false,
    false,
    false,
    78
  ),
  (
    '300-awakening',
    'DRUM OVERHEAD R (AKG C414)',
    'MIC',
    'SOUND HUB',
    4,
    'AKG',
    'C414',
    'arn:local:300-awakening:sound-hub:channel/4',
    'LINKED',
    false,
    false,
    false,
    72
  ),
  (
    '300-awakening',
    'GUITAR CAB (SHURE SM57)',
    'MIC',
    'SOUND HUB',
    7,
    'Shure',
    'SM57',
    'arn:local:300-awakening:sound-hub:channel/7',
    'LINKED',
    false,
    false,
    false,
    70
  ),
  (
    '300-awakening',
    'STAGE CENTER (SONY FX6)',
    'CAMERA',
    'VIDEO HUB',
    1,
    'Sony',
    'FX6',
    'arn:local:300-awakening:video-hub:camera/1',
    'LINKED',
    true,
    false,
    false,
    100
  ),
  (
    '300-awakening',
    'ROAMING CAM (SONY A7SIII)',
    'CAMERA',
    'VIDEO HUB',
    2,
    'Sony',
    'A7SIII',
    'arn:local:300-awakening:video-hub:camera/2',
    'LINKED',
    true,
    false,
    false,
    100
  ),
  (
    '300-awakening',
    'WEBCAM (LOGITECH BRIO)',
    'CAMERA',
    'VIDEO HUB',
    4,
    'Logitech',
    'Brio',
    'arn:local:300-awakening:video-hub:camera/4',
    'DISCONNECTED',
    false,
    false,
    false,
    100
  )
ON CONFLICT (event_id, linked_hub, input_channel) DO NOTHING;

COMMENT ON TABLE public.owner_device_inventory IS
  'Production owner device inventory for shared Sound Hub and Video Hub routing state.';
