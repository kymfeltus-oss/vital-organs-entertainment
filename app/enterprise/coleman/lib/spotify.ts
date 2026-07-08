export type SpotifyMetadata = {
  originalKey: string;
  tempoBpm: number;
};

export async function fetchSpotifyMetadata(
  title: string,
  artist: string,
): Promise<SpotifyMetadata> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify metadata requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.",
    );
  }

  void title;
  void artist;

  throw new Error(
    "Spotify audio-features lookup is not yet configured for this deployment.",
  );
}
