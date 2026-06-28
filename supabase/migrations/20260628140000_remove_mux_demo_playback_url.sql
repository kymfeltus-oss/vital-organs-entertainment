-- Remove legacy Mux demo HLS from the live session singleton.

UPDATE public.live_stream_state
SET playback_url = 'https://unconfigured.local/awaiting-live-manifest.m3u8'
WHERE playback_url LIKE '%test-streams.mux.dev%';

COMMENT ON COLUMN public.live_stream_state.playback_url IS
  'Public HLS manifest URL (.m3u8) for the active concert feed — never a demo/test stream.';
