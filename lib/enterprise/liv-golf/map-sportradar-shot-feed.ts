import type { OddsFeedPayload } from "@/lib/enterprise/liv-golf/process-odds-feed";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

export type SportradarShotFeedPayload = {
  event_type?: string;
  room_id?: string;
  bet_id?: string;
  question?: string;
  player?: {
    name?: string;
    id?: string;
  };
  shot_data?: {
    lie?: string;
    distance_remaining_yards?: number;
    hole_number?: number;
    video_asset_path?: string;
  };
};

export type AiPropGenerationInput = {
  room_id: string;
  player_name: string;
  lie_type: string;
  distance_to_hole?: number;
  hole_number?: number;
};

export function isActionableShotLie(lie: string | undefined): boolean {
  const normalized = lie?.trim().toLowerCase();
  return normalized === "bunker" || normalized === "rough";
}

export function mapSportradarShotToAiInput(
  feedData: SportradarShotFeedPayload,
): AiPropGenerationInput | null {
  const lieType = feedData.shot_data?.lie?.trim().toLowerCase();
  const playerName = feedData.player?.name?.trim();

  if (feedData.event_type !== "SHOT_RECORDED" || !isActionableShotLie(lieType) || !playerName) {
    return null;
  }

  return {
    room_id: feedData.room_id?.trim() || LIV_GOLF_TOUR_MAIN_ROOM,
    player_name: playerName,
    lie_type: lieType!,
    distance_to_hole: feedData.shot_data?.distance_remaining_yards,
    hole_number: feedData.shot_data?.hole_number,
  };
}

/** Map AI pipeline shot telemetry into the catalog odds-feed processor shape. */
export function mapAiInputToOddsFeedPayload(input: AiPropGenerationInput): OddsFeedPayload {
  if (input.lie_type === "bunker") {
    return {
      event_type: "PLAYER_SHOT_SITUATION",
      hole_context: {
        hole_number: input.hole_number,
        associated_room_id: input.room_id,
      },
      event_details: {
        lie_type: "bunker",
        player_name: input.player_name,
        live_scramble_odds_multiplier:
          input.distance_to_hole && input.distance_to_hole <= 30 ? 2.4 : 1.8,
      },
    };
  }

  return {
    event_type: "PLAYER_SHOT_SITUATION",
    hole_context: {
      hole_number: input.hole_number,
      associated_room_id: input.room_id,
    },
    event_details: {
      lie_type: "rough",
      player_name: input.player_name,
      live_scramble_odds_multiplier:
        input.distance_to_hole && input.distance_to_hole <= 150 ? 2.1 : 1.6,
    },
  };
}
