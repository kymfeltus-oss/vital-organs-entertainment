/**
 * Show-day broadcast verification — rate limit + manifest carrier echo.
 * Usage: npx tsx scripts/verify-broadcast-pipeline.mjs [baseUrl]
 * Requires .env.local (Supabase service role) and a running Next dev server for HTTP checks.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

function pass(label) {
  console.log(`  PASS  ${label}`);
}

function fail(label, detail) {
  console.error(`  FAIL  ${label}`);
  if (detail) console.error(`        ${detail}`);
  process.exitCode = 1;
}

async function testRateLimiterEngine() {
  console.log("\n[1] Rate limiter engine (owner-go-live bucket, limit 10 / 60s)");
  const { consumeRateLimit } = await import("../lib/auth/rate-limit.ts");
  const probeIp = `verify-${Date.now()}`;

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
    pass("11th consumeRateLimit call blocked for fresh probe IP");
  } else {
    fail("Expected 11th call to be blocked", `blockedAt=${blockedAt}`);
  }
}

async function testGoLiveHttpThrottle() {
  console.log("\n[2] HTTP POST /api/owner/broadcast/go-live (rapid fire x12)");

  const body = JSON.stringify({ mode: "external_hls", confirm: true });
  const statuses = [];
  let saw429 = false;

  for (let i = 0; i < 12; i += 1) {
    const response = await fetch(`${BASE_URL}/api/owner/broadcast/go-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    statuses.push(response.status);
    if (response.status === 429) {
      saw429 = true;
      const payload = await response.json();
      if (payload.error === "Too many go-live attempts.") {
        pass(`Request ${i + 1} returned 429 with expected error payload`);
      } else {
        fail("429 payload mismatch", JSON.stringify(payload));
      }
      break;
    }
  }

  if (!saw429) {
    fail("No 429 observed in 12 rapid POST attempts", JSON.stringify(statuses));
  }
}

async function seedBackupLaneState(admin) {
  const backupUrl =
    process.env.ATTENDEE_BACKUP_HLS_URL?.trim() || DEMO_HLS;
  const primaryUrl =
    process.env.ATTENDEE_PLAYBACK_HLS_URL?.trim() || DEMO_HLS;

  const fullPatch = {
    is_live: true,
    active_source: "backup",
    publish_status: "publishing",
    publish_mode: "external_hls",
    playback_status: "playback_pending",
    primary_playback_url: primaryUrl,
    backup_playback_url: backupUrl,
    playback_url: backupUrl,
    updated_at: new Date().toISOString(),
    updated_by: "verify-broadcast-pipeline",
  };

  const legacyPatch = {
    is_live: true,
    active_source: "backup",
    primary_playback_url: primaryUrl,
    backup_playback_url: backupUrl,
    playback_url: backupUrl,
    updated_at: fullPatch.updated_at,
    updated_by: fullPatch.updated_by,
  };

  const minimalPatch = {
    is_live: true,
    playback_url: backupUrl,
    updated_at: fullPatch.updated_at,
    updated_by: fullPatch.updated_by,
  };

  for (const patch of [fullPatch, legacyPatch, minimalPatch]) {
    const { error } = await admin
      .from("live_stream_state")
      .update(patch)
      .eq("id", LIVE_STATE_ID);

    if (!error) return;
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

async function testManifestCarrierEcho() {
  console.log("\n[3] GET /api/stream/manifest — backup lane carrier echo");

  const { getSupabaseAdmin } = await import("../lib/supabase/server.ts");
  const admin = getSupabaseAdmin();

  const { data: before } = await admin
    .from("live_stream_state")
    .select("*")
    .eq("id", LIVE_STATE_ID)
    .maybeSingle();

  try {
    await seedBackupLaneState(admin);

    const response = await fetch(
      `${BASE_URL}/api/stream/manifest?experience=main_stage`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      fail("Manifest request failed", `HTTP ${response.status}`);
      return;
    }

    const payload = await response.json();

    if (payload.activeSource !== "backup") {
      fail("activeSource", `expected "backup", got ${JSON.stringify(payload.activeSource)}`);
    } else {
      pass('activeSource === "backup"');
    }

    if (payload.carrier !== "ivs") {
      fail("carrier", `expected "ivs", got ${JSON.stringify(payload.carrier)}`);
    } else {
      pass('carrier === "ivs"');
    }

    if (payload.fallback !== false) {
      fail("fallback", `expected false, got ${JSON.stringify(payload.fallback)}`);
    } else {
      pass("fallback === false");
    }

    console.log("\n    Manifest payload (key fields):");
    console.log(
      JSON.stringify(
        {
          activeSource: payload.activeSource,
          carrier: payload.carrier,
          fallback: payload.fallback,
          success: payload.success,
        },
        null,
        2,
      ),
    );
  } finally {
    if (before) {
      await restoreOfflineState(admin, {
        ...before,
        updated_at: new Date().toISOString(),
        updated_by: "verify-broadcast-pipeline-restore",
      });
      console.log("\n    Restored prior live_stream_state row.");
    }
  }
}

async function main() {
  console.log(`Broadcast pipeline verification — ${BASE_URL}`);

  try {
    const health = await fetch(`${BASE_URL}/api/stream/manifest?experience=main_stage`, {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
    });
    if (!health.ok && health.status !== 404) {
      console.warn(`    Warning: server responded HTTP ${health.status}`);
    }
  } catch (error) {
    fail(
      "Next dev server not reachable",
      `Start with npm run dev — ${error instanceof Error ? error.message : error}`,
    );
    return;
  }

  await testRateLimiterEngine();
  await testGoLiveHttpThrottle();
  await testManifestCarrierEcho();

  console.log(
    process.exitCode ? "\nVerification completed with failures.\n" : "\nVerification completed successfully.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
