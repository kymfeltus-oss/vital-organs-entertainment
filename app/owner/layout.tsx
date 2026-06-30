"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sliders, 
  Tv, 
  Layers, 
  Timer, 
  Radio
} from "lucide-react";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigationItems = [
    { name: "Pre-Flight Setup", href: "/owner/show-setup", icon: Sliders },
    { name: "Pre-Show Deck", href: "/owner/pre-show", icon: Timer },
    { name: "Production Cockpit", href: "/owner/cockpit", icon: Radio },
    { name: "Graphics Suite", href: "/owner/graphics", icon: Layers },
  ];

  return (
    <div className="flex min-h-screen bg-[#020203] text-white">
      {/* PERSISTENT LEFT SIDEBAR */}
      <aside className="w-64 border-r border-white/10 bg-[#050814]/90 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Brand/Identity Frame */}
          <div className="px-2 py-3 border-b border-white/5">
            <h2 className="font-headline text-lg uppercase tracking-wider text-[#00a8ff]">
              Broadcast Core
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-ui mt-0.5">
              Control System v2.0
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-ui text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-[#00a8ff]"
                      : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Footprint Telemetry */}
        <div className="rounded-md border border-white/5 bg-black/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-widest text-lime-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
            Core Synced
          </div>
        </div>
      </aside>

      {/* DYNAMIC COMPONENT DISPLAY PAGE AREA */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}