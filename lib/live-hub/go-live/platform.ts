import {
  executeStreamToggle,
  type StreamToggleInput,
} from "@/lib/ops/execute-stream-toggle";

export type PlatformLiveResult =
  | { ok: true }
  | { ok: false; error: string; code: string };

async function postStreamToggle(body: StreamToggleInput): Promise<PlatformLiveResult> {
  if (!process.env.ADMIN_SECRET_KEY?.trim()) {
    return {
      ok: false,
      error: "Stream controls are not configured.",
      code: "PLATFORM_NOT_CONFIGURED",
    };
  }

  const result = await executeStreamToggle(body);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: "PLATFORM_TOGGLE_FAILED",
    };
  }

  return { ok: true };
}

/** Step 3 — open the attendee platform on the primary HLS lane. */
export async function openPlatformLive(): Promise<PlatformLiveResult> {
  return postStreamToggle({ isLive: true, activeSource: "primary" });
}

/** Stop sequence — close attendee access and reset stream flag. */
export async function closePlatformLive(): Promise<PlatformLiveResult> {
  return postStreamToggle({ isLive: false });
}
