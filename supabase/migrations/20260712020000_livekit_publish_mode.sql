-- Allow LiveKit in-app broadcast publish mode on live_stream_state singleton.
ALTER TABLE public.live_stream_state
  DROP CONSTRAINT IF EXISTS live_stream_state_publish_mode_check;

ALTER TABLE public.live_stream_state
  ADD CONSTRAINT live_stream_state_publish_mode_check
  CHECK (publish_mode IN ('none', 'external_hls', 'rtmp_encoder', 'browser_camera', 'livekit_hls'));

COMMENT ON COLUMN public.live_stream_state.publish_mode IS
  'Publish lane: external_hls, rtmp_encoder, browser_camera, or livekit_hls (in-app WebRTC → egress HLS).';
