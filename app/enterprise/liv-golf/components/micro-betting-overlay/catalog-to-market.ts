import type { LiveMicroBetPayload } from "@/lib/live/types";
import { findLegendaryShowcaseScenario } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import type { LiveMarket } from "./types";
import { LIV_MICRO_BET_WINDOW_SECONDS } from "./session-utils";

type PlayerDisplay = LiveMarket["player"];

const BET_PLAYER_DISPLAY: Record<string, PlayerDisplay> = {
  "bryson-drive": {
    name: "Bryson DeChambeau",
    team: "Crushers GC",
    teamColor: "#CCFF00",
    image:
      "https://images.unsplash.com/photo-1535131749006-b7f58c990342?auto=format&fit=crop&w=96&h=96&q=80",
  },
  "brooks-putt": {
    name: "Brooks Koepka",
    team: "Smash GC",
    teamColor: "#CCFF00",
    image:
      "https://images.unsplash.com/photo-1587174480993-aa34873beed8?auto=format&fit=crop&w=96&h=96&q=80",
  },
  "cam-eagle": {
    name: "Cameron Smith",
    team: "Ripper GC",
    teamColor: "#FF5722",
    image:
      "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=96&h=96&q=80",
  },
  "team-aces": {
    name: "4 Aces GC",
    team: "Team Prop",
    teamColor: "#00E5FF",
    image:
      "https://images.unsplash.com/photo-1587174480993-aa34873beed8?auto=format&fit=crop&w=96&h=96&q=80",
  },
  "crushers-hole-16": {
    name: "Crushers GC",
    team: "Team Prop",
    teamColor: "#CCFF00",
    image:
      "https://images.unsplash.com/photo-1535131749006-b7f58c990342?auto=format&fit=crop&w=96&h=96&q=80",
  },
  "tyrell-sand-save": {
    name: "Tyrrell Hatton",
    team: "Legion XIII",
    teamColor: "#E040FB",
    image:
      "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=96&h=96&q=80",
  },
};

const DEFAULT_PLAYER: PlayerDisplay = {
  name: "LIV Digital Tour",
  team: "Live Prop",
  teamColor: "#CCFF00",
  image:
    "https://images.unsplash.com/photo-1535131749006-b7f58c990342?auto=format&fit=crop&w=96&h=96&q=80",
};

function impliedMultiplier(stake: number, payout: number): number {
  if (stake <= 0) return 1;
  return Number.parseFloat((payout / stake).toFixed(2));
}

/** Map authoritative `LiveMicroBetPayload` into overlay card props. */
export function activeBetToLiveMarket(
  bet: LiveMicroBetPayload,
  windowSeconds = LIV_MICRO_BET_WINDOW_SECONDS,
): LiveMarket {
  const showcase = findLegendaryShowcaseScenario(bet.bet_id);

  const player: PlayerDisplay = showcase
    ? {
        name: showcase.playerName,
        team: showcase.teamName,
        teamColor: showcase.teamColor,
        image: showcase.playerImage,
      }
    : bet.player_name
      ? {
          name: bet.player_name,
          team: bet.team_name ?? "Live Prop",
          teamColor: bet.team_color ?? "#CCFF00",
          image: bet.player_image ?? DEFAULT_PLAYER.image,
        }
      : (BET_PLAYER_DISPLAY[bet.bet_id] ?? DEFAULT_PLAYER);

  const selections =
    bet.selection_labels && bet.selection_labels.length > 0
      ? bet.selection_labels.map((label) => ({
          id: label.id,
          name: label.name,
          multiplier: label.multiplier,
        }))
      : bet.options.map((option) => ({
          id: `${bet.bet_id}-${option.toLowerCase()}`,
          name: option.toUpperCase(),
          multiplier: impliedMultiplier(bet.stake_amount, bet.payout_amount),
        }));

  return {
    id: bet.bet_id,
    player,
    question: bet.question,
    selections,
    stakeAmount: bet.stake_amount,
    payoutAmount: bet.payout_amount,
    windowSeconds: showcase?.wageringWindowSeconds ?? windowSeconds,
  };
}
