import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Camera,
  CircleHelp,
  Film,
  LayoutDashboard,
  Mic2,
  MonitorPlay,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import { TODAYS_SERVICE_SHELL as SHELL } from "@/lib/todays-service/shell-styles";
import TodaysServiceMain from "@/components/todays-service/TodaysServiceMain";

const NAV = [
  { href: "/dashboard/todays-service", label: "Today's Service", icon: LayoutDashboard, active: true },
  { href: "/dashboard/todays-service#sound", label: "Sound Check", icon: Mic2 },
  { href: "/dashboard/todays-service#cameras", label: "Cameras", icon: Camera },
  { href: "/dashboard/todays-service#presentation", label: "Presentation", icon: MonitorPlay },
  { href: "/dashboard/todays-service#streaming", label: "Livestream", icon: Radio },
  { href: "/dashboard/todays-service#recording", label: "Recording", icon: Film },
  { href: "/dashboard/todays-service#timeline", label: "Schedule", icon: Calendar },
  { href: "/dashboard/todays-service#team", label: "Team", icon: Users },
  { href: "/dashboard/todays-service#alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/ops", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/broadcast", label: "Settings", icon: Settings },
  { href: "/dashboard/todays-service", label: "Help", icon: CircleHelp },
] as const;

type TodaysServiceShellProps = {
  operatorEmail: string;
  churchName?: string;
  children: React.ReactNode;
};

/** Server-rendered production shell — sidebar nav without client JavaScript. */
export default function TodaysServiceShell({
  operatorEmail,
  churchName = "Grace Community Church",
  children,
}: TodaysServiceShellProps) {
  const displayName = operatorEmail.split("@")[0]?.replace(/[._]/g, " ") ?? "Volunteer";

  return (
    <div className={`app-shell flex h-dvh overflow-hidden ${SHELL.page}`}>
      <aside className={`hidden lg:flex ${SHELL.sidebar}`} aria-label="Production sidebar">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#53fc18]/20 font-headline text-lg text-[#53fc18]">
            P
          </div>
          <span className="font-headline text-lg uppercase tracking-[0.22em] text-[#00f2ff]">Parable</span>
        </div>

        <nav aria-label="Production navigation" className="flex-1 space-y-0.5 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${SHELL.sidebarLink} ${"active" in item && item.active ? SHELL.sidebarActive : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#111111] font-ui text-[0.55rem] font-bold uppercase text-white/70">
              {displayName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-body text-[0.72rem] text-white/90">{churchName}</p>
              <p className="truncate font-ui text-[0.48rem] uppercase tracking-[0.06em] text-neutral-400">
                {displayName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <TodaysServiceMain className={SHELL.main}>{children}</TodaysServiceMain>
    </div>
  );
}
