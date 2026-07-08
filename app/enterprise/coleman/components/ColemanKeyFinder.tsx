"use client";

import { Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import { startColemanMicEngine } from "@/app/enterprise/coleman/lib/audio/coleman-mic-engine";

export default function ColemanKeyFinder() {
  const [active, setActive] = useState(false);
  const [detectedKey, setDetectedKey] = useState("—");
  const [error, setError] = useState<string | null>(null);
  const stopEngineRef = useRef<(() => void) | null>(null);

  const stopListening = useCallback(() => {
    stopEngineRef.current?.();
    stopEngineRef.current = null;
    setActive(false);
    setDetectedKey("—");
  }, []);

  useEffect(() => {
    return () => {
      stopEngineRef.current?.();
      stopEngineRef.current = null;
    };
  }, []);

  const startListening = () => {
    setError(null);
    stopEngineRef.current?.();

    stopEngineRef.current = startColemanMicEngine({
      onFrame: (frame) => {
        setDetectedKey(frame.currentKey ?? "—");
      },
      onError: (message) => {
        setError(message);
        stopListening();
      },
    });

    setActive(true);
    setDetectedKey("—");
  };

  return (
    <section className="coleman-glass-panel coleman-tool-panel">
      <h1 className="coleman-tool-title">KEY FINDER</h1>
      <p className="coleman-tool-sub">Detect the tonal center from live audio</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      <div
        id="coleman-key-finder-tool-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="coleman-key-display"
      >
        {detectedKey === "—" ? "No key detected" : `Detected key ${detectedKey}`}
      </div>

      <button
        type="button"
        className={`coleman-primary-btn coleman-icon-stroke${active ? " is-active" : ""}`}
        onClick={() => (active ? stopListening() : startListening())}
      >
        {active ? <MicOff size={18} strokeWidth={1.25} /> : <Mic size={18} strokeWidth={1.25} />}
        {active ? "STOP DETECTING" : "DETECT KEY"}
      </button>
    </section>
  );
}
