import type { InternetDetectResult } from "@/lib/internet/types";

type NavigatorConnection = {
  type?: string;
  effectiveType?: string;
  downlink?: number;
};

function readBrowserLinkType(): string | null {
  if (typeof navigator === "undefined" || !("connection" in navigator)) return null;
  const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection;
  const type = connection?.type?.trim();
  if (type === "wifi" || type === "ethernet") return type;
  return null;
}

/** Client-side hints merged with server agent detection. */
export function mergeBrowserDetect(agent: InternetDetectResult): InternetDetectResult {
  const browserOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const linkType = readBrowserLinkType();

  return {
    ...agent,
    online: agent.online || (browserOnline && agent.internetReachable),
    connectionType: agent.connectionType ?? (linkType as InternetDetectResult["connectionType"]),
  };
}

export function readBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
