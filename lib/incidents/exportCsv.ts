import type { Incident, IncidentEvent } from "@/lib/incidents/types";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type CsvRow = {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
  severity: string;
  status: string;
  streamId: string;
  tenantId: string;
  workerId: string;
  description: string;
};

function toCsvRow(incident: Incident | IncidentEvent): CsvRow {
  if ("time" in incident) {
    return {
      id: incident.id,
      time: incident.time,
      user: incident.user,
      action: incident.action,
      target: incident.target,
      severity: incident.severity,
      status: incident.status,
      streamId: incident.streamId,
      tenantId: incident.tenantId,
      workerId: incident.workerId,
      description: incident.description,
    };
  }

  return {
    id: incident.id,
    time: incident.createdAt,
    user: incident.userEmail ?? "system",
    action: incident.action,
    target: incident.target,
    severity: incident.severity,
    status: incident.status,
    streamId: incident.streamId ?? "",
    tenantId: incident.tenantId,
    workerId: incident.workerId ?? "",
    description: incident.description,
  };
}

export function incidentsToCsv(incidents: Incident[] | IncidentEvent[]): string {
  const headers = [
    "id",
    "time",
    "user",
    "action",
    "target",
    "severity",
    "status",
    "stream_id",
    "tenant_id",
    "worker_id",
    "description",
  ];

  const rows = incidents.map((incident) => {
    const row = toCsvRow(incident);
    return [
      row.id,
      row.time,
      row.user,
      row.action,
      row.target,
      row.severity,
      row.status,
      row.streamId,
      row.tenantId,
      row.workerId,
      row.description,
    ]
      .map((cell) => escapeCsv(String(cell)))
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
