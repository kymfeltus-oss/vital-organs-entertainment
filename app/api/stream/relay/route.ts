import { NextRequest, NextResponse } from "next/server";
import { isValidRelayTargetUrl, resolveRelayTargetCandidate } from "@/lib/live/hls";
import {
  parseIvsHostIdFromIngestUrl,
  parseIvsHostIdFromPlaybackUrl,
} from "@/lib/live/ivs-playback-url";
import {
  manifestCorsHeaderRecord,
  resolveEnvPlaybackUrl,
} from "@/lib/live/manifest-env-fast-path";
import { collapseIvsMasterForDevRelay } from "@/lib/live/relay-playlist-normalize";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

const ALLOWED_HOST_SUFFIXES = [
  "test-streams.mux.dev",
  "stream.mux.com",
  "mux.dev",
  "mux.com",
  "restream.io",
  "playback.live-video.net",
  "playlist.live-video.net",
];

/** IVS CDN hostnames share a channel host-id prefix: {hostId}.{edge}.playback|playlist.live-video.net */
function parseIvsHostIdFromHostname(hostname: string): string | null {
  const match = /^([a-f0-9]+)\./i.exec(hostname.toLowerCase());
  return match?.[1] ?? null;
}

function resolveConfiguredIvsHostId(): string | null {
  return (
    process.env.AWS_IVS_HOST_ID?.trim() ||
    parseIvsHostIdFromPlaybackUrl(resolveEnvPlaybackUrl()) ||
    parseIvsHostIdFromPlaybackUrl(process.env.ATTENDEE_BACKUP_HLS_URL) ||
    parseIvsHostIdFromIngestUrl(process.env.AWS_IVS_INGEST_SERVER) ||
    null
  );
}

/** Allow IVS child playlists, CloudFront segment hosts, etc. that share the configured host ID. */
function isAllowedIvsSiblingHost(hostname: string): boolean {
  const configuredHostId = resolveConfiguredIvsHostId();
  if (!configuredHostId) return false;

  const host = hostname.toLowerCase();
  if (!host.endsWith(".live-video.net")) return false;

  const targetHostId = parseIvsHostIdFromHostname(host);
  return targetHostId === configuredHostId;
}

function relayReject(reason: string, detail: Record<string, unknown> = {}): void {
  console.error("[Relay Reject Reason]", reason, detail);
}

function isAllowedUpstream(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) {
    relayReject("invalid_protocol", { protocol: url.protocol, target: url.toString() });
    return false;
  }

  const host = url.hostname.toLowerCase();

  if (isAllowedIvsSiblingHost(host)) {
    return true;
  }

  const envUrl = resolveEnvPlaybackUrl();
  if (envUrl) {
    try {
      if (new URL(envUrl).hostname.toLowerCase() === host) {
        return true;
      }
    } catch {
      relayReject("invalid_env_playback_url", { envUrl });
    }
  }

  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );

  if (!allowed) {
    relayReject("upstream_host_not_allowed", {
      host,
      configuredIvsHostId: resolveConfiguredIvsHostId(),
      allowedSuffixes: ALLOWED_HOST_SUFFIXES,
      target: url.toString(),
    });
  }

  return allowed;
}

function buildRelayTargetUrl(relayBase: URL, absoluteHref: string): string {
  const relay = new URL(relayBase);
  relay.searchParams.set("target", absoluteHref);
  return relay.toString();
}

/** IVS low-latency tags that race through the dev relay and cause audio glitches. */
function shouldStripLlHlsTag(trimmed: string): boolean {
  const upper = trimmed.toUpperCase();
  return (
    upper.startsWith("#EXT-X-PREFETCH") ||
    upper.startsWith("#EXT-X-PRELOAD-HINT") ||
    upper.startsWith("#EXT-X-PART:") ||
    upper.startsWith("#EXT-X-PART-INF") ||
    upper.startsWith("#EXT-X-SERVER-CONTROL") ||
    upper.startsWith("#EXT-X-SKIPPED-SEGMENTS")
  );
}

function isPlaylistResourceLine(trimmed: string): boolean {
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith("/")) return true;
  return /\.(ts|m3u8|m4s|aac|mp4)(\?|$)/i.test(trimmed);
}

function relayAbsoluteUrl(
  rawUrl: string,
  upstreamUrl: URL,
  relayBase: URL,
): string | null {
  try {
    const absolute = new URL(rawUrl, upstreamUrl).href;
    return buildRelayTargetUrl(relayBase, absolute);
  } catch {
    return null;
  }
}

function rewriteTagLine(line: string, upstreamUrl: URL, relayBase: URL): string {
  const trimmed = line.trim();
  if (shouldStripLlHlsTag(trimmed)) {
    return "";
  }

  const withRelayUrls = trimmed.replace(/https:\/\/[^\s"'<>]+/g, (rawUrl) => {
    return relayAbsoluteUrl(rawUrl, upstreamUrl, relayBase) ?? rawUrl;
  });

  const uriMatch = withRelayUrls.match(/URI="([^"]+)"/i);
  if (uriMatch?.[1] && !uriMatch[1].includes("localhost")) {
    const relayed = relayAbsoluteUrl(uriMatch[1], upstreamUrl, relayBase);
    if (relayed) {
      return withRelayUrls.replace(uriMatch[1], relayed);
    }
  }

  return withRelayUrls;
}

/**
 * Strip LL-HLS prefetch/part hints, then rewrite every segment and playlist URL
 * (absolute or relative) so nothing bypasses the same-origin relay.
 */
function rewritePlaylistBody(body: string, upstreamUrl: URL, relayBase: URL): string {
  const normalized = collapseIvsMasterForDevRelay(body);
  const lines = normalized.split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      output.push(line);
      continue;
    }

    if (shouldStripLlHlsTag(trimmed)) {
      const nextTrimmed = lines[index + 1]?.trim() ?? "";
      if (isPlaylistResourceLine(nextTrimmed)) {
        index += 1;
      }
      continue;
    }

    if (trimmed.startsWith("#EXT-X-RENDITION-REPORT")) {
      continue;
    }

    if (trimmed.startsWith("#")) {
      const rewritten = rewriteTagLine(line, upstreamUrl, relayBase);
      if (rewritten) {
        output.push(rewritten);
      }
      continue;
    }

    if (isPlaylistResourceLine(trimmed)) {
      const relayed = relayAbsoluteUrl(trimmed, upstreamUrl, relayBase);
      output.push(relayed ?? line);
      continue;
    }

    output.push(line);
  }

  return output.join("\n");
}

async function authorizeRelay(request: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    relayReject("relay_disabled_outside_development", {
      nodeEnv: process.env.NODE_ENV,
    });
    return false;
  }

  const host = request.headers.get("host") ?? "";
  if (!host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    relayReject("relay_host_not_local", { host });
    return false;
  }

  if (isLiveAccessDevBypassEnabled()) return true;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    relayReject("relay_unauthorized", { host });
  }

  return Boolean(user);
}

function relayResponse(
  request: NextRequest,
  body: BodyInit,
  contentType: string,
  status = 200,
): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      ...manifestCorsHeaderRecord(request),
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: manifestCorsHeaderRecord(request),
  });
}

/**
 * Dev-only same-origin HLS relay — avoids http localhost throttling https segment fetches.
 */
export async function GET(request: NextRequest) {
  if (!(await authorizeRelay(request))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const targetRaw = request.nextUrl.searchParams.get("target")?.trim() ?? "";
  if (!targetRaw) {
    relayReject("empty_target_param", { search: request.nextUrl.search });
    return NextResponse.json({ error: "Invalid target URL." }, { status: 400 });
  }

  const resolvedTarget = resolveRelayTargetCandidate(targetRaw);
  if (!resolvedTarget) {
    relayReject("invalid_relay_target_url", {
      targetRaw,
      isValidRelayTargetUrl: isValidRelayTargetUrl(targetRaw),
    });
    return NextResponse.json({ error: "Invalid target URL." }, { status: 400 });
  }

  let upstream: URL;
  try {
    upstream = new URL(resolvedTarget);
  } catch (error) {
    relayReject("target_url_parse_failed", {
      resolvedTarget,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Invalid target URL." }, { status: 400 });
  }

  if (!isAllowedUpstream(upstream)) {
    return NextResponse.json({ error: "Upstream host not allowed." }, { status: 403 });
  }

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "*/*" },
    });

    if (!upstreamResponse.ok) {
      relayReject("upstream_fetch_failed", {
        target: upstream.toString(),
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
      });
      return relayResponse(request, "Upstream unavailable.", "text/plain", upstreamResponse.status);
    }

    const contentType =
      upstreamResponse.headers.get("content-type")?.trim() ??
      (upstream.pathname.endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "application/octet-stream");

    const isPlaylist =
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8") ||
      upstream.pathname.endsWith(".m3u8");

    if (isPlaylist) {
      const text = await upstreamResponse.text();
      const relayBase = new URL("/api/stream/relay", request.nextUrl.origin);
      const rewritten = rewritePlaylistBody(text, upstream, relayBase);
      return relayResponse(request, rewritten, "application/vnd.apple.mpegurl");
    }

    const buffer = await upstreamResponse.arrayBuffer();
    return relayResponse(request, buffer, contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Relay fetch failed.";
    relayReject("relay_fetch_exception", {
      target: upstream.toString(),
      error: message,
    });
    return relayResponse(request, message, "text/plain", 502);
  }
}
