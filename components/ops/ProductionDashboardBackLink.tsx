import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";

type ProductionDashboardBackLinkProps = {
  className?: string;
};

export default function ProductionDashboardBackLink({
  className = "",
}: ProductionDashboardBackLinkProps) {
  return (
    <Link
      href={OPS_HOME_PATH}
      prefetch={false}
      className={`inline-flex min-h-10 items-center gap-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted transition hover:text-brand-blue ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Production Dashboard
    </Link>
  );
}
