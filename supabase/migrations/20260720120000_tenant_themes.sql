-- White-label tenant branding registry for business owner onboarding.

create table if not exists public.tenant_themes (
  tenant_id text primary key,
  company_name text not null,
  owner_email text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  app_name text not null,
  tagline text,
  logo_url text,
  logo_url_dark text,
  favicon_url text,
  hero_image_url text,
  primary_color text not null default '#2563eb',
  colors jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '[]'::jsonb,
  fonts jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  tier text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_themes_tenant_id_format
    check (tenant_id ~ '^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$')
);

create index if not exists tenant_themes_owner_user_id_idx
  on public.tenant_themes (owner_user_id);

create index if not exists tenant_themes_owner_email_idx
  on public.tenant_themes (owner_email);

alter table public.tenant_themes enable row level security;

-- Public read for branded tenant surfaces; writes happen via service role API routes only.
drop policy if exists tenant_themes_public_read on public.tenant_themes;
create policy tenant_themes_public_read
  on public.tenant_themes
  for select
  to anon, authenticated
  using (true);

drop policy if exists tenant_themes_onboarding_insert on public.tenant_themes;
create policy tenant_themes_onboarding_insert
  on public.tenant_themes
  for insert
  to anon, authenticated
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-assets',
  'tenant-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists tenant_assets_public_read on storage.objects;
create policy tenant_assets_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'tenant-assets');
