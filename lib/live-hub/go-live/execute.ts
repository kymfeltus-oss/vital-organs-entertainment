import {
  activateRestreamChannelsForGoLive,
  deactivateRestreamChannels,
} from "@/lib/live-hub/go-live/restream";
import {
  closePlatformLive,
  openPlatformLive,
} from "@/lib/live-hub/go-live/platform";
import { runVmixAdapterCommand } from "@/lib/live-hub/vmix/adapter";
import { isVmixAdapterFailure } from "@/lib/live-hub/vmix/types";

export type GoLiveExecutionStep = "restream" | "vmix" | "platform";

export type GoLiveExecutionResult =
  | {
      ok: true;
      activatedChannelIds: number[];
      vmixStreaming: boolean;
      platformLive: boolean;
    }
  | {
      ok: false;
      step: GoLiveExecutionStep;
      error: string;
      code: string;
    };

export type StopStreamResult =
  | { ok: true }
  | { ok: false; step: "vmix" | "platform"; error: string; code: string };

function appendRollbackNote(baseError: string, rollbackOk: boolean): string {
  if (rollbackOk) {
    return `${baseError} Restream channels deactivated (rollback).`;
  }
  return `${baseError} Restream rollback failed — verify destinations in Restream dashboard.`;
}

/**
 * Section 7 execution sequence:
 * 1. Activate Restream channels
 * 2. Start vMix streaming
 * 3. Open platform live flag for attendees
 *
 * Fail-closed: if step 2 or 3 fails after Restream activation, channels are deactivated.
 * If step 3 fails after vMix starts, vMix streaming is stopped before Restream rollback.
 */
export async function executeGoLiveSequence(): Promise<GoLiveExecutionResult> {
  const restreamResult = await activateRestreamChannelsForGoLive();
  if (!restreamResult.ok) {
    return {
      ok: false,
      step: "restream",
      error: restreamResult.error,
      code: restreamResult.code,
    };
  }

  const activatedChannelIds = restreamResult.activatedChannelIds;

  const vmixResult = await runVmixAdapterCommand({ type: "start_streaming" });
  if (isVmixAdapterFailure(vmixResult)) {
    const rollback = await deactivateRestreamChannels(activatedChannelIds);
    return {
      ok: false,
      step: "vmix",
      error: appendRollbackNote(vmixResult.error, rollback.ok),
      code: vmixResult.code,
    };
  }

  const platformResult = await openPlatformLive();
  if (!platformResult.ok) {
    await runVmixAdapterCommand({ type: "stop_streaming" });
    const rollback = await deactivateRestreamChannels(activatedChannelIds);
    return {
      ok: false,
      step: "platform",
      error: appendRollbackNote(platformResult.error, rollback.ok),
      code: platformResult.code,
    };
  }

  return {
    ok: true,
    activatedChannelIds,
    vmixStreaming: vmixResult.state.isStreaming,
    platformLive: true,
  };
}

/** Inverse sequence — stop encoder first, then close attendee platform. */
export async function executeStopStreamSequence(): Promise<StopStreamResult> {
  const vmixResult = await runVmixAdapterCommand({ type: "stop_streaming" });
  if (isVmixAdapterFailure(vmixResult)) {
    return {
      ok: false,
      step: "vmix",
      error: vmixResult.error,
      code: vmixResult.code,
    };
  }

  const platformResult = await closePlatformLive();
  if (!platformResult.ok) {
    return {
      ok: false,
      step: "platform",
      error: platformResult.error,
      code: platformResult.code,
    };
  }

  return { ok: true };
}
