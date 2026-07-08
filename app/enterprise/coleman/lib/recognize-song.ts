import type { RecognizeRequest, SongOverview } from "../shared/types";
import { enrichWithNashville } from "./nashville";
import { queryShazamOrAcrCloud } from "./shazam";
import { fetchSpotifyMetadata } from "./spotify";

export async function recognizeSong(
  request: RecognizeRequest = {},
): Promise<SongOverview> {
  const match = await queryShazamOrAcrCloud(request);
  const spotify = await fetchSpotifyMetadata(match.title, match.artist);
  const nashville = await enrichWithNashville(match.title, match.artist);

  return {
    title: match.title,
    artist: match.artist,
    originalKey: spotify.originalKey,
    tempoBpm: spotify.tempoBpm,
    churchMovement: nashville.churchMovement,
    nashvilleNumbers: nashville.numbers,
    progressionLabel: nashville.progressionLabel,
    source: match.source,
  };
}
