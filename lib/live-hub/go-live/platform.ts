export type PlatformLiveResult =
  | { ok: true }
  | { ok: false; error: string; code: string };

async function postStreamToggle(body: Record<string, unknown>): Promise<PlatformLiveResult> {
  const adminSecret = process.env.ADMIN_SECRET_KEY?.trim();
  if (!adminSecret) {
    return {
      ok: false,
      error: "Stream controls are not configured.",
      code: "PLATFORM_NOT_CONFIGURED",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  try {
    const response = await fetch(`${appUrl}/api/stream/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Secret-Key": adminSecret,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = (await response.json()) as { success?: boolean; error?: string };

    if (!response.ok || payload.success !== true) {
      return {
        ok: false,
        error: payload.error ?? "Platform stream toggle failed.",
        code: "PLATFORM_TOGGLE_FAILED",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Platform stream toggle unreachable.",
      code: "PLATFORM_UNREACHABLE",
    };
  }
}

/** Step 3 — open the attendee platform on the primary HLS lane. */
export async function openPlatformLive(): Promise<PlatformLiveResult> {
  return postStreamToggle({ isLive: true, activeSource: "primary" });
}

/** Stop sequence — close attendee access and reset stream flag. */
export async function closePlatformLive(): Promise<PlatformLiveResult> {
  return postStreamToggle({ isLive: false });
}
