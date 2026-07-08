"use client";

import Link from "next/link";
import { ChevronRight, KeyRound, Map, Radio, Timer } from "lucide-react";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

const TOOLS = [
  { href: COLEMAN_ROUTES.tuner, title: "TUNER", Icon: Radio },
  { href: COLEMAN_ROUTES.keyFinder, title: "KEY FINDER", Icon: KeyRound },
  { href: COLEMAN_ROUTES.metronome, title: "METRONOME", Icon: Timer },
  { href: COLEMAN_ROUTES.theoryRoadmap, title: "THEORY ROADMAP", Icon: Map },
] as const;

export default function ColemanExplore() {
  return (
    <section className="coleman-glass-panel">
      <h1 className="coleman-tool-title">EXPLORE</h1>
      <p className="coleman-tool-sub mb-4">Production worship musician tools</p>
      <div className="coleman-feature-grid">
        {TOOLS.map(({ href, title, Icon }) => (
          <Link key={href} href={href} className="coleman-feature-card coleman-icon-stroke">
            <div className="coleman-icon-pod">
              <Icon size={22} strokeWidth={1.25} />
            </div>
            <p className="coleman-feature-title">{title}</p>
            <ChevronRight size={14} className="coleman-feature-chevron" strokeWidth={1.25} />
          </Link>
        ))}
      </div>
    </section>
  );
}
