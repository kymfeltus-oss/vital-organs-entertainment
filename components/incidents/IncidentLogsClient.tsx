"use client";

import { useState } from "react";
import AdvancedIncidentFilterModal from "@/components/incidents/AdvancedIncidentFilterModal";
import IncidentDetailDrawer from "@/components/incidents/IncidentDetailDrawer";
import IncidentFilters from "@/components/incidents/IncidentFilters";
import IncidentSettingsModal from "@/components/incidents/IncidentSettingsModal";
import IncidentSummary from "@/components/incidents/IncidentSummary";
import IncidentTable from "@/components/incidents/IncidentTable";
import IncidentTopTabs from "@/components/incidents/IncidentTopTabs";
import { downloadCsv, incidentsToCsv } from "@/lib/incidents/exportCsv";
import { useIncidentLogs } from "@/lib/incidents/useIncidentLogs";

type IncidentLogsClientProps = {
  operatorEmail: string;
};

export default function IncidentLogsClient({ operatorEmail }: IncidentLogsClientProps) {
  const setup = useIncidentLogs();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  return (
    <div className="min-h-dvh bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(0,168,255,0.08),transparent_42%)]" />

      <div className="relative">
        <IncidentTopTabs operatorEmail={operatorEmail} onOpenSettings={() => setSettingsOpen(true)} />

        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:p-6">
          <IncidentSummary
            summary={setup.summary}
            exporting={exporting}
            onExport={() => {
              setExporting(true);
              downloadCsv(
                `incident-logs-${Date.now()}.csv`,
                incidentsToCsv(setup.incidents),
              );
              window.setTimeout(() => setExporting(false), 400);
            }}
          />

          <IncidentTable
            incidents={setup.incidents}
            total={setup.total}
            onSelect={setup.setSelectedId}
            onOpenFilters={() => setFiltersOpen(true)}
          />

          <IncidentFilters setup={setup} />
        </div>
      </div>

      <IncidentDetailDrawer
        incident={setup.selectedIncident}
        onClose={() => setup.setSelectedId(null)}
        onReview={setup.markReviewed}
        onEscalate={setup.escalate}
      />

      <AdvancedIncidentFilterModal
        open={filtersOpen}
        filters={setup.advancedFilters}
        onApply={(next) => {
          setup.applyAdvancedFilters(next);
          setFiltersOpen(false);
        }}
        onReset={() => {
          setup.resetFilters();
          setFiltersOpen(false);
        }}
        onClose={() => setFiltersOpen(false)}
      />

      <IncidentSettingsModal
        open={settingsOpen}
        showResolved={setup.showResolved}
        onShowResolvedChange={setup.setShowResolved}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
