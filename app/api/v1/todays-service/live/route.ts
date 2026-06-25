import { NextRequest } from "next/server";
import { requireServiceApiUser, serviceForbiddenResponse } from "@/lib/todays-service/auth";
import { liveEventFingerprint, type TodaysServiceLiveEvent } from "@/lib/todays-service/live-patch";
import { loadTodaysService } from "@/lib/todays-service/service";
import { getLiveReadinessState } from "@/lib/todays-service/redis-store";
import { subscribeCameraLiveUpdates } from "@/lib/cameras/events";
import { subscribeSoundLiveUpdates } from "@/lib/sound/events";
import { subscribeStreamingLiveUpdates } from "@/lib/streaming/events";
import type { TodaysServicePayload } from "@/lib/todays-service/types";

/** Heartbeat interval — readiness-only, no DB reload. See lib/todays-service/PERFORMANCE.md */
const LIVE_HEARTBEAT_MS = 30_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireServiceApiUser(request);
  if (gate.response || !gate.context) return gate.response;

  if (!gate.context.permissions.canView) {
    return serviceForbiddenResponse("view live status");
  }

  const tenantId = gate.context.tenantId;
  const encoder = new TextEncoder();
  let closed = false;
  request.signal.addEventListener("abort", () => {
    closed = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload: TodaysServicePayload | null = null;
      let lastFingerprint = "";

      const enqueueEvent = (event: TodaysServiceLiveEvent) => {
        const fingerprint = liveEventFingerprint(event);
        if (fingerprint === lastFingerprint) return;
        lastFingerprint = fingerprint;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const send = async (options?: { full?: boolean }) => {
        if (closed) return;
        const full = options?.full ?? false;

        try {
          if (full || !lastPayload) {
            lastPayload = await loadTodaysService(tenantId);
            const payload = lastPayload;
            enqueueEvent({
              type: "todays-service.update",
              readiness: payload.readiness,
              alerts: payload.alerts.filter((alert) => alert.status === "open"),
              serviceStartedAt: payload.service.serviceStartedAt,
              streamingDestinations: payload.streamingDestinations,
              cameras: payload.cameras,
              soundItems: payload.soundItems,
              at: new Date().toISOString(),
            });
            return;
          }

          const cachedReadiness = await getLiveReadinessState(tenantId);
          if (!cachedReadiness || !lastPayload) return;

          enqueueEvent({
            type: "todays-service.heartbeat",
            readiness: cachedReadiness,
            serviceStartedAt: lastPayload.service.serviceStartedAt,
            at: new Date().toISOString(),
          });
        } catch (error) {
          console.error("[TODAYS_SERVICE_LIVE_ERR]:", error);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "stream_error" })}\n\n`),
          );
        }
      };

      await send({ full: true });

      const interval = setInterval(() => {
        void send({ full: false });
      }, LIVE_HEARTBEAT_MS);

      const unsubscribeStreaming = await subscribeStreamingLiveUpdates(
        tenantId,
        () => {
          void send({ full: true });
        },
        request.signal,
      );

      const unsubscribeCameras = await subscribeCameraLiveUpdates(
        tenantId,
        () => {
          void send({ full: true });
        },
        request.signal,
      );

      const unsubscribeSound = await subscribeSoundLiveUpdates(
        tenantId,
        () => {
          void send({ full: true });
        },
        request.signal,
      );

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        unsubscribeStreaming();
        unsubscribeCameras();
        unsubscribeSound();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
