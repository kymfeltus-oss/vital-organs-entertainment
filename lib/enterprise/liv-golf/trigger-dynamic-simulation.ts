import { getClientAppUrl } from "@/lib/client-api";
import { buildSimulationVideoPath } from "@/lib/enterprise/liv-golf/simulation-video-path";

export type DynamicSimulationParams = {
  playerKey: string;
  playerDisplayName: string;
  lieType: string;
  betId: string;
  questionText: string;
  roomId?: string;
  holeNumber?: number;
  distanceRemainingYards?: number;
};

export type DynamicSimulationResult = {
  success: boolean;
  status?: string;
  active_prop?: string;
  auto_launched_bet?: string;
  video_asset_path?: string;
  error?: string;
};

const DEV_BYPASS_SIGNATURE =
  process.env.NEXT_PUBLIC_LIV_ODDS_WEBHOOK_DEV_TOKEN?.trim() ??
  "4778_liv_golf_test_bypass_token";

const DEFAULT_ROOM_ID = "00000000-0000-0000-0000-000000000000";

/** Dynamic structural function to invoke specific player scenarios on-demand via odds-feed webhook. */
export async function triggerDynamicSimulation(
  playerKey: string,
  playerDisplayName: string,
  lieType: string,
  betId: string,
  questionText: string,
  options: Omit<DynamicSimulationParams, "playerKey" | "playerDisplayName" | "lieType" | "betId" | "questionText"> = {},
): Promise<DynamicSimulationResult> {
  return triggerDynamicSimulationRequest({
    playerKey,
    playerDisplayName,
    lieType,
    betId,
    questionText,
    ...options,
  });
}

export async function triggerDynamicSimulationRequest(
  params: DynamicSimulationParams,
): Promise<DynamicSimulationResult> {
  const videoAssetPath = buildSimulationVideoPath(params.playerKey);

  const response = await fetch(
    `${getClientAppUrl()}/api/enterprise/liv-golf/webhooks/odds-feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sportradar-Signature": DEV_BYPASS_SIGNATURE,
      },
      body: JSON.stringify({
        event_type: "SHOT_RECORDED",
        room_id: params.roomId ?? DEFAULT_ROOM_ID,
        bet_id: params.betId,
        question: params.questionText,
        player: { name: params.playerDisplayName },
        shot_data: {
          lie: params.lieType,
          hole_number: params.holeNumber,
          distance_remaining_yards: params.distanceRemainingYards,
          video_asset_path: videoAssetPath,
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as DynamicSimulationResult & {
    message?: string;
  };

  if (!response.ok) {
    return {
      success: false,
      error: payload.error ?? payload.message ?? `Simulation dispatch failed (${response.status}).`,
    };
  }

  return {
    success: true,
    status: payload.status,
    active_prop: payload.active_prop ?? payload.auto_launched_bet,
    auto_launched_bet: payload.auto_launched_bet,
    video_asset_path: videoAssetPath,
  };
}
