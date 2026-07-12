/**
 * LIV Golf go-live pipeline simulation — mirrors Vital Organs show-day checks
 * for the shared owner broadcast stack used by /enterprise/liv-golf.
 *
 * Run:
 *   node scripts/simulate-liv-golf-go-live.mjs
 *   node scripts/simulate-liv-golf-go-live.mjs http://localhost:3000
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = process.argv[2]?.replace(/\/$/, "") || null;

const LIV_FAN_VIEWER = "/enterprise/liv-golf/live";
const LIV_STREAM_SETUP_PAGE = "/enterprise/liv-golf/streaming/setup";
const RESTREAM_RTMP = "rtmp://live.restream.io/live";

const REQUIRED_OWNER_APIS = [
  "/api/owner/show-setup",
  "/api/owner/broadcast/preflight",
  "/api/owner/master-go-live",
  "/api/owner/broadcast-end",
  "/api/owner/encoder-health",
  "/api/owner/broadcast",
];

const REQUIRED_LIV_APIS = ["/api/enterprise/liv-golf/stream-setup"];

const REQUIRED_FILES = [
  "lib/enterprise/liv-golf/useLivStreamSetup.ts",
  "lib/enterprise/liv-golf/liv-stream-setup-status.ts",
  "app/api/enterprise/liv-golf/stream-setup/route.ts",
  "app/enterprise/liv-golf/streaming/setup/page.tsx",
  "app/enterprise/liv-golf/components/LivStreamSetup.tsx",
  "app/enterprise/liv-golf/live/page.tsx",
  "app/enterprise/liv-golf/components/LIVViewerLayout.tsx",
];

function pass(name, detail = "") {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

function readProjectFile(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

async function checkLivWiring() {
  const results = [];

  for (const relativePath of REQUIRED_FILES) {
    if (!existsSync(path.join(ROOT, relativePath))) {
      results.push(fail(`file:${relativePath}`, "missing"));
      continue;
    }
    results.push(pass(`file:${relativePath}`, "present"));
  }

  const hookSource = readProjectFile("lib/enterprise/liv-golf/useLivStreamSetup.ts");
  const expectedCalls = [
    ["/api/owner/show-setup", "saveEncoder + saveMetadata"],
    ["/api/owner/broadcast/preflight", "runPreflight"],
    ["/api/owner/master-go-live", "goLive"],
    ["/api/owner/broadcast-end", "stopStream"],
    ["/api/owner/broadcast", "loadSnapshot"],
    ["/api/owner/encoder-health", "loadEncoderHealth"],
  ];

  for (const [route, label] of expectedCalls) {
    if (hookSource.includes(route)) {
      results.push(pass(`hook_calls:${label}`, route));
    } else {
      results.push(fail(`hook_calls:${label}`, `expected fetch to ${route}`));
    }
  }

  if (hookSource.includes('mode: "external_hls"')) {
    results.push(pass("hook_mode_external_hls", "Restream-only publish mode"));
  } else {
    results.push(fail("hook_mode_external_hls", 'useLivStreamSetup should use mode: "external_hls"'));
  }

  const statusLib = readProjectFile("lib/enterprise/liv-golf/liv-stream-setup-status.ts");
  if (statusLib.includes("readinessBlockers") && statusLib.includes("LIV_STREAM_SETUP_PROBE_TIMEOUT_MS")) {
    results.push(pass("liv_stream_setup_status", "fast probe + readiness blockers wired"));
  } else {
    results.push(fail("liv_stream_setup_status", "missing readiness diagnostics"));
  }

  return results;
}

async function checkSharedBroadcastModules() {
  const results = [];

  try {
    const hlsReadiness = readProjectFile("lib/owner/hls-readiness.ts");
    assert.match(hlsReadiness, /LIV_STREAM_SETUP_PROBE_TIMEOUT_MS\s*=\s*1_200/);
    assert.match(hlsReadiness, /timeoutMs\?: number/);
    results.push(pass("hls_probe_fast_timeout", "LIV stream-setup probe timeout = 1200ms"));
  } catch (error) {
    results.push(
      fail("hls_probe_fast_timeout", error instanceof Error ? error.message : String(error)),
    );
  }

  try {
    const snapshotBuilder = readProjectFile("lib/owner/build-broadcast-snapshot.ts");
    assert.match(snapshotBuilder, /manifestProbeTimeoutMs\?: number/);
    assert.match(snapshotBuilder, /buildOwnerBroadcastSnapshot/);
    results.push(pass("owner_broadcast_snapshot", "shared snapshot builder supports fast probe option"));
  } catch (error) {
    results.push(
      fail("owner_broadcast_snapshot", error instanceof Error ? error.message : String(error)),
    );
  }

  try {
    const encoderPanel = readProjectFile("components/owner/RestreamEncoderPanel.tsx");
    assert.match(encoderPanel, /restream\.io|RTMP/i);
    results.push(pass("restream_encoder_panel", "shared Restream encoder UI present"));
  } catch (error) {
    results.push(fail("restream_encoder_panel", error instanceof Error ? error.message : String(error)));
  }

  return results;
}

async function checkHttpSurface(baseUrl) {
  const results = [];

  for (const route of [...REQUIRED_OWNER_APIS, ...REQUIRED_LIV_APIS]) {
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        method: route.includes("preflight") || route.includes("go-live") || route.includes("broadcast-end")
          ? "POST"
          : "GET",
        headers: { "Content-Type": "application/json" },
        body:
          route.includes("preflight") || route.includes("go-live")
            ? JSON.stringify({ mode: "external_hls", confirm: true })
            : undefined,
        signal: AbortSignal.timeout(8_000),
      });

      if (response.status === 404) {
        results.push(fail(`http_route:${route}`, "route not found"));
      } else {
        results.push(pass(`http_route:${route}`, `HTTP ${response.status}`));
      }
    } catch (error) {
      results.push(fail(`http_route:${route}`, error instanceof Error ? error.message : String(error)));
    }
  }

  for (const page of [LIV_STREAM_SETUP_PAGE, LIV_FAN_VIEWER]) {
    try {
      const started = performance.now();
      const response = await fetch(`${baseUrl}${page}`, {
        signal: AbortSignal.timeout(12_000),
      });
      const elapsed = Math.round(performance.now() - started);
      if (!response.ok) {
        results.push(fail(`page:${page}`, `HTTP ${response.status}`));
      } else {
        results.push(pass(`page:${page}`, `${elapsed}ms`));
      }
    } catch (error) {
      results.push(fail(`page:${page}`, error instanceof Error ? error.message : String(error)));
    }
  }

  try {
    const started = performance.now();
    const response = await fetch(`${baseUrl}/api/enterprise/liv-golf/stream-setup`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const elapsed = Math.round(performance.now() - started);
    const json = await response.json();

    const requiredKeys = [
      "publishStatus",
      "eventPhase",
      "hlsUrl",
      "manifestReachable",
      "readinessBlockers",
      "targetDateTime",
      "scheduleEnded",
    ];

    const missingKeys = requiredKeys.filter((key) => !(key in json));
    if (!response.ok) {
      results.push(fail("liv_stream_setup_payload", `HTTP ${response.status}`));
    } else if (missingKeys.length > 0) {
      results.push(fail("liv_stream_setup_payload", `missing keys: ${missingKeys.join(", ")}`));
    } else if (elapsed > 2_500) {
      results.push(
        fail("liv_stream_setup_latency", `slow response ${elapsed}ms (target < 2500ms)`),
      );
    } else {
      results.push(
        pass(
          "liv_stream_setup_latency",
          `${elapsed}ms · blockers=${json.readinessBlockers?.length ?? 0} · phase=${json.eventPhase}`,
        ),
      );
    }
  } catch (error) {
    results.push(fail("liv_stream_setup_latency", error instanceof Error ? error.message : String(error)));
  }

  return results;
}

async function main() {
  const started = performance.now();
  const sections = [];

  sections.push({ group: "liv_wiring", results: await checkLivWiring() });
  sections.push({ group: "shared_broadcast_modules", results: await checkSharedBroadcastModules() });

  if (BASE_URL) {
    sections.push({ group: "http_surface", results: await checkHttpSurface(BASE_URL) });
  } else {
    sections.push({
      group: "http_surface",
      results: [
        pass(
          "http_surface_skipped",
          "Pass base URL to probe routes, e.g. node scripts/simulate-liv-golf-go-live.mjs http://localhost:3000",
        ),
      ],
    });
  }

  const flat = sections.flatMap((section) => section.results.map((result) => ({ ...result, group: section.group })));
  const failures = flat.filter((result) => !result.ok);

  const report = {
    simulatedAt: new Date().toISOString(),
    surface: "enterprise/liv-golf",
    baseUrl: BASE_URL,
    durationMs: Math.round(performance.now() - started),
    summary: { total: flat.length, passed: flat.length - failures.length, failed: failures.length },
    operatorPath: [
      `Open ${LIV_STREAM_SETUP_PAGE}`,
      "Save RTMP ingest + stream key + HLS .m3u8 via /api/owner/show-setup",
      "Start OBS/vMix push to Restream",
      "Run Preflight via /api/owner/broadcast/preflight",
      "Go Live via /api/owner/master-go-live",
      `Fans watch ${LIV_FAN_VIEWER} via /api/stream/manifest`,
      "Stop via /api/owner/broadcast-end",
    ],
    sections,
    failures,
    note:
      failures.length === 0
        ? "LIV Golf uses the same owner broadcast stack as Vital Organs. Full RTMP still requires a real encoder push and reachable HLS manifest."
        : "Resolve failed checks before show day. HTTP checks require `npm run dev`.",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
