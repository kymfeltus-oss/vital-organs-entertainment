import type {
  Camera,
  LiveReadinessState,
  ServiceAlert,
  SoundItem,
  StreamingDestination,
  TodaysServicePayload,
} from "@/lib/todays-service/types";
import {
  buildBroadcastDestinationCards,
  DEFAULT_RECOMMENDED_BROADCAST_PLATFORM,
} from "@/lib/streaming/broadcast-catalog";

export type TodaysServiceLiveEvent =
  | {
      type: "todays-service.update";
      readiness: LiveReadinessState;
      alerts: ServiceAlert[];
      serviceStartedAt: string | null;
      streamingDestinations?: StreamingDestination[];
      cameras?: Camera[];
      soundItems?: SoundItem[];
      at: string;
    }
  | {
      type: "todays-service.heartbeat";
      readiness: LiveReadinessState;
      serviceStartedAt: string | null;
      at: string;
    };

function readinessEqual(a: LiveReadinessState, b: LiveReadinessState): boolean {
  return (
    a.readinessPercent === b.readinessPercent &&
    a.serviceId === b.serviceId &&
    JSON.stringify(a.sections) === JSON.stringify(b.sections)
  );
}

function alertsEqual(a: ServiceAlert[], b: ServiceAlert[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((alert, index) => {
    const other = b[index];
    return (
      other &&
      alert.id === other.id &&
      alert.status === other.status &&
      alert.message === other.message &&
      alert.note === other.note
    );
  });
}

function camerasEqual(a: Camera[], b: Camera[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((camera, index) => {
    const other = b[index];
    return (
      other &&
      camera.id === other.id &&
      camera.status === other.status &&
      camera.liveStatus === other.liveStatus &&
      camera.name === other.name
    );
  });
}

function soundItemsEqual(a: SoundItem[], b: SoundItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      other &&
      item.id === other.id &&
      item.status === other.status &&
      item.liveStatus === other.liveStatus &&
      item.name === other.name &&
      JSON.stringify(item.levelsJson) === JSON.stringify(other.levelsJson)
    );
  });
}

function destinationsEqual(a: StreamingDestination[], b: StreamingDestination[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((dest, index) => {
    const other = b[index];
    return (
      other &&
      dest.id === other.id &&
      dest.connectionStatus === other.connectionStatus &&
      dest.connected === other.connected &&
      dest.selectedForToday === other.selectedForToday &&
      dest.liveStatus === other.liveStatus
    );
  });
}

/** Returns null when the live event would not change visible dashboard state. */
export function applyTodaysServiceLiveEvent(
  current: TodaysServicePayload,
  event: TodaysServiceLiveEvent,
): TodaysServicePayload | null {
  const serviceStartedAt = event.serviceStartedAt ?? current.service.serviceStartedAt;
  const readinessChanged = !readinessEqual(current.readiness, event.readiness);
  const serviceStartedChanged = serviceStartedAt !== current.service.serviceStartedAt;

  if (event.type === "todays-service.heartbeat") {
    if (!readinessChanged && !serviceStartedChanged) return null;
    return {
      ...current,
      readiness: event.readiness,
      service: {
        ...current.service,
        serviceStartedAt,
      },
    };
  }

  const nextAlerts = event.alerts.length ? mergeLiveAlerts(current.alerts, event.alerts) : current.alerts;
  const nextCameras = event.cameras ?? current.cameras;
  const nextSoundItems = event.soundItems ?? current.soundItems;
  const nextDestinations = event.streamingDestinations ?? current.streamingDestinations;

  const alertsChanged = event.alerts.length > 0 && !alertsEqual(current.alerts, nextAlerts);
  const camerasChanged = Boolean(event.cameras) && !camerasEqual(current.cameras, nextCameras);
  const soundChanged = Boolean(event.soundItems) && !soundItemsEqual(current.soundItems, nextSoundItems);
  const destinationsChanged =
    Boolean(event.streamingDestinations) && !destinationsEqual(current.streamingDestinations, nextDestinations);

  if (
    !readinessChanged &&
    !serviceStartedChanged &&
    !alertsChanged &&
    !camerasChanged &&
    !soundChanged &&
    !destinationsChanged
  ) {
    return null;
  }

  return {
    ...current,
    readiness: event.readiness,
    alerts: nextAlerts,
    cameras: nextCameras,
    soundItems: nextSoundItems,
    streamingDestinations: nextDestinations,
    broadcastDestinationCards: destinationsChanged
      ? buildBroadcastDestinationCards({
          destinations: nextDestinations,
          selections: current.broadcastDestinations ?? [],
          recommendedPlatform:
            current.equipmentProfile?.recommendedBroadcastPlatform ?? DEFAULT_RECOMMENDED_BROADCAST_PLATFORM,
        })
      : current.broadcastDestinationCards,
    service: {
      ...current.service,
      serviceStartedAt,
    },
  };
}

function mergeLiveAlerts(existing: ServiceAlert[], live: ServiceAlert[]): ServiceAlert[] {
  const map = new Map(existing.map((alert) => [alert.id, alert]));
  for (const alert of live) {
    map.set(alert.id, alert);
  }
  return Array.from(map.values());
}

export function liveEventFingerprint(event: TodaysServiceLiveEvent): string {
  if (event.type === "todays-service.heartbeat") {
    return JSON.stringify({
      type: event.type,
      readiness: event.readiness,
      serviceStartedAt: event.serviceStartedAt,
    });
  }

  return JSON.stringify({
    type: event.type,
    readiness: event.readiness,
    serviceStartedAt: event.serviceStartedAt,
    alerts: event.alerts,
    cameras: event.cameras,
    soundItems: event.soundItems,
    streamingDestinations: event.streamingDestinations,
  });
}
