import Link from "next/link";

export default function ReadOnlyDashboardNotice() {
  return (
    <footer className="glass-panel rounded-2xl border border-brand-border/80 p-4 md:p-5">
      <p className="font-body text-sm text-brand-muted">
        This dashboard is metrics-only. Configuration, countdown editing, and go-live controls
        remain in their dedicated production tools.
      </p>
      <nav
        className="mt-3 flex flex-wrap gap-3 font-ui text-[0.56rem] font-bold uppercase tracking-[0.14em]"
        aria-label="Production tool links"
      >
        <Link href="/ops/countdown" className="text-brand-blue transition hover:text-white">
          Countdown Admin
        </Link>
        <Link href="/dashboard/broadcast" className="text-brand-blue transition hover:text-white">
          Broadcast Desk
        </Link>
        <Link href="/ops/live-hub" className="text-brand-blue transition hover:text-white">
          Live Hub
        </Link>
      </nav>
    </footer>
  );
}
