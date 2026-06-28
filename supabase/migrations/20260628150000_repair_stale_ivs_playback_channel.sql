-- Replace retired Amazon IVS channel KLoL2ogCRZRV with vitalorgansent channel jj20qLRLUTLp.
-- Run in Supabase SQL Editor if attendees still hit 404 on the old channel path.

UPDATE public.live_stream_state
SET
  playback_url = REPLACE(playback_url, 'KLoL2ogCRZRV', 'jj20qLRLUTLp'),
  primary_playback_url = REPLACE(primary_playback_url, 'KLoL2ogCRZRV', 'jj20qLRLUTLp'),
  backup_playback_url = REPLACE(backup_playback_url, 'KLoL2ogCRZRV', 'jj20qLRLUTLp')
WHERE
  playback_url LIKE '%KLoL2ogCRZRV%'
  OR primary_playback_url LIKE '%KLoL2ogCRZRV%'
  OR backup_playback_url LIKE '%KLoL2ogCRZRV%';

-- Optional: set full playback URLs when columns are empty or still invalid after replace.
UPDATE public.live_stream_state
SET
  primary_playback_url = COALESCE(
    NULLIF(trim(primary_playback_url), ''),
    'https://6c41d71a4403.us-east-1.playback.live-video.net/api/video/v1/us-east-1.484908301695.channel.jj20qLRLUTLp.m3u8'
  ),
  backup_playback_url = COALESCE(
    NULLIF(trim(backup_playback_url), ''),
    'https://6c41d71a4403.us-east-1.playback.live-video.net/api/video/v1/us-east-1.484908301695.channel.jj20qLRLUTLp.m3u8'
  ),
  playback_url = COALESCE(
    NULLIF(trim(playback_url), ''),
    'https://6c41d71a4403.us-east-1.playback.live-video.net/api/video/v1/us-east-1.484908301695.channel.jj20qLRLUTLp.m3u8'
  )
WHERE id = 'current_event';
