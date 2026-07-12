"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LIV_MODULE_NAV_SAFE } from "@/lib/enterprise/liv-golf/responsive";
import { cn } from "@/lib/utils";

const MODULES = [
  { label: "Tournaments", href: "/enterprise/liv-golf" },
  { label: "Players", href: "/enterprise/liv-golf" },
  { label: "Streaming", href: "/enterprise/liv-golf/streaming/setup" },
  { label: "Commerce", href: "/enterprise/liv-golf" },
  { label: "Sponsors", href: "/enterprise/liv-golf" },
  { label: "Analytics", href: "/enterprise/liv-golf/command-center" },
  { label: "Settings", href: "/enterprise/liv-golf" },
] as const;

export default function ModuleNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Executive module navigation"
      className={`grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-7 ${LIV_MODULE_NAV_SAFE}`}
    >
      {MODULES.map(({ label, href }, index) => {
        const isActive = pathname === href || (label === "Streaming" && pathname.startsWith(href));

        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "group relative rounded-full border border-[#2A2A2A] bg-[#111111]/80 px-3 py-2.5 text-center transition-all duration-300 sm:px-4 sm:py-3",
              "hover:-translate-y-0.5 hover:border-[#00F2FF]/45 hover:bg-[#141414] hover:shadow-[0_0_20px_rgba(0,242,255,0.07)]",
              (index === 0 || isActive) && "border-[#00F2FF]/25",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                isActive ? "text-white" : "text-[#A9B1BC] group-hover:text-white",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </motion.nav>
  );
}
