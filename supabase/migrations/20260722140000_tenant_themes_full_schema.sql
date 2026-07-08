-- Ensure tenant_themes exists with full onboarding columns (safe for drifted production DBs).

create table if not exists public.tenant_themes (
  tenant_id text primary key,
  company_name text,
  owner_email text,
  owner_user_id uuid references auth.users (id) on delete set null,
  app_name text,
  tagline text,
  logo_url text,
  logo_url_dark text,
  favicon_url text,
  hero_image_url text,
  primary_color text default '#FFB800',
  colors jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  fonts jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  tier text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_themes add column if not exists company_name text;
alter table public.tenant_themes add column if not exists owner_email text;
alter table public.tenant_themes add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
alter table public.tenant_themes add column if not exists app_name text;
alter table public.tenant_themes add column if not exists tagline text;
alter table public.tenant_themes add column if not exists logo_url text;
alter table public.tenant_themes add column if not exists logo_url_dark text;
alter table public.tenant_themes add column if not exists favicon_url text;
alter table public.tenant_themes add column if not exists hero_image_url text;
alter table public.tenant_themes add column if not exists primary_color text default '#FFB800';
alter table public.tenant_themes add column if not exists colors jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists contact jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists social_links jsonb not null default '[]'::jsonb;
alter table public.tenant_themes add column if not exists fonts jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists layout jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists features jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists theme jsonb not null default '{}'::jsonb;
alter table public.tenant_themes add column if not exists tier text not null default 'starter';
alter table public.tenant_themes add column if not exists created_at timestamptz not null default now();
alter table public.tenant_themes add column if not exists updated_at timestamptz not null default now();

update public.tenant_themes
set company_name = coalesce(company_name, theme->>'companyName', theme->>'appName', app_name)
where company_name is null;

update public.tenant_themes
set app_name = coalesce(app_name, company_name, theme->>'appName')
where app_name is null;

notify pgrst, 'reload schema';
