import type { OpsLivePreviewPayload } from "@/lib/live-hub/preview";

export async function fetchOpsLivePreview(): Promise<OpsLivePreviewPayload> {
  const response = await fetch("/api/ops/live-hub/preview", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = (await response.json().catch(() => null)) as
      | OpsLivePreviewPayload
      | null;
    if (fallback) return fallback;
    throw new Error("Unable to load ops live preview.");
  }

  return (await response.json()) as OpsLivePreviewPayload;
}
