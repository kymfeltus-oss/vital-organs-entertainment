import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeSetupProgress,
  isVolunteerSetupComplete,
  nextIncompleteSetupAction,
} from "@/lib/todays-service/coaching";
import type { TodaysServicePayload } from "@/lib/todays-service/types";

function minimalReadyPayload(overrides: Partial<TodaysServicePayload> = {}): TodaysServicePayload {
  return {
    service: {
      id: "svc-1",
      tenantId: "tenant-1",
      serviceName: "Sunday Service",
      serviceDate: "2026-06-25",
      serviceStartTime: "10:00",
      broadcastProfile: "standard",
      countdownEnabled: false,
      serviceStartedAt: null,
      readinessMessage: null,
    },
    equipment: [],
    soundItems: [
      {
        id: "mic-1",
        name: "Pastor Mic",
        category: "pastor_mic",
        deviceType: "microphone",
        deviceId: "dev-1",
        mixerIp: null,
        status: "ready",
        liveStatus: "connected",
        lastTestedAt: "2026-06-25T09:00:00.000Z",
        lastSuccessfulTestAt: "2026-06-25T09:00:00.000Z",
        lastErrorMessage: null,
        configJson: {},
      },
    ],
    mixers: [],
    microphones: [],
    cameras: [{ id: "cam-1", name: "Main", status: "ready" } as TodaysServicePayload["cameras"][0]],
    internetConnections: [{ id: "net-1", status: "ready", uploadStrength: "good" } as TodaysServicePayload["internetConnections"][0]],
    streamingDestinations: [
      {
        id: "dest-1",
        platform: "youtube",
        connectionStatus: "ready",
        connected: true,
        selectedForToday: true,
      } as TodaysServicePayload["streamingDestinations"][0],
    ],
    broadcastDestinations: [],
    broadcastDestinationCards: [],
    recordingSettings: [{ saveLocation: "/recordings", recordingEnabled: true, status: "ready" } as TodaysServicePayload["recordingSettings"][0]],
    presentationSources: [
      { softwareName: "ProPresenter", connectionStatus: "connected", status: "ready" } as TodaysServicePayload["presentationSources"][0],
    ],
    timelineItems: [],
    teamMembers: [],
    alerts: [],
    readiness: {
      tenantId: "tenant-1",
      serviceId: "svc-1",
      readinessPercent: 100,
      sections: {
        sound: "ready",
        cameras: "ready",
        internet: "ready",
        livestream: "ready",
        recording: "ready",
        presentation: "ready",
      },
      updatedAt: "2026-06-25T09:00:00.000Z",
    },
    equipmentProfile: null,
    ...overrides,
  };
}

describe("coaching go-live gates", () => {
  it("allows go live when required setup is done but team and timeline are empty", () => {
    const data = minimalReadyPayload();
    assert.equal(isVolunteerSetupComplete(data), true);
    assert.equal(nextIncompleteSetupAction(data), null);
  });

  it("blocks go live when a required section is incomplete", () => {
    const data = minimalReadyPayload({ cameras: [] });
    assert.equal(isVolunteerSetupComplete(data), false);
    assert.equal(nextIncompleteSetupAction(data)?.sectionId, "cameras");
  });

  it("counts only required steps in setup progress", () => {
    const data = minimalReadyPayload();
    const progress = computeSetupProgress(data);
    assert.equal(progress.total, 6);
    assert.equal(progress.remaining, 0);
    assert.equal(progress.optionalSteps.length, 2);
  });
});
