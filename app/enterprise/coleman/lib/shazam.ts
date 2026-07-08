import type { RecognizeRequest } from "../shared/types";

export type ShazamMatch = {
  title: string;
  artist: string;
  source: "shazam" | "acrcloud";
};

export async function queryShazamOrAcrCloud(
  request: RecognizeRequest,
): Promise<ShazamMatch> {
  const shazamKey = process.env.SHAZAM_API_KEY;
  const acrHost = process.env.ACRCLOUD_HOST;
  const acrKey = process.env.ACRCLOUD_ACCESS_KEY;
  const acrSecret = process.env.ACRCLOUD_ACCESS_SECRET;

  if (shazamKey && request.fingerprint) {
    throw new Error(
      "ShazamKit partner integration is not yet configured for this deployment.",
    );
  }

  if (acrHost && acrKey && acrSecret && request.audioSample) {
    throw new Error(
      "ACRCloud integration is not yet configured for this deployment.",
    );
  }

  throw new Error(
    "Song recognition requires SHAZAM_API_KEY or ACRCLOUD credentials in server environment.",
  );
}
