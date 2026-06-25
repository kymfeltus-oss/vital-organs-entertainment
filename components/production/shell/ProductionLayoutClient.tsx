"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ProductionAppShell from "@/components/production/shell/ProductionAppShell";

type ProductionLayoutClientProps = {
  children: ReactNode;
  operatorEmail: string;
};

export default function ProductionLayoutClient({
  children,
  operatorEmail,
}: ProductionLayoutClientProps) {
  const pathname = usePathname();
  const isPreshow = pathname.startsWith("/production/preshow");

  return (
    <ProductionAppShell
      operatorEmail={operatorEmail}
      title={isPreshow ? "Pre Show Setup" : "Production"}
      hideHeader={false}
    >
      {children}
    </ProductionAppShell>
  );
}
