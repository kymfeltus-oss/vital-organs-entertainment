-- Supabase linter hardening: these public-schema operational tables are
-- PostgREST-exposed, so keep them server-managed through service_role only.

ALTER TABLE public.tenant_equipment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_equipment_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.stream_output_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_output_presets FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.tenant_equipment_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.stream_output_presets FROM PUBLIC, anon, authenticated;

GRANT ALL ON public.tenant_equipment_profiles TO service_role;
GRANT ALL ON public.stream_output_presets TO service_role;

NOTIFY pgrst, 'reload schema';
