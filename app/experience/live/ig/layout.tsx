import type { ReactNode } from "react";

export default function IgLivePreviewLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh w-full overflow-hidden bg-black">{children}</div>;
}
