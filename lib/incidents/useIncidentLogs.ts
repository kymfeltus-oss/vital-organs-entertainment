"use client";

import { useCallback, useMemo, useState } from "react";
import { cloneMockIncidents } from "@/lib/incidents/mockIncidents";
import type {
  DateRangePreset,
  Incident,
  IncidentAdvancedFilters,
  IncidentSeverity,
  IncidentSummaryCounts,
} from "@/lib/incidents/types";
import { DEFAULT_INCIDENT_FILTERS } from "@/lib/incidents/types";

function isWithinPreset(timeIso: string, preset: DateRangePreset): boolean {
  const time = new Date(timeIso).getTime();
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return time >= startOfToday.getTime();
    case "24h":
      return time >= now - 24 * 60 * 60 * 1000;
    case "7d":
      return time >= now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return time >= now - 30 * 24 * 60 * 60 * 1000;
    case "custom":
      return true;
    default:
      return true;
  }
}

function matchesSearch(incident: Incident, search: string): boolean {
  if (!search.trim()) return true;
  const needle = search.trim().toLowerCase();
  const haystack = [
    incident.user,
    incident.action,
    incident.target,
    incident.severity,
    incident.status,
    incident.description,
    new Date(incident.time).toLocaleString(),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function summarize(incidents: Incident[]): IncidentSummaryCounts {
  return {
    total: incidents.length,
    critical: incidents.filter((item) => item.severity === "critical").length,
    warning: incidents.filter((item) => item.severity === "warning").length,
    info: incidents.filter((item) => item.severity === "info").length,
  };
}

export function useIncidentLogs() {
  const [incidents, setIncidents] = useState<Incident[]>(() => cloneMockIncidents());
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">("all");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("today");
  const [advancedFilters, setAdvancedFilters] =
    useState<IncidentAdvancedFilters>(DEFAULT_INCIDENT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (!showResolved && incident.status === "resolved") return false;
      if (severityFilter !== "all" && incident.severity !== severityFilter) return false;
      if (advancedFilters.severity !== "all" && incident.severity !== advancedFilters.severity) {
        return false;
      }
      if (advancedFilters.status !== "all" && incident.status !== advancedFilters.status) {
        return false;
      }
      if (advancedFilters.user && !incident.user.toLowerCase().includes(advancedFilters.user.toLowerCase())) {
        return false;
      }
      if (
        advancedFilters.action &&
        !incident.action.toLowerCase().includes(advancedFilters.action.toLowerCase())
      ) {
        return false;
      }
      if (advancedFilters.streamId && incident.streamId !== advancedFilters.streamId) return false;
      if (advancedFilters.workerId && incident.workerId !== advancedFilters.workerId) return false;

      if (datePreset === "custom") {
        const time = new Date(incident.time).getTime();
        if (customDateFrom && time < new Date(customDateFrom).getTime()) return false;
        if (customDateTo && time > new Date(customDateTo).getTime()) return false;
      } else if (!isWithinPreset(incident.time, datePreset)) {
        return false;
      }

      if (advancedFilters.dateFrom && new Date(incident.time) < new Date(advancedFilters.dateFrom)) {
        return false;
      }
      if (advancedFilters.dateTo && new Date(incident.time) > new Date(advancedFilters.dateTo)) {
        return false;
      }

      return matchesSearch(incident, search);
    });
  }, [
    incidents,
    severityFilter,
    advancedFilters,
    search,
    datePreset,
    customDateFrom,
    customDateTo,
    showResolved,
  ]);

  const summary = useMemo(() => summarize(filteredIncidents), [filteredIncidents]);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? null,
    [incidents, selectedId],
  );

  const markReviewed = useCallback((id: string) => {
    setIncidents((current) =>
      current.map((incident) =>
        incident.id === id ? { ...incident, status: "reviewed" } : incident,
      ),
    );
  }, []);

  const escalate = useCallback((id: string) => {
    setIncidents((current) =>
      current.map((incident) =>
        incident.id === id
          ? { ...incident, status: "escalated", severity: "critical" }
          : incident,
      ),
    );
  }, []);

  const applyAdvancedFilters = useCallback((filters: IncidentAdvancedFilters) => {
    setAdvancedFilters(filters);
  }, []);

  const resetFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_INCIDENT_FILTERS);
    setSeverityFilter("all");
    setSearch("");
    setDatePreset("today");
    setCustomDateFrom("");
    setCustomDateTo("");
  }, []);

  return {
    incidents: filteredIncidents,
    allIncidents: incidents,
    summary,
    total: filteredIncidents.length,
    severityFilter,
    setSeverityFilter,
    search,
    setSearch,
    datePreset,
    setDatePreset,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    advancedFilters,
    applyAdvancedFilters,
    resetFilters,
    selectedId,
    setSelectedId,
    selectedIncident,
    markReviewed,
    escalate,
    showResolved,
    setShowResolved,
  };
}

export type UseIncidentLogsReturn = ReturnType<typeof useIncidentLogs>;
