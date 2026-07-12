import type { LiveMarket } from "./types";

/** @deprecated Legacy mock props — retained for reference only; overlay uses production catalog. */
export const MOCK_MARKETS: LiveMarket[] = [
  {
    id: "m1",
    player: {
      name: "Cameron Smith",
      team: "Rippers GC",
      teamColor: "#FF5722",
      image:
        "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=96&h=96&q=80",
    },
    question: "Will Cameron Smith make this 12ft Birdie putt on Hole 14?",
    selections: [
      { id: "s1_yes", name: "YES", multiplier: 1.85 },
      { id: "s1_no", name: "NO", multiplier: 2.1 },
    ],
    stakeAmount: 10,
    payoutAmount: 50,
    windowSeconds: 15,
  },
  {
    id: "m2",
    player: {
      name: "Brooks Koepka",
      team: "Smash GC",
      teamColor: "#CCFF00",
      image:
        "https://images.unsplash.com/photo-1535131749006-b7f58c990342?auto=format&fit=crop&w=96&h=96&q=80",
    },
    question: "Where will Brooks Koepka's approach shot land?",
    selections: [
      { id: "s2_green", name: "GREEN", multiplier: 1.5 },
      { id: "s2_fairway", name: "FAIRWAY", multiplier: 2.2 },
      { id: "s2_rough", name: "ROUGH", multiplier: 3.4 },
      { id: "s2_sand", name: "SAND", multiplier: 5.5 },
    ],
    stakeAmount: 20,
    payoutAmount: 60,
    windowSeconds: 20,
  },
  {
    id: "m3",
    player: {
      name: "Dustin Johnson",
      team: "4 Aces GC",
      teamColor: "#00E5FF",
      image:
        "https://images.unsplash.com/photo-1587174480993-aa34873beed8?auto=format&fit=crop&w=96&h=96&q=80",
    },
    question: "Which team secures the lowest score on Hole 14?",
    selections: [
      { id: "s3_4aces", name: "4 ACES", multiplier: 2.4 },
      { id: "s3_crushers", name: "CRUSHERS", multiplier: 2.8 },
      { id: "s3_fireballs", name: "FIREBALLS", multiplier: 3.1 },
    ],
    stakeAmount: 25,
    payoutAmount: 100,
    windowSeconds: 25,
  },
];

export const FAN_USER_ID = "liv_fan_99";

/** @deprecated Use FAN_USER_ID */
export const DEMO_USER_ID = FAN_USER_ID;
