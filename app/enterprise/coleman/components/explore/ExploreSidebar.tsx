"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Music2,
  Radio,
  Settings,
  Timer,
} from "lucide-react";

import {
  useExploreStudio,
  type ExploreNavId,
} from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";
import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

type ExploreNavItem = {
  id: ExploreNavId;
  label: string;
  labelLines: string[];
  Icon: typeof Timer;
  href?: string;
  hash?: string;
};

const TOP_NAV: ExploreNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    labelLines: ["Dashboard"],
    Icon: LayoutDashboard,
    href: COLEMAN_ROUTES.home,
  },
  { id: "tuner", label: "Tuner", labelLines: ["Tuner"], Icon: Radio, hash: "#tuner" },
  {
    id: "metronome",
    label: "Metronome",
    labelLines: ["Metronome"],
    Icon: Timer,
    hash: "#metronome",
  },
  {
    id: "theory",
    label: "Theory Roadmap",
    labelLines: ["Theory", "Roadmap"],
    Icon: Map,
    hash: "#theory",
  },
];

const BOTTOM_NAV: ExploreNavItem[] = [
  { id: "tracks", label: "Tracks", labelLines: ["Tracks"], Icon: Music2, href: COLEMAN_ROUTES.library },
  { id: "settings", label: "Settings", labelLines: ["Settings"], Icon: Settings, href: COLEMAN_ROUTES.history },
];

function ExploreRailButton({
  item,
  active,
  onSelect,
}: {
  item: ExploreNavItem;
  active: boolean;
  onSelect: (item: ExploreNavItem) => void;
}) {
  const { Icon } = item;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`exo-nav-item${active ? " is-active" : ""}`}
      aria-label={item.label}
    >
      <Icon size={24} strokeWidth={1.35} />
      <span>
        {item.labelLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </button>
  );
}

export default function ExploreSidebar() {
  const router = useRouter();
  const { activeNav, setActiveNav } = useExploreStudio();

  const handleNav = (item: ExploreNavItem) => {
    setActiveNav(item.id);
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.hash) {
      document.querySelector(item.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="exo-sidebar">
      <nav className="exo-nav-top" aria-label="Explore tools">
        {TOP_NAV.map((item) => (
          <ExploreRailButton
            key={item.id}
            item={item}
            active={activeNav === item.id}
            onSelect={handleNav}
          />
        ))}
      </nav>

      <nav className="exo-nav-bottom" aria-label="Explore secondary tools">
        {BOTTOM_NAV.map((item) => (
          <ExploreRailButton
            key={item.id}
            item={item}
            active={activeNav === item.id}
            onSelect={handleNav}
          />
        ))}
      </nav>

      <div className="exo-side-brand">
        <Link href={COLEMAN_ROUTES.home} aria-label="Coleman home">
          <span className="exo-side-mark">C</span>
          <span className="exo-side-name">Coleman</span>
        </Link>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
