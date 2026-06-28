"use client";

import { create } from "zustand";

export type DestinationKey = "twitch" | "youtube" | "facebook";

const VIDEO_HUB_CONTROL_STORAGE_KEY = "300-awakening-video-hub-control-v1";

type PersistedVideoHubControlState = {
  chatEnabled: boolean;
  slowMode: boolean;
  dvrEnabled: boolean;
  destinations: Record<DestinationKey, boolean>;
};

type VideoHubControlState = {
  chatEnabled: boolean;
  slowMode: boolean;
  dvrEnabled: boolean;
  destinations: Record<DestinationKey, boolean>;
  hydrate: (state: {
    chatEnabled?: boolean;
    chatSlowMode?: boolean;
    dvrBufferEnabled?: boolean;
    restreamDestinations?: Partial<Record<DestinationKey, boolean>>;
  }) => void;
  setChatEnabled: (enabled: boolean) => void;
  setSlowMode: (enabled: boolean) => void;
  setDvrEnabled: (enabled: boolean) => void;
  setDestinationEnabled: (destination: DestinationKey, enabled: boolean) => void;
};

const defaultControlState: PersistedVideoHubControlState = {
  chatEnabled: true,
  slowMode: true,
  dvrEnabled: true,
  destinations: {
    twitch: true,
    youtube: true,
    facebook: true,
  },
};

function sanitizePersistedState(value: unknown): PersistedVideoHubControlState {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const destinations =
    record.destinations && typeof record.destinations === "object"
      ? (record.destinations as Partial<Record<DestinationKey, unknown>>)
      : {};

  return {
    chatEnabled:
      typeof record.chatEnabled === "boolean" ? record.chatEnabled : defaultControlState.chatEnabled,
    slowMode: typeof record.slowMode === "boolean" ? record.slowMode : defaultControlState.slowMode,
    dvrEnabled:
      typeof record.dvrEnabled === "boolean" ? record.dvrEnabled : defaultControlState.dvrEnabled,
    destinations: {
      twitch:
        typeof destinations.twitch === "boolean"
          ? destinations.twitch
          : defaultControlState.destinations.twitch,
      youtube:
        typeof destinations.youtube === "boolean"
          ? destinations.youtube
          : defaultControlState.destinations.youtube,
      facebook:
        typeof destinations.facebook === "boolean"
          ? destinations.facebook
          : defaultControlState.destinations.facebook,
    },
  };
}

function readPersistedControlState(): PersistedVideoHubControlState {
  if (typeof window === "undefined") return defaultControlState;
  try {
    const stored = window.localStorage.getItem(VIDEO_HUB_CONTROL_STORAGE_KEY);
    return stored ? sanitizePersistedState(JSON.parse(stored)) : defaultControlState;
  } catch {
    return defaultControlState;
  }
}

function writePersistedControlState(state: PersistedVideoHubControlState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      VIDEO_HUB_CONTROL_STORAGE_KEY,
      JSON.stringify(sanitizePersistedState(state)),
    );
  } catch {
    try {
      window.sessionStorage?.setItem(
        VIDEO_HUB_CONTROL_STORAGE_KEY,
        JSON.stringify(sanitizePersistedState(state)),
      );
    } catch {
      return;
    }
  }
}

const initialControlState = readPersistedControlState();

export const useVideoHubControlStore = create<VideoHubControlState>((set, get) => ({
  ...initialControlState,
  hydrate: (state) =>
    set((current) => {
      const next = {
        chatEnabled:
          typeof state.chatEnabled === "boolean" ? state.chatEnabled : current.chatEnabled,
        slowMode:
          typeof state.chatSlowMode === "boolean" ? state.chatSlowMode : current.slowMode,
        dvrEnabled:
          typeof state.dvrBufferEnabled === "boolean" ? state.dvrBufferEnabled : current.dvrEnabled,
        destinations: {
          twitch:
            typeof state.restreamDestinations?.twitch === "boolean"
              ? state.restreamDestinations.twitch
              : current.destinations.twitch,
          youtube:
            typeof state.restreamDestinations?.youtube === "boolean"
              ? state.restreamDestinations.youtube
              : current.destinations.youtube,
          facebook:
            typeof state.restreamDestinations?.facebook === "boolean"
              ? state.restreamDestinations.facebook
              : current.destinations.facebook,
        },
      };
      writePersistedControlState(next);
      return next;
    }),
  setChatEnabled: (enabled) =>
    set((state) => {
      const next = { ...state, chatEnabled: enabled };
      writePersistedControlState(next);
      return { chatEnabled: enabled };
    }),
  setSlowMode: (enabled) =>
    set((state) => {
      const next = { ...state, slowMode: enabled };
      writePersistedControlState(next);
      return { slowMode: enabled };
    }),
  setDvrEnabled: (enabled) =>
    set((state) => {
      const next = { ...state, dvrEnabled: enabled };
      writePersistedControlState(next);
      return { dvrEnabled: enabled };
    }),
  setDestinationEnabled: (destination, enabled) =>
    set((state) => {
      const destinations = {
        ...state.destinations,
        [destination]: enabled,
      };
      writePersistedControlState({ ...state, destinations });
      return { destinations };
    }),
}));
