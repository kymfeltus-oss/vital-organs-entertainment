import type { ReactNode } from "react";
import ParableProductionRoot from "@/components/parable/ParableProductionRoot";

export default function TodaysServiceLayout({ children }: { children: ReactNode }) {
  return <ParableProductionRoot>{children}</ParableProductionRoot>;
}
