-- Add billing tier column for Stripe subscription enforcement on existing deployments.

alter table public.tenant_themes
  add column if not exists tier text not null default 'starter';

alter table public.tenant_themes
  drop constraint if exists tenant_themes_tier_check;

alter table public.tenant_themes
  add constraint tenant_themes_tier_check
  check (tier in ('starter', 'pro', 'enterprise'));
