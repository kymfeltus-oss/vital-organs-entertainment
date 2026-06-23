export type HlsPreviewTestResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Client-only HLS manifest reachability check.
 * Does not call application APIs and cannot mutate live_stream_state.
 */
export async function testHlsPreviewUrlClientOnly(
  hlsUrl: string,
): Promise<HlsPreviewTestResult> {
  const trimmed = hlsUrl.trim();
  if (!trimmed) {
    return { ok: false, message: "Add an HLS preview URL before testing." };
  }

  try {
    const response = await fetch(trimmed, {
      method: "GET",
      cache: "no-store",
      mode: "cors",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `HLS manifest unreachable (${response.status}).`,
      };
    }

    return {
      ok: true,
      message: "HLS preview manifest reachable — player should connect.",
    };
  } catch {
    return {
      ok: false,
      message:
        "HLS test failed — CORS may block direct fetch; save and verify in the camera card player.",
    };
  }
}
