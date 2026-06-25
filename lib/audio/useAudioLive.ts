"use client";

import { useEffect, useRef } from "react";
import { buildAudioLiveWsUrl } from "@/lib/audio/api";
import { useAudioStore } from "@/lib/audio/store";

const MAX_BACKOFF_MS = 30_000;

export function useAudioLive(enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const timerRef = useRef<number | null>(null);
  const applyLiveSnapshot = useAudioStore((state) => state.applyLiveSnapshot);
  const setConnection = useAudioStore((state) => state.setConnection);
  const setError = useAudioStore((state) => state.setError);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setConnection("reconnecting");
      const ws = new WebSocket(buildAudioLiveWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
        setConnection("connected");
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type?: string;
            payload?: Record<string, unknown>;
          };
          if (message.payload) {
            applyLiveSnapshot(message.payload);
          }
        } catch {
          setError("Unable to parse audio live feed.");
        }
      };

      ws.onerror = () => {
        setError("Audio live feed connection error.");
      };

      ws.onclose = () => {
        setConnection("disconnected");
        if (cancelled) return;
        timerRef.current = window.setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
          connect();
        }, backoffRef.current);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [applyLiveSnapshot, enabled, setConnection, setError]);
}
