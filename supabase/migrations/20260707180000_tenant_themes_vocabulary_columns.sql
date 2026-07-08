-- White-label vocabulary columns for per-tenant ministry customization console.

alter table public.tenant_themes
  add column if not exists custom_giving_title text default 'PΛRΛBLE Giving';

alter table public.tenant_themes
  add column if not exists custom_token_title text default 'Faith Seeds';

alter table public.tenant_themes
  add column if not exists secondary_color text default '#7A00FF';

alter table public.tenant_themes
  add column if not exists accent_glow text;

alter table public.tenant_themes
  add column if not exists tagline text default 'Own Your Sanctuary. Own Your Stream. Own Your Ministry.';

update public.tenant_themes
set custom_giving_title = coalesce(
  custom_giving_title,
  theme->>'customGivingTitle',
  theme->>'supportLabel',
  'PΛRΛBLE Giving'
)
where custom_giving_title is null;

update public.tenant_themes
set custom_token_title = coalesce(
  custom_token_title,
  theme->>'customTokenTitle',
  theme->>'tokenShopLabel',
  'Faith Seeds'
)
where custom_token_title is null;

update public.tenant_themes
set secondary_color = coalesce(
  secondary_color,
  colors->>'secondary',
  theme->'colors'->>'secondary',
  '#7A00FF'
)
where secondary_color is null;

notify pgrst, 'reload schema';
