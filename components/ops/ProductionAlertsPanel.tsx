import type { ProductionAlert } from "@/lib/ops/production-dashboard-metrics";
import { statusAccentClass } from "@/lib/ops/production-dashboard-metrics";

type ProductionAlertsPanelProps = {
  alerts: ProductionAlert[];
};

export default function ProductionAlertsPanel({ alerts }: ProductionAlertsPanelProps) {
  return (
    <section
      id="alerts"
      className="glass-panel rounded-2xl border border-brand-border p-4 md:p-5"
    >
      <header className="mb-4 border-b border-brand-border pb-3">
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-pink">
          Production Alerts
        </h2>
      </header>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-lg border px-3 py-2.5 ${statusAccentClass(alert.status)}`}
          >
            <p className="font-ui text-[0.56rem] font-bold uppercase tracking-[0.12em]">
              {alert.title}
            </p>
            <p className="mt-1 font-body text-xs leading-relaxed opacity-90">{alert.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
