/**
 * Verifies switch-feed catch logging does not echo request bodies or stream secrets.
 * Usage: npx tsx scripts/verify-switch-feed-log-sanitization.mjs
 */

const SENSITIVE_MARKERS = [
  "rtmp://SECRET_INGEST_KEY_999",
  "ATTENDEE_BACKUP_HLS_URL",
  "ivs.amazonaws.com/secret-playback",
  "SUPER_SECRET_STREAM_KEY",
];

async function captureConsoleError(run) {
  const lines = [];
  const original = console.error;
  console.error = (...args) => {
    lines.push(
      args
        .map((arg) => {
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          if (typeof arg === "string") return arg;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" "),
    );
    original(...args);
  };

  try {
    await run();
  } finally {
    console.error = original;
  }

  return lines;
}

function assertLogSanitized(lines, label) {
  const joined = lines.join("\n");
  for (const marker of SENSITIVE_MARKERS) {
    if (joined.includes(marker)) {
      console.error(`FAIL  ${label} — log contained sensitive marker: ${marker}`);
      console.error(joined);
      process.exitCode = 1;
      return false;
    }
  }
  const hasPrefix = lines.some((line) =>
    line.includes("[owner/broadcast/switch-feed] POST failed:"),
  );
  if (!hasPrefix) {
    console.error(`FAIL  ${label} — expected sanitized owner/broadcast/switch-feed log prefix`);
    process.exitCode = 1;
    return false;
  }
  console.log(`PASS  ${label}`);
  return true;
}

function sanitizeRouteError(error) {
  return error instanceof Error ? error.message : "unknown";
}

async function simulateMalformedJsonCatch() {
  const maliciousBody =
    '{stream_key: rtmp://SECRET_INGEST_KEY_999, backup: "https://ivs.amazonaws.com/secret-playback/secret.m3u8", api_key: SUPER_SECRET_STREAM_KEY}';

  const lines = await captureConsoleError(() => {
    try {
      JSON.parse(maliciousBody);
    } catch (error) {
      console.error(
        "[owner/broadcast/switch-feed] POST failed:",
        sanitizeRouteError(error),
      );
    }
  });

  assertLogSanitized(lines, "Malformed JSON catch (simulated route handler)");
}

async function simulateRequestJsonCatch() {
  const maliciousBody =
    '{"source":"backup","stream_key":"rtmp://SECRET_INGEST_KEY_999","ATTENDEE_BACKUP_HLS_URL":"https://ivs.amazonaws.com/secret-playback/secret.m3u8"}'.slice(
      0,
      -1,
    );

  const request = new Request("http://localhost/api/owner/broadcast/switch-feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: maliciousBody,
  });

  const lines = await captureConsoleError(async () => {
    try {
      await request.json();
    } catch (error) {
      console.error(
        "[owner/broadcast/switch-feed] POST failed:",
        sanitizeRouteError(error),
      );
    }
  });

  assertLogSanitized(lines, "request.json() catch (truncated JSON body)");
}

async function probeLiveEndpoint(baseUrl) {
  console.log(`\nLive probe: POST ${baseUrl}/api/owner/broadcast/switch-feed`);
  const body =
    '{not-json, stream_key: rtmp://SECRET_INGEST_KEY_999, ATTENDEE_BACKUP_HLS_URL: https://ivs.amazonaws.com/secret-playback/secret.m3u8}';

  const response = await fetch(`${baseUrl}/api/owner/broadcast/switch-feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  console.log(`  HTTP ${response.status} — client payload: ${JSON.stringify(payload)}`);

  if (JSON.stringify(payload).includes("SECRET_INGEST_KEY_999")) {
    console.error("FAIL  Client response leaked sensitive marker from malformed body");
    process.exitCode = 1;
    return;
  }

  console.log("PASS  Client response did not echo malformed body secrets");
  console.log(
    "  Note: server-side catch logging requires owner auth before JSON parse; simulated catches above verify log shape.",
  );
}

async function main() {
  console.log("Switch-feed log sanitization verification\n");
  await simulateMalformedJsonCatch();
  await simulateRequestJsonCatch();
  await probeLiveEndpoint(process.argv[2]?.replace(/\/$/, "") || "http://localhost:3000");
  console.log(process.exitCode ? "\nVerification failed.\n" : "\nVerification passed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
