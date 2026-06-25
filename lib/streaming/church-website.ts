import { lookup } from "node:dns/promises";
import type { ChurchWebsiteSettingsNormalized } from "@/lib/streaming/church-website-shared";

export type ChurchWebsiteValidationResult = {
  ok: boolean;
  status: "ready" | "needs_attention" | "error";
  reason: string;
  checks: Array<{
    key: string;
    label: string;
    ok: boolean;
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
};

function toValidUrl(value: string): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

async function endpointReachable(url: URL): Promise<{ ok: boolean; statusCode: number | null; message: string }> {
  try {
    let response = await fetch(url.toString(), { method: "HEAD", redirect: "follow", cache: "no-store" });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url.toString(), { method: "GET", redirect: "follow", cache: "no-store" });
    }
    const ok = response.ok;
    return {
      ok,
      statusCode: response.status,
      message: ok ? "Reachable." : `Returned HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      message: error instanceof Error ? error.message : "Request failed.",
    };
  }
}

export async function validateChurchWebsiteSettings(
  settings: ChurchWebsiteSettingsNormalized,
): Promise<ChurchWebsiteValidationResult> {
  const checks: ChurchWebsiteValidationResult["checks"] = [];
  const websiteUrl = toValidUrl(settings.websiteUrl);
  const streamPageUrl = toValidUrl(settings.streamPageUrl);

  const websitePresent = Boolean(settings.websiteUrl);
  const streamPagePresent = Boolean(settings.streamPageUrl);
  checks.push({
    key: "website_url_present",
    label: "Website URL is configured",
    ok: websitePresent,
    message: websitePresent ? "Website URL is configured." : "Website URL is missing.",
    severity: websitePresent ? "info" : "critical",
  });
  checks.push({
    key: "stream_page_url_present",
    label: "Stream page URL is configured",
    ok: streamPagePresent,
    message: streamPagePresent ? "Stream page URL is configured." : "Stream page URL is missing.",
    severity: streamPagePresent ? "info" : "critical",
  });

  const websiteHttps = websiteUrl?.protocol === "https:";
  const streamPageHttps = streamPageUrl?.protocol === "https:";
  checks.push({
    key: "https",
    label: "HTTPS required",
    ok: Boolean(websiteHttps && streamPageHttps),
    message:
      websiteHttps && streamPageHttps
        ? "Both URLs use HTTPS."
        : "Website URL and stream page URL must use HTTPS.",
    severity: websiteHttps && streamPageHttps ? "info" : "critical",
  });

  const embedOk = settings.embedMethod === "iframe" || settings.embedMethod === "link";
  checks.push({
    key: "embed_method",
    label: "Embed method configured",
    ok: embedOk,
    message: embedOk ? "Embed method is configured." : "Embed method not configured.",
    severity: embedOk ? "info" : "critical",
  });

  let dnsWebsite = false;
  let dnsStream = false;
  if (websiteUrl?.hostname) {
    try {
      await lookup(websiteUrl.hostname);
      dnsWebsite = true;
    } catch {
      dnsWebsite = false;
    }
  }
  if (streamPageUrl?.hostname) {
    try {
      await lookup(streamPageUrl.hostname);
      dnsStream = true;
    } catch {
      dnsStream = false;
    }
  }
  checks.push({
    key: "dns_reachable",
    label: "DNS resolves",
    ok: dnsWebsite && dnsStream,
    message: dnsWebsite && dnsStream ? "DNS lookup succeeded." : "DNS lookup failed for website or stream page.",
    severity: dnsWebsite && dnsStream ? "info" : "critical",
  });

  const websiteReach = websiteUrl ? await endpointReachable(websiteUrl) : { ok: false, statusCode: null, message: "Website URL is missing." };
  const streamReach = streamPageUrl ? await endpointReachable(streamPageUrl) : { ok: false, statusCode: null, message: "Stream page URL is missing." };
  checks.push({
    key: "website_reachable",
    label: "Website reachable",
    ok: websiteReach.ok,
    message: websiteReach.ok ? "Website is reachable." : `Website returned ${websiteReach.statusCode ?? "no response"}.`,
    severity: websiteReach.ok ? "info" : "critical",
  });
  checks.push({
    key: "stream_page_reachable",
    label: "Stream page reachable",
    ok: streamReach.ok,
    message: streamReach.ok ? "Stream page is reachable." : `Stream page returned ${streamReach.statusCode ?? "no response"}.`,
    severity: streamReach.ok ? "info" : "critical",
  });

  checks.push({
    key: "ssl_valid",
    label: "SSL valid",
    ok: Boolean(websiteHttps && streamPageHttps && websiteReach.ok && streamReach.ok),
    message:
      websiteHttps && streamPageHttps && websiteReach.ok && streamReach.ok
        ? "SSL looks valid."
        : "SSL certificate failed or HTTPS endpoint unavailable.",
    severity: websiteHttps && streamPageHttps && websiteReach.ok && streamReach.ok ? "info" : "critical",
  });

  const failed = checks.find((check) => !check.ok && check.severity === "critical");
  if (failed) {
    return {
      ok: false,
      status: "needs_attention",
      reason: failed.message,
      checks,
    };
  }

  return {
    ok: true,
    status: "ready",
    reason: "Church website destination is ready.",
    checks,
  };
}
