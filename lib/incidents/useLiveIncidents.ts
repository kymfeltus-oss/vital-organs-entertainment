"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildLiveIncidentsStreamUrl,
  escalateIncidentApi,
  exportIncidentsCsv,
  fetchIncidents,
  resolveIncidentApi,
  reviewIncident,
} from "@/lib/incidents/api";
import { downloadCsv } from "@/lib/incidents/exportCsv";
import type {
  IncidentAdvancedFilters,
  IncidentConnectionState,
  IncidentEvent,
  IncidentPermissions,
  IncidentQueryParams,
  IncidentSummary,
} from "@/lib/incidents/types";
import { DEFAULT_INCIDENT_FILTERS } from "@/lib/incidents/types";

function readFiltersFromSearchParams(searchParams: URLSearchParams): IncidentAdvancedFilters {
  return {
    severity: (searchParams.get("severity") as IncidentAdvancedFilters["severity"]) || "all",
    status: (searchParams.get("status") as IncidentAdvancedFilters["status"]) || "all",
    source: (searchParams.get("source") as IncidentAdvancedFilters["source"]) || "all",
    user: searchParams.get("user") ?? "",
    action: searchParams.get("action") ?? "",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    streamId: searchParams.get("streamId") ?? "",
    workerId: searchParams.get("workerId") ?? "",
  };
}

function filtersToQuery(
  filters: IncidentAdvancedFilters,
  search: string,
  datePreset: string,
): IncidentQueryParams {
  return {
    severity: filters.severity,
    status: filters.status,
    source: filters.source,
    user: filters.user || undefined,
    action: filters.action || undefined,
    search: search || undefined,
    streamId: filters.streamId || undefined,
    workerId: filters.workerId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    ...(datePreset ? { datePreset } : {}),
  } satisfies IncidentQueryParams;
}

export function useLiveIncidents(initialPermissions?: IncidentPermissions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [summary, setSummary] = useState<IncidentSummary>({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<IncidentConnectionState>("disconnected");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [datePreset, setDatePreset] = useState(searchParams.get("datePreset") ?? "24h");
  const [filters, setFilters] = useState<IncidentAdvancedFilters>(() =>
    readFiltersFromSearchParams(new URLSearchParams(searchParams.toString())),
  );
  const [permissions] = useState<IncidentPermissions | undefined>(initialPermissions);
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useMemo(
    () => filtersToQuery(filters, search, datePreset),
    [filters, search, datePreset],
  );

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const syncUrl = useCallback(
    (nextFilters: IncidentAdvancedFilters, nextSearch: string, nextPreset: string) => {
      const params = new URLSearchParams();
      if (nextFilters.severity !== "all") params.set("severity", nextFilters.severity);
      if (nextFilters.status !== "all") params.set("status", nextFilters.status);
      if (nextFilters.source !== "all") params.set("source", nextFilters.source);
      if (nextFilters.user) params.set("user", nextFilters.user);
      if (nextFilters.action) params.set("action", nextFilters.action);
      if (nextFilters.dateFrom) params.set("dateFrom", nextFilters.dateFrom);
      if (nextFilters.dateTo) params.set("dateTo", nextFilters.dateTo);
      if (nextFilters.streamId) params.set("streamId", nextFilters.streamId);
      if (nextFilters.workerId) params.set("workerId", nextFilters.workerId);
      if (nextSearch) params.set("search", nextSearch);
      if (nextPreset) params.set("datePreset", nextPreset);
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchIncidents(query);
      setIncidents(response.incidents);
      setSummary(response.summary);
      setTotal(response.total);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load incidents.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const connect = () => {
      eventSourceRef.current?.close();
      setConnection(retryRef.current > 0 ? "reconnecting" : "live");

      const streamUrl = buildLiveIncidentsStreamUrl(query);
      const source = new EventSource(streamUrl);
      eventSourceRef.current = source;

      source.onopen = () => {
        retryRef.current = 0;
        setConnection("live");
      };

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            incidents: IncidentEvent[];
            total: number;
          };
          setIncidents(payload.incidents);
          setTotal(payload.total);
          setSummary({
            total: payload.incidents.length,
            critical: payload.incidents.filter((item) => item.severity === "critical").length,
            warning: payload.incidents.filter((item) => item.severity === "warning").length,
            info: payload.incidents.filter((item) => item.severity === "info").length,
          });
        } catch {
          // Ignore malformed frames.
        }
      };

      source.onerror = () => {
        source.close();
        setConnection("reconnecting");
        retryRef.current += 1;
        const delay = Math.min(30_000, 1000 * 2 ** retryRef.current);
        window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      eventSourceRef.current?.close();
      setConnection("disconnected");
    };
  }, [query]);

  const applyFilters = useCallback(
    (next: IncidentAdvancedFilters) => {
      setFilters(next);
      syncUrl(next, search, datePreset);
    },
    [datePreset, search, syncUrl],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_INCIDENT_FILTERS);
    setSearch("");
    setDatePreset("24h");
    syncUrl(DEFAULT_INCIDENT_FILTERS, "", "24h");
  }, [syncUrl]);

  const setSeverityQuickFilter = useCallback(
    (severity: IncidentAdvancedFilters["severity"]) => {
      const next = { ...filters, severity };
      setFilters(next);
      syncUrl(next, search, datePreset);
    },
    [datePreset, filters, search, syncUrl],
  );

  const updateSearch = useCallback(
    (value: string) => {
      setSearch(value);
      syncUrl(filters, value, datePreset);
    },
    [datePreset, filters, syncUrl],
  );

  const updateDatePreset = useCallback(
    (value: string) => {
      setDatePreset(value);
      syncUrl(filters, search, value);
    },
    [filters, search, syncUrl],
  );

  const exportLogs = useCallback(async () => {
    const csv = await exportIncidentsCsv(query);
    downloadCsv(`incident-logs-${Date.now()}.csv`, csv);
  }, [query]);

  const markReviewed = useCallback(async (id: string) => {
    const incident = await reviewIncident(id);
    setIncidents((current) => current.map((item) => (item.id === id ? incident : item)));
    return incident;
  }, []);

  const escalate = useCallback(async (id: string) => {
    const incident = await escalateIncidentApi(id);
    setIncidents((current) => current.map((item) => (item.id === id ? incident : item)));
    return incident;
  }, []);

  const resolve = useCallback(async (id: string) => {
    const incident = await resolveIncidentApi(id);
    setIncidents((current) => current.map((item) => (item.id === id ? incident : item)));
    return incident;
  }, []);

  return {
    incidents,
    summary,
    total,
    loading,
    error,
    connection,
    selectedId,
    selectedIncident,
    setSelectedId,
    search,
    updateSearch,
    datePreset,
    updateDatePreset,
    filters,
    applyFilters,
    resetFilters,
    setSeverityQuickFilter,
    refresh,
    exportLogs,
    markReviewed,
    escalate,
    resolve,
    permissions,
  };
}

export type UseLiveIncidentsReturn = ReturnType<typeof useLiveIncidents>;
