export type LivLiveKitEgressReadiness = {
  ready: boolean;
  blockers: string[];
};

function looksLikeAwsAccessKeyId(value: string): boolean {
  return /^AKIA[0-9A-Z]{16}$/.test(value);
}

/** Non-throwing preflight for LiveKit HLS egress (Open to Fans). */
export function getLivLiveKitEgressReadiness(): LivLiveKitEgressReadiness {
  const blockers: string[] = [];

  if (!process.env.LIVEKIT_URL?.trim()) {
    blockers.push("LIVEKIT_URL is not set.");
  }
  if (!process.env.LIVEKIT_API_KEY?.trim()) {
    blockers.push("LIVEKIT_API_KEY is not set.");
  }
  if (!process.env.LIVEKIT_API_SECRET?.trim()) {
    blockers.push("LIVEKIT_API_SECRET is not set.");
  }

  const bucket = process.env.LIV_GOLF_BROADCAST_BUCKET?.trim();
  if (!bucket) {
    blockers.push(
      "LIV_GOLF_BROADCAST_BUCKET is not set — create an S3 bucket for HLS segments and add its name to .env.local and Vercel.",
    );
  }

  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID?.trim() ?? "";
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() ?? "";
  if (!awsAccessKey || !awsSecretKey) {
    blockers.push("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for LiveKit S3 egress.");
  } else if (!looksLikeAwsAccessKeyId(awsAccessKey)) {
    blockers.push(
      "AWS_ACCESS_KEY_ID does not look valid (expected AKIA… format). Confirm the access key and secret are not swapped.",
    );
  }

  if (!process.env.AWS_REGION?.trim() && !process.env.AWS_DEFAULT_REGION?.trim()) {
    blockers.push("AWS_REGION is not set (e.g. us-east-1).");
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
}
