"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LIVE_HUB_NETWORK_SETTINGS,
  loadLiveHubNetworkSettings,
  saveLiveHubNetworkSettings,
  type LiveHubNetworkSettings,
} from "@/lib/live-hub/network-settings";

export function useLiveHubNetworkSettings(): [
  LiveHubNetworkSettings,
  (patch: Partial<LiveHubNetworkSettings>) => void,
  (next: LiveHubNetworkSettings) => void,
] {
  const [settings, setSettings] = useState<LiveHubNetworkSettings>(
    DEFAULT_LIVE_HUB_NETWORK_SETTINGS,
  );

  useEffect(() => {
    setSettings(loadLiveHubNetworkSettings());
  }, []);

  const patchSettings = useCallback((patch: Partial<LiveHubNetworkSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveLiveHubNetworkSettings(next);
      return next;
    });
  }, []);

  const replaceSettings = useCallback((next: LiveHubNetworkSettings) => {
    saveLiveHubNetworkSettings(next);
    setSettings(next);
  }, []);

  return [settings, patchSettings, replaceSettings];
}
