export const COLEMAN_ROUTES = {
  intro: "/enterprise/coleman",
  home: "/enterprise/coleman/home",
  tuner: "/enterprise/coleman/tuner",
  keyFinder: "/enterprise/coleman/key-finder",
  metronome: "/enterprise/coleman/metronome",
  theoryRoadmap: "/enterprise/coleman/theory-roadmap",
  explore: "/enterprise/coleman/explore",
  studio: "/enterprise/coleman/tuner",
  history: "/enterprise/coleman/history",
  library: "/enterprise/coleman/library",
} as const;

export type ColemanRoute = (typeof COLEMAN_ROUTES)[keyof typeof COLEMAN_ROUTES];

export const COLEMAN_API = {
  setlist: "/api/coleman/setlist",
  createTrack: "/api/coleman/track/create",
  /** @deprecated use createTrack */
  createTrackLegacy: "/api/coleman/setlist/track",
  uploadStem: (trackId: string) => `/api/coleman/track/upload-stem/${trackId}`,
  /** @deprecated use uploadStem */
  uploadStemLegacy: (trackId: string) => `/api/coleman/setlist/upload/${trackId}`,
  removeStem: (stemId: string) => `/api/coleman/stem/remove/${stemId}`,
  audioStream: (filename: string) => `/api/coleman/audio/${encodeURIComponent(filename)}`,
  history: "/api/coleman/history",
  recordPlay: "/api/coleman/history/play",
  theory: "/api/coleman/theory",
  recognize: "/api/coleman/recognize",
  health: "/api/coleman/health",
} as const;
