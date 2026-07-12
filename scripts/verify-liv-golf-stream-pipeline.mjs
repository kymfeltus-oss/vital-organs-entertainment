/**
 * LIV Golf stream pipeline verification — owner go-live APIs + LIV stream-setup surface.
 *
 * Usage:
 *   npx tsx scripts/verify-liv-golf-stream-pipeline.mjs
 *   npx tsx scripts/verify-liv-golf-stream-pipeline.mjs http://localhost:3000
 *
 * Requires .env.local for manifest DB seed checks and a running Next dev server.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const BASE_URL = process.argv[2]?.replace(/\/$/, "") || "http://localhost:3000";
const DEMO_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const LIVE_STATE_ID = "current_event";

function pass(label, detail = "") {
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail) {
  console.error(`  FAIL  ${label}`);
  if (detail) console.error(`        ${detail}`);
  process.exitCode = 1;
}

async function testServerReachable() {
  console.log("\n[1] Next server + LIV surfaces");
  try {
    const setup = await fetch(`${BASE_URL}/api/enterprise/liv-golf/stream-setup`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!setup.ok) {
      fail("stream-setup reachable", `HTTP ${setup.status}`);
      return false;
    }
    pass("GET /api/enterprise/liv-golf/stream-setup", `HTTP ${setup.status}`);
  } catch (error) {
    fail("Next dev server not reachable", `Start with npm run dev — ${error instanceof Error ? error.message : error}`);
    return false;
  }

  try {
    const viewer = await fetch(`${BASE_URL}/enterprise/liv-golf/live`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!viewer.ok) {
      fail("LIV fan viewer page", `HTTP ${viewer.status}`);
    } else {
      pass("GET /enterprise/liv-golf/live", `HTTP ${viewer.status}`);
    }
  } catch (error) {
    fail("LIV fan viewer page", error instanceof Error ? error.message : String(error));
  }

  return true;
}

async function testLivStreamSetupContract() {
  console.log("\n[2] LIV stream-setup response contract + latency");

  const started = performance.now();
  const response = await fetch(`${BASE_URL}/api/enterprise/liv-golf/stream-setup`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const elapsed = Math.round(performance.now() - started);

  if (!response.ok) {
    fail("stream-setup contract", `HTTP ${response.status}`);
    return;
  }

  const payload = await response.json();
  const required = [
    "isLive",
    "publishStatus",
    "playbackStatus",
    "eventPhase",
    "hlsUrl",
    "manifestReachable",
    "manifestProbeDetail",
    "readinessBlockers",
    "goLiveBlockers",
    "ingestWarnings",
    "canAttemptGoLive",
    "canMountPlayer",
    "targetDateTime",
    "scheduleEnded",
    "encoderConfigured",
    "capturedAt",
  ];

  const missing = required.filter((key) => !(key in payload));
  if (missing.length > 0) {
    fail("stream-setup contract", `missing keys: ${missing.join(", ")}`);
    return;
  }

  pass("stream-setup contract", `${required.length} fields present`);

  if (elapsed > 2_500) {
    fail("stream-setup latency", `${elapsed}ms exceeds 2500ms target`);
  } else {
    pass("stream-setup latency", `${elapsed}ms`);
  }

  if (!Array.isArray(payload.readinessBlockers)) {
    fail("readinessBlockers type", "expected array");
  } else {
    pass("readinessBlockers surfaced", `${payload.readinessBlockers.length} blocker(s)`);
  }
}

async function testRateLimiterEngine() {
  console.log("\n[3] Rate limiter engine (owner-go-live bucket)");
  const { consumeRateLimit } = await import("../lib/auth/rate-limit.ts");
  const probeIp = `liv-verify-${Date.now()}`;

  let blockedAt = null;
  for (let attempt = 1; attempt <= 11; attempt += 1) {
    const result = await consumeRateLimit("owner-go-live", probeIp, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!result.allowed && blockedAt === null) {
      blockedAt = attempt;
    }
  }

  if (blockedAt === 11) {
    pass("11th consumeRateLimit call blocked");
  } else {
    fail("rate limiter", `expected block on attempt 11, blockedAt=${blockedAt}`);
  }
}

async function testMasterGoLiveHttpThrottle() {
  console.log("\n[4] HTTP POST /api/owner/master-go-live (rapid fire x12)");

  const body = JSON.stringify({ mode: "external_hls", confirm: true, masterOverride: true });
  const statuses = [];
  let saw429 = false;

  for (let i = 0; i < 12; i += 1) {
    const response = await fetch(`${BASE_URL}/api/owner/master-go-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    statuses.push(response.status);
    if (response.status === 429) {
      saw429 = true;
      const payload = await response.json();
      if (payload.error === "Too many go-live attempts.") {
        pass(`request ${i + 1} returned 429 with expected payload`);
      } else {
        fail("429 payload mismatch", JSON.stringify(payload));
      }
      break;
    }
  }

  if (!saw429) {
    fail("master-go-live throttle", `no 429 in 12 attempts: ${JSON.stringify(statuses)}`);
  }
}

async function seedPrimaryLiveState(admin) {
  const primaryUrl = process.env.ATTENDEE_PLAYBACK_HLS_URL?.trim() || DEMO_HLS;

  const fullPatch = {
    is_live: true,
    active_source: "primary",
    publish_status: "publishing",
    publish_mode: "external_hls",
    playback_status: "playback_pending",
    primary_playback_url: primaryUrl,
    playback_url: primaryUrl,
    attendee_ui_phase: "live",
    updated_at: new Date().toISOString(),
    updated_by: "verify-liv-golf-stream-pipeline",
  };

  const legacyPatch = {
    is_live: true,
    active_source: "primary",
    primary_playback_url: primaryUrl,
    playback_url: primaryUrl,
    updated_at: fullPatch.updated_at,
    updated_by: fullPatch.updated_by,
  };

  const minimalPatch = {
    is_live: true,
    playback_url: primaryUrl,
    updated_at: fullPatch.updated_at,
    updated_by: fullPatch.updated_by,
  };

  for (const patch of [fullPatch, legacyPatch, minimalPatch]) {
    const { error } = await admin.from("live_stream_state").update(patch).eq("id", LIVE_STATE_ID);
    if (!error) return primaryUrl;
    if (!/column .+ does not exist|42703|schema cache/i.test(error.message)) {
      throw new Error(`Failed to seed live_stream_state: ${error.message}`);
    }
  }

  throw new Error("Failed to seed live_stream_state: no compatible column set.");
}

async function restoreOfflineState(admin, previous) {
  if (!previous) return;
  await admin.from("live_stream_state").update(previous).eq("id", LIVE_STATE_ID);
}

async function testManifestPlaybackForLivFan() {
  console.log("\n[5] GET /api/stream/manifest — primary lane playback for LIV fan viewer");

  const { getSupabaseAdmin } = await import("../lib/supabase/server.ts");
  const admin = getSupabaseAdmin();

  const { data: before } = await admin
    .from("live_stream_state")
    .select("*")
    .eq("id", LIVE_STATE_ID)
    .maybeSingle();

  try {
    const primaryUrl = await seedPrimaryLiveState(admin);

    const response = await fetch(`${BASE_URL}/api/stream/manifest?experience=main_stage`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      fail("manifest request", `HTTP ${response.status}`);
      return;
    }

    const payload = await response.json();

    if (!payload.playbackUrl && !payload.success) {
      fail("manifest playbackUrl", JSON.stringify(payload));
      return;
    }

    pass("manifest playback resolved", payload.playbackUrl ?? primaryUrl);

    if (payload.activeSource && payload.activeSource !== "primary" && payload.activeSource !== "backup") {
      fail("manifest activeSource", JSON.stringify(payload.activeSource));
    } else {
      pass("manifest activeSource", String(payload.activeSource ?? "primary"));
    }
  } finally {
    if (before) {
      await restoreOfflineState(admin, {
        ...before,
        updated_at: new Date().toISOString(),
        updated_by: "verify-liv-golf-stream-pipeline-restore",
      });
      console.log("\n    Restored prior live_stream_state row.");
    }
  }
}

async function main() {
  console.log(`LIV Golf stream pipeline verification — ${BASE_URL}`);

  const reachable = await testServerReachable();
  if (!reachable) return;

  await testLivStreamSetupContract();
  await testRateLimiterEngine();
  await testMasterGoLiveHttpThrottle();
  await testManifestPlaybackForLivFan();

  console.log(
    process.exitCode
      ? "\nVerification completed with failures.\n"
      : "\nVerification completed successfully.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
