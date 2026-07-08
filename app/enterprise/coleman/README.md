# Coleman // Tuner

Live pitch detection and Shazam-style song overview for worship musicians.

## Architecture

```
[ Microphone Input ]
        │
        ▼
[ Front-End (Flutter / Web) ] ──(Audio Samples)──► [ Pitch Detection (AudioKit / FFT) ]
        │                                                    │
        │                                                    ▼
        │                                          Displays live note + tuning meter
        │
        ▼ (Shazam button)
[ Node.js API ] ──► ShazamKit / ACRCloud
        │
        ├──► Spotify API (original key, BPM)
        └──► Hooktheory / custom DB (Nashville numbers)
        │
        ▼
[ Bottom drawer ] ──► Song overview for musicians
```

## Project layout

| Path | Purpose |
|------|---------|
| `flutter/` | Native Flutter app (primary mobile target) |
| `backend/` | Standalone Express API on port **4780** |
| `lib/` | Shared recognition pipeline (Shazam → Spotify → Nashville) |
| `shared/types.ts` | Shared TypeScript types |
| `../coleman/` (Next.js) | Web dashboard at `/enterprise/coleman` |
| `../../api/coleman/recognize/` | Next.js API route (same pipeline as backend) |

## Run (Web — immediate)

From the monorepo root:

```bash
npm run dev
```

Open [http://localhost:3000/enterprise/coleman](http://localhost:3000/enterprise/coleman)

## Run (Standalone API)

```bash
cd app/enterprise/coleman/backend
npm install
npm run dev
```

Health: `GET http://localhost:4780/health`
Recognize: `POST http://localhost:4780/api/recognize`

## Run (Flutter)

Requires [Flutter SDK](https://docs.flutter.dev/get-started/install).

```bash
cd app/enterprise/coleman/flutter
flutter pub get
flutter run
```

Point the Flutter app at the standalone API (`ShazamService.baseUrl`) or use the Next.js route via your deployed host.

## Environment variables

| Variable | Service |
|----------|---------|
| `SHAZAM_API_KEY` | ShazamKit / partner API |
| `ACRCLOUD_HOST`, `ACRCLOUD_ACCESS_KEY`, `ACRCLOUD_ACCESS_SECRET` | ACRCloud fingerprinting |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Spotify audio features |
| `HOOKTHEORY_API_KEY` | Chord / Nashville enrichment |
| `COLEMAN_API_PORT` | Standalone API port (default `4780`) |

Without credentials, the pipeline returns demo data for **Break Every Chain** (Tasha Cobbs Leonard).

## Next steps

1. Wire `PitchDetectionService` to native FFT (AudioKit on iOS, Oboe/JNA on Android).
2. Replace mock Shazam/Spotify/Hooktheory stubs with live API calls.
3. Persist chord history breadcrumbs from detected progressions.
