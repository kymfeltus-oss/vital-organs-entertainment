import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Monitor,
  Radio,
  Server,
  Signal,
  Wifi,
} from "lucide-react";
import type { ProductionMetric } from "@/lib/ops/production-dashboard-metrics";
import { statusAccentClass } from "@/lib/ops/production-dashboard-metrics";

const ICONS: Record<string, LucideIcon> = {
  "stream-status": Radio,
  "ingest-status": Signal,
  latency: Gauge,
  "dropped-frames": AlertTriangle,
  bitrate: Activity,
  resolution: Monitor,
  "outputs-active": Wifi,
  "api-status": Server,
};

type ProductionMetricCardsProps = {
  metrics: ProductionMetric[];
};

export default function ProductionMetricCards({ metrics }: ProductionMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.id] ?? Activity;
        return (
          <article
            key={metric.id}
            className={`rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${statusAccentClass(metric.status)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
              <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] opacity-80">
                {metric.label}
              </span>
            </div>
            <p className="mt-3 font-headline text-xl uppercase tracking-[0.06em] text-white">
              {metric.value}
            </p>
            <p className="mt-1 font-body text-[0.62rem] leading-snug opacity-75">
              {metric.helper}
            </p>
          </article>
        );
      })}
    </div>
  );
}
