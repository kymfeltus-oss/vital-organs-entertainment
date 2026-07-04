# Sound Control Module

The dedicated `/owner/sound` route and the compact owner-cockpit Sound module are control and telemetry surfaces. They never carry raw audio and are not part of the attendee playback path.

## Runtime Boundary

- X32 and vMix remain authoritative for audio processing and stream output.
- `AUDIO_SERVICE_URL` points to the production edge service that can reach the X32.
- `AUDIO_SERVICE_TOKEN` stays server-only. The browser calls `/api/owner/audio/mix-state` with the existing owner session.
- Loss of Vercel, the cockpit, or the audio API does not alter the active X32 scene.

## Operator Controls

- Preset recall and bus mute/unmute actions require an explicit second confirmation.
- The browser can address only the five allow-listed console buses exposed by the server contract.
- The owner API validates every command and keeps `AUDIO_SERVICE_TOKEN` server-only.
- The edge worker refuses console mutations while the X32 is offline and writes mute state through the X32 `/mix/on` OSC control.

## Preset Recall

Preset buttons are visible but locked until their X32 scene mappings are configured:

```env
AUDIO_PRESET_FULL_CHOIR_SCENE=
AUDIO_PRESET_SPOKEN_WORD_SCENE=
AUDIO_PRESET_ACOUSTIC_PRAYER_SCENE=
```

Each value must be an integer from 1 through 100. The owner API accepts only the three named preset IDs, resolves the scene server-side, and requires a second confirmation in the cockpit. The edge service rejects recall while the X32 is offline.

## Telemetry

The cockpit displays the existing bus levels, worker health, current scene, stream limiter state, and loudness summary. The present edge implementation derives LUFS and peak estimates from available level data, so the UI labels those values as estimates. They must not be treated as calibrated compliance measurements until the edge worker receives a real loudness/true-peak meter source.
