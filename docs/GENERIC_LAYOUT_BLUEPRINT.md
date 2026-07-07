# Generic White-Label Layout Blueprint

## Architecture overview

```
app/layout.tsx
  └── ThemeProvider          ← injects CSS variables from DEFAULT_TENANT_THEME
        └── RootLayoutShell  ← flex column shell + optional bottom nav
              └── page routes

lib/theme/
  ├── types.ts               ← TenantTheme contract
  ├── default-theme.ts       ← neutral slate/blue defaults
  └── apply-theme-vars.ts    ← maps theme → --theme-* CSS vars

components/layout/
  ├── BrandLogo.tsx          ← theme.logoUrl slot + Building2 fallback
  ├── AppHeader.tsx          ← logo/title/actions row
  ├── PageContainer.tsx      ← flexible max-width padding wrapper
  ├── HeroBanner.tsx         ← hero image slot + placeholder
  ├── ActionCard.tsx         ← icon + label dashboard tiles
  └── GenericTabShell.tsx    ← tab pages (music, giving, etc.)
```

## What was replaced

| Old pattern | New pattern |
|-------------|-------------|
| PNG artboard backgrounds + `%20` URLs | CSS gradient `--theme-app-gradient` |
| Dimension-locked overlay slots | Flex/grid with rem-based spacing |
| Hardcoded "300 Awakening" logos | `BrandLogo` + `theme.appName` |
| Video backdrop on dashboard | Static hero card with optional `heroImageUrl` |
| Custom neon bottom dock CSS | `generic-bottom-nav` using theme vars |

## Dynamic asset slots

| Slot | Config path | Fallback |
|------|-------------|----------|
| Logo | `theme.logoUrl` | `Building2` icon |
| App name | `theme.appName` | "Event Platform" |
| Tagline | `theme.tagline` | Generic subtitle |
| Hero | `theme.heroImageUrl` | `ImageIcon` placeholder |
| Favicon | `theme.faviconUrl` | (metadata TBD via API) |

## Feature toggles

`theme.features.*` gates nav items and dashboard cards:
- `showMusic`, `showGiving`, `showBuySeeds`, `showPrayer`, `showStory`, `showLive`

## Surfaces migrated in this pass

- ✅ Attendee dashboard (`GenericDashboardView`)
- ✅ Bottom navigation (theme-driven)
- ✅ Root shell
- ✅ Login page header (`BrandLogo`)
- ✅ Music tab page (`GenericTabShell`)

## Still on legacy artboard (next pass)

- Giving, Buy Seeds, Prayer, Program, Intro video, Holding room
- Owner/production cockpit (intentionally unchanged)

## Changing the look later

Edit `lib/theme/default-theme.ts` or load theme from `GET /api/tenant/config` into `ThemeProvider theme={...}` — no component code changes required.
