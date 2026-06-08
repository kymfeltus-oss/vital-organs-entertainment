import type { VmixAdapterResult, VmixCommand } from "@/lib/live-hub/vmix/types";

async function parseJsonResponse(response: Response): Promise<VmixAdapterResult> {
  const payload = (await response.json()) as VmixAdapterResult;

  if (!response.ok && payload.ok !== true) {
    return {
      ok: false,
      error: payload.ok === false ? payload.error : "vMix request failed.",
      code: payload.ok === false ? payload.code : "VMIX_REQUEST_FAILED",
    };
  }

  return payload;
}

export async function fetchVmixState(): Promise<VmixAdapterResult> {
  const response = await fetch("/api/ops/live-hub/vmix", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return parseJsonResponse(response);
}

export async function sendVmixCommand(command: VmixCommand): Promise<VmixAdapterResult> {
  const response = await fetch("/api/ops/live-hub/vmix", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
    cache: "no-store",
  });

  return parseJsonResponse(response);
}
