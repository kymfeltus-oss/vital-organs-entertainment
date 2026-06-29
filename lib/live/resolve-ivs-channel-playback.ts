import { GetChannelCommand, GetStreamCommand, IvsClient } from "@aws-sdk/client-ivs";
import { parseIvsChannelArn } from "@/lib/live/ivs-playback-url";
import { sanitizeAttendeePlaybackUrl } from "@/lib/live/playback-url-validation";

export type IvsPlaybackResolution = {
  playbackUrl: string | null;
  channelArn: string | null;
  region: string | null;
  streamState: "live" | "offline" | "unknown";
  source: "aws_ivs_get_channel" | "unconfigured" | "error";
  error: string | null;
};

function resolveIvsRegion(channelArn: string | null): string {
  const arnRegion = parseIvsChannelArn(channelArn)?.region;
  return process.env.AWS_REGION?.trim() || process.env.AWS_IVS_REGION?.trim() || arnRegion || "us-east-1";
}

function hasAwsCredentials(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim());
}

function buildIvsClient(region: string): IvsClient {
  if (hasAwsCredentials()) {
    return new IvsClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() ?? "",
      },
    });
  }

  return new IvsClient({ region });
}

function isIvsOfflineError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChannelNotBroadcasting" ||
    error.name === "ChannelNotBroadcastingException" ||
    error.name === "ResourceNotFoundException" ||
    /not broadcasting|not live|stream.*not found|resource.*not found/i.test(error.message)
  );
}

export async function resolveIvsChannelPlaybackUrl(
  channelArn = process.env.AWS_IVS_CHANNEL_ARN?.trim() || null,
): Promise<IvsPlaybackResolution> {
  if (!channelArn) {
    return {
      playbackUrl: null,
      channelArn: null,
      region: null,
      streamState: "unknown",
      source: "unconfigured",
      error: "AWS_IVS_CHANNEL_ARN is not configured.",
    };
  }

  const region = resolveIvsRegion(channelArn);

  try {
    const client = buildIvsClient(region);
    const [channelResult, streamResult] = await Promise.allSettled([
      client.send(new GetChannelCommand({ arn: channelArn })),
      client.send(new GetStreamCommand({ channelArn })),
    ]);

    if (streamResult.status === "rejected") {
      if (isIvsOfflineError(streamResult.reason)) {
        return {
          playbackUrl: null,
          channelArn,
          region,
          streamState: "offline",
          source: "aws_ivs_get_channel",
          error: "Amazon IVS channel is not currently live. Start broadcasting to IVS before requesting playback.",
        };
      }

      return {
        playbackUrl: null,
        channelArn,
        region,
        streamState: "unknown",
        source: "error",
        error:
          streamResult.reason instanceof Error
            ? streamResult.reason.message
            : "Unable to verify Amazon IVS stream status.",
      };
    }

    if (channelResult.status === "rejected") {
      return {
        playbackUrl: null,
        channelArn,
        region,
        streamState: "live",
        source: "error",
        error:
          channelResult.reason instanceof Error
            ? channelResult.reason.message
            : "Unable to fetch Amazon IVS channel playback URL.",
      };
    }

    const playbackUrl = sanitizeAttendeePlaybackUrl(
      channelResult.value.channel?.playbackUrl ?? null,
      "aws_ivs.get_channel.playback_url",
    );

    if (!playbackUrl) {
      return {
        playbackUrl: null,
        channelArn,
        region,
        streamState: "live",
        source: "error",
        error: "AWS IVS returned no valid playback URL for the configured channel.",
      };
    }

    return {
      playbackUrl,
      channelArn,
      region,
      streamState: "live",
      source: "aws_ivs_get_channel",
      error: null,
    };
  } catch (error) {
    return {
      playbackUrl: null,
      channelArn,
      region,
      streamState: "unknown",
      source: "error",
      error: error instanceof Error ? error.message : "Failed to fetch AWS IVS channel playback URL.",
    };
  }
}
