# Asset Inventory — Phase 0 (Jul 6, 2026)

## Program intro MP4 — canonical decision

| File | Size | Code reference | Status |
|------|------|----------------|--------|
| `program-intro-mobile.mp4` | 1.16 MB | User-requested header update | **CANONICAL → `program/intro-header.mp4`** |
| `program_intro.mp4` | 12.0 MB | Was wired in `AwakeningProgramClient` | ORPHAN → `_orphans/program/` |
| `program-intro-mobile-v2.mp4` | 1.16 MB (byte-identical to mobile) | None | ORPHAN → `_orphans/program/` |
| `program_introa.mp4` | 2.74 MB | None | ORPHAN → `_orphans/program/` |

## Story video

| File | Code reference | Status |
|------|----------------|--------|
| `awakening/vital-seed-story-preview-9x16.mp4` | `app/story/page.tsx` | **USED** (kept) |
| `awakening/vital-seed-story-preview.mp4` | None | ORPHAN (not moved in Phase 1) |

## Root media — normalized in Phase 1

| Old path | New path | Code registry |
|----------|----------|---------------|
| `intro mobile.mp4` | `media/intro-mobile.mp4` | `lib/experience/intro-assets.ts` |
| `intro-music.m4a` | `media/intro-music.m4a` | `intro-assets.ts`, `LiveEndedThankYou.tsx` |
| `intro-music - Copy.m4a` | — | ORPHAN (not referenced) |

## Folders with spaces — normalized

| Old folder | New folder |
|------------|------------|
| `vital seed/` | `vital-seed/` |
| `holding page/` | `holding-room/` |
| `awakening/300_dashboard_assets/` | `awakening/dashboard/` |

## Files with spaces in names — normalized

| Old | New |
|-----|-----|
| `awakening/dashboard-concert-bg mobile.mp4` | `awakening/dashboard-concert-bg-mobile.mp4` |
| `awakening/dashboard/ian craig story.png` | `awakening/dashboard/ian-craig-story.png` |
| `awakening/dashboard/welcome_header.png` | `awakening/dashboard/welcome-header.png` |
| `awakening/dashboard/vital_seed.png` | `awakening/dashboard/vital-seed.png` |
| `awakening/dashboard/prayer_contact.png` | `awakening/dashboard/prayer-contact.png` |
| `music/background image mobile.png` | `music/background-image-mobile.png` |
| `music/background image.png` | `music/background-image.png` |
| `music/Apple Music Cards.png` | `music/apple-music-cards.png` |
| `music/Apple Music Download Header.png` | `music/apple-music-download-header.png` |
| `program/Facebook_Logo.png` | `program/facebook-logo.png` |
| `program/instagram. png` | `program/instagram.png` |
| `program/prayer_logo.png` | `program/prayer-logo.png` |
| `experience/count down.png` | `experience/countdown.png` |

## `public/300/` draft folder

~50 ChatGPT/Gemini draft images + `optimized_intro-video.mp4` — **no code references**. Left in place for Phase 3 orphan deletion (operator review).

## Dimension-locked surfaces (paths updated, slot math unchanged)

- Auth login/signup panels — `awakening-auth-assets.ts` slot constants
- Buy Seeds overlay — `lib/seeds/assets.ts` slot constants
- Giving form — `giving-mobile-slots.ts` slot constants
- Holding room countdown — `holding-room-countdown-circles.ts` slot constants
- Intro enter CTA — `intro-assets.ts` INTRO_ENTER_PANEL
