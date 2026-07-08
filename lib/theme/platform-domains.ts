/** Primary platform hosts — subdomains on these resolve to tenant IDs. */
export const PLATFORM_ALLOWED_DOMAINS = [
  "localhost:3000",
  "localhost:3001",
  "parablestreaming.com",
  "www.parablestreaming.com",
  "yourplatform.com",
  "www.yourplatform.com",
] as const;

export function getPlatformAllowedDomains(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_DOMAINS?.trim();
  if (!fromEnv) return [...PLATFORM_ALLOWED_DOMAINS];
  return fromEnv
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveMainPlatformDomain(hostname: string): string | null {
  const normalized = hostname.toLowerCase();
  const domains = getPlatformAllowedDomains();

  return (
    domains.find((domain) => normalized === domain || normalized.endsWith(`.${domain}`)) ??
    null
  );
}

export function extractTenantSubdomain(hostname: string): string | null {
  const mainDomain = resolveMainPlatformDomain(hostname);
  if (mainDomain) {
    const normalized = hostname.toLowerCase();
    if (normalized === mainDomain) return null;

    const suffix = `.${mainDomain}`;
    if (normalized.endsWith(suffix)) {
      const subdomain = normalized.slice(0, -suffix.length).trim();
      if (subdomain && subdomain !== "www") {
        return subdomain;
      }
    }
  }

  const localhostMatch = hostname.toLowerCase().match(/^([a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?)\.localhost(?::\d+)?$/);
  if (localhostMatch?.[1] && localhostMatch[1] !== "www") {
    return localhostMatch[1];
  }

  return null;
}

/** Apex marketing host shown in onboarding subdomain previews. */
export function getMarketingPlatformHost(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_MARKETING_DOMAIN?.trim();
  if (fromEnv) return fromEnv;

  const domains = getPlatformAllowedDomains();
  const preferred =
    domains.find((domain) => domain !== "localhost:3000" && !domain.startsWith("www.")) ??
    domains[0];

  return preferred ?? "yourplatform.com";
}

/** Full apex marketing URL for Stripe success/cancel redirects. */
export function getMarketingPlatformBaseUrl(): string {
  const host = getMarketingPlatformHost();
  if (host.includes("localhost")) return `http://${host}`;
  return `https://${host}`;
}
