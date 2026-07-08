-- Align live Supabase tenant_themes with onboarding + theme resolver expectations.

alter table public.tenant_themes
  add column if not exists theme jsonb not null default '{}'::jsonb;

alter table public.tenant_themes
  add column if not exists app_name text;

alter table public.tenant_themes
  add column if not exists tagline text;

alter table public.tenant_themes
  add column if not exists logo_url text;

alter table public.tenant_themes
  add column if not exists primary_color text not null default '#FFB800';

alter table public.tenant_themes
  add column if not exists colors jsonb not null default '{}'::jsonb;

alter table public.tenant_themes
  add column if not exists contact jsonb not null default '{}'::jsonb;

alter table public.tenant_themes
  add column if not exists social_links jsonb not null default '[]'::jsonb;

alter table public.tenant_themes
  add column if not exists fonts jsonb not null default '{}'::jsonb;

alter table public.tenant_themes
  add column if not exists layout jsonb not null default '{}'::jsonb;

alter table public.tenant_themes
  add column if not exists features jsonb not null default '{}'::jsonb;

update public.tenant_themes
set app_name = company_name
where app_name is null
  and company_name is not null;

notify pgrst, 'reload schema';
