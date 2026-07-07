-- B2B enterprise and general procurement inquiries from apex /contact-us.

CREATE TABLE IF NOT EXISTS public.platform_inquiries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text        NOT NULL,
  email         text        NOT NULL,
  organization  text        NOT NULL,
  intent_tier   text        NOT NULL DEFAULT 'general',
  message_body  text        NOT NULL,
  status        text        NOT NULL DEFAULT 'pending',
  tenant_id     text,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),

  CONSTRAINT platform_inquiries_full_name_not_blank CHECK (char_length(trim(full_name)) > 0),
  CONSTRAINT platform_inquiries_email_not_blank CHECK (char_length(trim(email)) > 0),
  CONSTRAINT platform_inquiries_organization_not_blank CHECK (char_length(trim(organization)) > 0),
  CONSTRAINT platform_inquiries_message_not_blank CHECK (char_length(trim(message_body)) > 0),
  CONSTRAINT platform_inquiries_status_valid CHECK (status IN ('pending', 'reviewed', 'closed'))
);

CREATE INDEX platform_inquiries_created_at_idx
  ON public.platform_inquiries (created_at DESC);

CREATE INDEX platform_inquiries_intent_tier_idx
  ON public.platform_inquiries (intent_tier);

COMMENT ON TABLE public.platform_inquiries IS
  'Lead capture for apex-domain enterprise and general B2B contact submissions.';

ALTER TABLE public.platform_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_inquiries FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_inquiries FROM PUBLIC;
GRANT INSERT ON public.platform_inquiries TO anon, authenticated;
GRANT ALL ON public.platform_inquiries TO service_role;

CREATE POLICY platform_inquiries_public_insert
  ON public.platform_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(full_name)) > 0
    AND char_length(trim(email)) > 0
    AND char_length(trim(organization)) > 0
    AND char_length(trim(message_body)) > 0
    AND status = 'pending'
  );
