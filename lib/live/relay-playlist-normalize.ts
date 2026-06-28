const MASTER_MARKER = "#EXT-X-STREAM-INF";

/** IVS master exposes many ABR rungs; dev relay + hls.js fights when two levels poll in parallel. */
const PREFERRED_IVS_GROUP_IDS = ["480p30", "360p30", "720p60", "160p30"];

export function isMasterHlsPlaylist(body: string): boolean {
  return body.includes(MASTER_MARKER);
}

/**
 * Keep one muxed IVS variant so hls.js does not poll multiple playlist edges (use22/use23).
 * Production CDN playback is unchanged — dev relay only.
 */
export function collapseIvsMasterForDevRelay(body: string): string {
  if (!isMasterHlsPlaylist(body)) return body;

  const lines = body.split("\n");
  let chosenGroupId: string | null = null;

  for (const groupId of PREFERRED_IVS_GROUP_IDS) {
    if (body.includes(`GROUP-ID="${groupId}"`) || body.includes(`VIDEO="${groupId}"`)) {
      chosenGroupId = groupId;
      break;
    }
  }

  if (!chosenGroupId) return body;

  const output: string[] = ["#EXTM3U"];
  let includeNextUrl = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "#EXTM3U") continue;

    if (trimmed.startsWith("#EXT-X-SESSION-DATA")) continue;

    if (trimmed.startsWith("#EXT-X-MEDIA:")) {
      if (trimmed.includes(`GROUP-ID="${chosenGroupId}"`)) {
        output.push(trimmed);
      }
      continue;
    }

    if (trimmed.startsWith("#EXT-X-STREAM-INF:")) {
      includeNextUrl = trimmed.includes(`VIDEO="${chosenGroupId}"`);
      if (includeNextUrl) {
        output.push(trimmed);
      }
      continue;
    }

    if (includeNextUrl && isPlaylistResourceLine(trimmed)) {
      output.push(trimmed);
      includeNextUrl = false;
      break;
    }
  }

  return output.length > 1 ? output.join("\n") : body;
}

function isPlaylistResourceLine(trimmed: string): boolean {
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith("/")) return true;
  return /\.(m3u8|ts|m4s|aac|mp4)(\?|$)/i.test(trimmed);
}
