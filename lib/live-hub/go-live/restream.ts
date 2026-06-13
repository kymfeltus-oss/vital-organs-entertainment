const RESTREAM_API_BASE = "https://api.restream.io";
const RESTREAM_FETCH_TIMEOUT_MS = 4_000;

type RestreamApiChannel = {
  id: number;
  displayName?: string;
  active?: boolean;
};

function parsePrimaryChannelIds(): number[] {
  const raw = process.env.RESTREAM_PRIMARY_CHANNEL_IDS?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

async function fetchRestreamChannelIds(token: string): Promise<number[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESTREAM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${RESTREAM_API_BASE}/v2/user/channel/all`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Restream channels API returned ${response.status}.`);
    }

    const payload = (await response.json()) as RestreamApiChannel[];
    if (!Array.isArray(payload)) return [];

    return payload.map((channel) => channel.id).filter((id) => Number.isFinite(id));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function patchRestreamChannelActive(
  token: string,
  channelId: number,
  active: boolean,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RESTREAM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${RESTREAM_API_BASE}/v2/user/channel/${channelId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Restream channel ${channelId} update failed (${response.status}).`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export type RestreamGoLiveResult =
  | { ok: true; activatedChannelIds: number[] }
  | { ok: false; error: string; code: string };

/**
 * Step 1 — ensure primary Restream destination lanes are active before encoder start.
 */
export async function activateRestreamChannelsForGoLive(): Promise<RestreamGoLiveResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();
  if (!token) {
    return { ok: true, activatedChannelIds: [] };
  }

  try {
    const configuredIds = parsePrimaryChannelIds();
    const channelIds =
      configuredIds.length > 0 ? configuredIds : await fetchRestreamChannelIds(token);

    if (channelIds.length === 0) {
      return {
        ok: false,
        error: "No Restream channels found to activate.",
        code: "RESTREAM_NO_CHANNELS",
      };
    }

    for (const channelId of channelIds) {
      await patchRestreamChannelActive(token, channelId, true);
    }

    return { ok: true, activatedChannelIds: channelIds };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Restream channel activation failed.",
      code: "RESTREAM_ACTIVATE_FAILED",
    };
  }
}

export type RestreamDeactivateResult =
  | { ok: true }
  | { ok: false; error: string; code: string };

/**
 * Roll back Restream channels activated during go-live when a later step fails.
 */
export async function deactivateRestreamChannels(
  channelIds: number[],
): Promise<RestreamDeactivateResult> {
  const token = process.env.RESTREAM_API_TOKEN?.trim();
  if (!token || channelIds.length === 0) {
    return { ok: true };
  }

  try {
    for (const channelId of channelIds) {
      await patchRestreamChannelActive(token, channelId, false);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Restream channel deactivation failed.",
      code: "RESTREAM_DEACTIVATE_FAILED",
    };
  }
}
