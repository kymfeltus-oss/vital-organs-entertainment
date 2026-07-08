-- Portal terminology columns for white-label events and members naming.

alter table public.tenant_themes
  add column if not exists custom_events_title text default 'Community Gatherings';

alter table public.tenant_themes
  add column if not exists custom_members_title text default 'Family Members';

update public.tenant_themes
set custom_events_title = coalesce(
  custom_events_title,
  theme->>'customEventsTitle',
  theme->>'browseLabel',
  'Community Gatherings'
)
where custom_events_title is null;

update public.tenant_themes
set custom_members_title = coalesce(
  custom_members_title,
  theme->>'customMembersTitle',
  theme->>'homeLabel',
  'Family Members'
)
where custom_members_title is null;

notify pgrst, 'reload schema';
