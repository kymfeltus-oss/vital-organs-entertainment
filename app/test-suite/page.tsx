"use client";

import { useState } from "react";

type TestStatus = "SUCCESS" | "FAILED" | "PENDING";

type TestLog = {
  timestamp: string;
  endpoint: string;
  status: TestStatus;
  payload: string;
};

function stringifyPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload, null, 2);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown integration failure.";
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function appendTimestamp(): string {
  return new Date().toISOString().split("T")[1]?.slice(0, 8) ?? "00:00:00";
}

export default function IntegrationTestSuitePage() {
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const appendLog = (endpoint: string, status: TestStatus, payload: unknown) => {
    const newLog: TestLog = {
      timestamp: appendTimestamp(),
      endpoint,
      status,
      payload: stringifyPayload(payload),
    };
    setLogs((current) => [newLog, ...current]);
  };

  const executeLivePipelineDiagnostic = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setLogs([]);

    appendLog("/api/owner/devices", "PENDING", "Dispatching device inventory query.");
    try {
      const response = await fetch("/api/owner/devices", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await parseJson(response);
      if (!response.ok || data.success !== true) {
        throw new Error(typeof data.error === "string" ? data.error : "Device endpoint failed.");
      }
      const devices = Array.isArray(data.devices) ? data.devices : [];
      appendLog("/api/owner/devices", "SUCCESS", { devicesFound: devices.length, data });
    } catch (error) {
      appendLog("/api/owner/devices", "FAILED", errorMessage(error));
    }

    appendLog(
      "/api/owner/audio/mix-state",
      "PENDING",
      "Attempting channel patch mutation transaction.",
    );
    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: "300-awakening",
          targetType: "CHANNEL",
          channelId: "TEST_X1",
          label: "Integration Test Node Reference",
          level: 82,
          solo: false,
          mute: true,
        }),
      });
      const data = await parseJson(response);
      if (!response.ok || data.success !== true) {
        throw new Error(typeof data.error === "string" ? data.error : "Mix-state patch failed.");
      }
      appendLog("/api/owner/audio/mix-state", "SUCCESS", data);
    } catch (error) {
      appendLog("/api/owner/audio/mix-state", "FAILED", errorMessage(error));
    }

    appendLog(
      "/api/owner/audio/mix-state [MASTER]",
      "PENDING",
      "Updating master mastering config parameters.",
    );
    try {
      const response = await fetch("/api/owner/audio/mix-state", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: "300-awakening",
          targetType: "MASTER_DECK",
          whiteNoisePreset: "HIGH",
          eqPreset: "V_SHAPE_BOOST",
          limiterDb: -6,
        }),
      });
      const data = await parseJson(response);
      if (!response.ok || data.success !== true) {
        throw new Error(typeof data.error === "string" ? data.error : "Master update failed.");
      }
      appendLog("/api/owner/audio/mix-state [MASTER]", "SUCCESS", data);
    } catch (error) {
      appendLog("/api/owner/audio/mix-state [MASTER]", "FAILED", errorMessage(error));
    }

    appendLog(
      "/api/owner/video-routing",
      "PENDING",
      "Writing matrix program camera feed selection parameters.",
    );
    try {
      const response = await fetch("/api/owner/video-routing", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: "300-awakening",
          active_program_channel_id: "CAMERA_TEST_NODE",
          transition_type: "AUTO_FADE",
          twitch_restream_active: true,
        }),
      });
      const data = await parseJson(response);
      if (!response.ok || data.success !== true) {
        throw new Error(typeof data.error === "string" ? data.error : "Video routing failed.");
      }
      appendLog("/api/owner/video-routing", "SUCCESS", data);
    } catch (error) {
      appendLog("/api/owner/video-routing", "FAILED", errorMessage(error));
    }

    appendLog(
      "/api/moderation/chat",
      "PENDING",
      "Testing moderator suppression boundary with non-existent valid UUID.",
    );
    try {
      const response = await fetch("/api/moderation/chat", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: "00000000-0000-4000-8000-000000000000",
        }),
      });
      const data = await parseJson(response);
      if (response.status >= 500) {
        throw new Error(typeof data.error === "string" ? data.error : "Server error crash.");
      }
      appendLog("/api/moderation/chat", "SUCCESS", {
        info: "Route online. Not-found or success response handled without a 500.",
        httpStatus: response.status,
        responsePayload: data,
      });
    } catch (error) {
      appendLog("/api/moderation/chat", "FAILED", errorMessage(error));
    }

    setIsRunning(false);
  };

  return (
    <main className="min-h-screen bg-black p-6 font-mono text-white selection:bg-zinc-800">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Live Production Architecture Integration Suite
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Verifies end-to-end multi-user relational synchronization matrices across the active network.
            </p>
          </div>
          <button
            type="button"
            data-testid="execute-infrastructure-integration-run"
            onClick={() => void executeLivePipelineDiagnostic()}
            disabled={isRunning}
            className="bg-zinc-100 px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRunning ? "Running Live Audit Trace..." : "Execute Infrastructure Integration Run"}
          </button>
        </header>

        <section>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Dynamic Network Transaction Execution Stream Log
          </h2>

          {logs.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-800 p-12 text-center text-xs text-zinc-600">
              Awaiting initialization deployment diagnostic command execution trace.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <article
                  key={`${log.timestamp}-${log.endpoint}-${index}`}
                  className="rounded border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="mb-2 flex items-center justify-between border-b border-zinc-900 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600">[{log.timestamp}]</span>
                      <span className="font-bold text-zinc-300">{log.endpoint}</span>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "border-emerald-900 bg-emerald-950/60 text-emerald-400"
                          : log.status === "FAILED"
                            ? "border-red-900 bg-red-950/60 text-red-400"
                            : "animate-pulse border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <pre className="max-h-40 overflow-x-auto whitespace-pre-wrap rounded bg-black/40 p-1 font-sans text-[11px] leading-relaxed text-zinc-400">
                    {log.payload}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
