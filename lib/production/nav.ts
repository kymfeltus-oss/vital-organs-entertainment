import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clapperboard,
  CreditCard,
  Film,
  Gauge,
  Key,
  LayoutDashboard,
  ListOrdered,
  Radio,
  Server,
  Settings,
  Share2,
  Shield,
  Users,
  Video,
  Workflow,
} from "lucide-react";

export type ProductionNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
};

export type ProductionNavSection = {
  id: string;
  label: string;
  items: ProductionNavItem[];
};

export const PRODUCTION_NAV_SECTIONS: ProductionNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Overview",
        href: "/production-dashboard",
        icon: LayoutDashboard,
        available: true,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "streams", label: "Streams", href: "/production/streams", icon: Video, available: false },
      {
        id: "broadcast-studio",
        label: "Broadcast Studio",
        href: "/production/broadcast-studio",
        icon: Clapperboard,
        available: false,
      },
      {
        id: "preshow",
        label: "Pre Show",
        href: "/production/preshow",
        icon: Workflow,
        available: true,
      },
      {
        id: "destinations",
        label: "Destinations",
        href: "/production/destinations",
        icon: Share2,
        available: false,
      },
      {
        id: "recordings",
        label: "Recordings",
        href: "/production/recordings",
        icon: Film,
        available: false,
      },
      {
        id: "schedules",
        label: "Schedules",
        href: "/production/schedules",
        icon: Calendar,
        available: false,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "workers", label: "Workers", href: "/production/workers", icon: Server, available: false },
      { id: "queues", label: "Queues", href: "/production/queues", icon: ListOrdered, available: false },
      { id: "health", label: "Health", href: "/production/health", icon: Activity, available: false },
      { id: "sound", label: "Sound Control", href: "/production/sound-control", icon: Radio, available: false },
      { id: "go-live", label: "Go Live", href: "/production/go-live", icon: Gauge, available: false },
      { id: "countdown", label: "Countdown", href: "/production/countdown", icon: Calendar, available: false },
      { id: "incident", label: "Incident", href: "/dashboard/incidents", icon: AlertTriangle, available: true },
    ],
  },
  {
    id: "observability",
    label: "Observability",
    items: [
      { id: "alerts", label: "Alerts", href: "/production/alerts", icon: AlertTriangle, available: false },
      { id: "metrics", label: "Metrics", href: "/production/metrics", icon: BarChart3, available: false },
      { id: "audit", label: "Audit", href: "/production/audit", icon: Shield, available: false },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "users", label: "Users", href: "/production/users", icon: Users, available: false },
      { id: "api-keys", label: "API Keys", href: "/production/api-keys", icon: Key, available: false },
      { id: "billing", label: "Usage & Plans", href: "/production/billing", icon: CreditCard, available: false },
      { id: "settings", label: "Settings", href: "/production/settings", icon: Settings, available: false },
    ],
  },
];

export const PRODUCTION_TENANT_LABEL = "300 Awakening";

export function findProductionNavItem(pathname: string): ProductionNavItem | null {
  for (const section of PRODUCTION_NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return item;
      }
    }
  }
  return null;
}
