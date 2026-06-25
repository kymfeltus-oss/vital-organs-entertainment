import type {
  IncidentEvent,
  IncidentListResponse,
  IncidentQueryParams,
} from "@/lib/incidents/types";

function buildQueryString(params: IncidentQueryParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data;
}

export async function fetchIncidents(params: IncidentQueryParams = {}): Promise<IncidentListResponse> {
  const response = await fetch(`/api/v1/incidents${buildQueryString(params)}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<IncidentListResponse>(response);
}

export async function fetchIncidentById(id: string): Promise<IncidentEvent> {
  const response = await fetch(`/api/v1/incidents/${id}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<{ incident: IncidentEvent }>(response).then((data) => data.incident);
}

export async function reviewIncident(id: string): Promise<IncidentEvent> {
  const response = await fetch(`/api/v1/incidents/${id}/review`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseJson<{ incident: IncidentEvent }>(response).then((data) => data.incident);
}

export async function escalateIncidentApi(id: string): Promise<IncidentEvent> {
  const response = await fetch(`/api/v1/incidents/${id}/escalate`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseJson<{ incident: IncidentEvent }>(response).then((data) => data.incident);
}

export async function resolveIncidentApi(id: string): Promise<IncidentEvent> {
  const response = await fetch(`/api/v1/incidents/${id}/resolve`, {
    method: "PATCH",
    credentials: "include",
  });
  return parseJson<{ incident: IncidentEvent }>(response).then((data) => data.incident);
}

export async function exportIncidentsCsv(params: IncidentQueryParams = {}): Promise<string> {
  const response = await fetch(`/api/v1/incidents/export${buildQueryString(params)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Export failed");
  }
  return response.text();
}

export function buildLiveIncidentsStreamUrl(params: IncidentQueryParams = {}): string {
  return `/api/v1/incidents/live${buildQueryString(params)}`;
}
