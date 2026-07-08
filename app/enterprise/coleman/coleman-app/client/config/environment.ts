import { Platform } from "react-native";

import { API_BASE_URL } from "./environment.shared";

export { API_BASE_URL };

export const COLEMAN_WEB_ROUTES = {
  tuner: `${API_BASE_URL}/enterprise/coleman/tuner`,
  keyFinder: `${API_BASE_URL}/enterprise/coleman/key-finder`,
  metronome: `${API_BASE_URL}/enterprise/coleman/metronome`,
  theoryRoadmap: `${API_BASE_URL}/enterprise/coleman/theory-roadmap`,
  explore: `${API_BASE_URL}/enterprise/coleman/explore`,
  history: `${API_BASE_URL}/enterprise/coleman/history`,
  library: `${API_BASE_URL}/enterprise/coleman/library`,
  home: `${API_BASE_URL}/enterprise/coleman/home`,
} as const;

export const COLEMAN_API = {
  setlist: `${API_BASE_URL}/api/coleman/setlist`,
  createTrack: `${API_BASE_URL}/api/coleman/setlist/track`,
  uploadStem: (trackId: string) =>
    `${API_BASE_URL}/api/coleman/setlist/upload/${trackId}`,
  audioStream: (filename: string) =>
    `${API_BASE_URL}/api/coleman/audio/${encodeURIComponent(filename)}`,
  history: `${API_BASE_URL}/api/coleman/history`,
  theory: `${API_BASE_URL}/api/coleman/theory`,
  health: `${API_BASE_URL}/api/coleman/health`,
} as const;
