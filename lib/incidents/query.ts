import type { NextRequest } from "next/server";
import type { IncidentQueryParams } from "@/lib/incidents/types";
import { INCIDENT_SEVERITIES, INCIDENT_SOURCES, INCIDENT_STATUSES } from "@/lib/incidents/types";

function pickEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | "all" | undefined {
  if (!value || value === "all") return value === "all" ? "all" : undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function parseIncidentQuery(request: NextRequest): IncidentQueryParams {
  const params = request.nextUrl.searchParams;

  return {
    severity: pickEnum(params.get("severity"), INCIDENT_SEVERITIES),
    status: pickEnum(params.get("status"), INCIDENT_STATUSES),
    source: pickEnum(params.get("source"), INCIDENT_SOURCES),
    user: params.get("user") ?? undefined,
    action: params.get("action") ?? undefined,
    search: params.get("search") ?? undefined,
    streamId: params.get("streamId") ?? undefined,
    workerId: params.get("workerId") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    datePreset: params.get("datePreset") ?? undefined,
    limit: params.get("limit") ? Number.parseInt(params.get("limit")!, 10) : undefined,
    offset: params.get("offset") ? Number.parseInt(params.get("offset")!, 10) : undefined,
  };
}

export function resolvePresetDateRange(preset: string | null): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const to = now.toISOString();

  switch (preset) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { dateFrom: start.toISOString(), dateTo: to };
    }
    case "24h":
      return { dateFrom: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), dateTo: to };
    case "7d":
      return { dateFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), dateTo: to };
    case "30d":
      return { dateFrom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), dateTo: to };
    default:
      return {};
  }
}
