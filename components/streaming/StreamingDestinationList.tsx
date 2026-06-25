"use client";

import { memo, useCallback } from "react";
import DestinationCard from "@/components/streaming/DestinationCard";
import type { StreamingDestination } from "@/lib/todays-service/types";

type StreamingDestinationListProps = {
  destinations: StreamingDestination[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onSettings: (destination: StreamingDestination) => void;
  onEditSetup: (destinationId: string) => void;
};

function StreamingDestinationList({
  destinations,
  onReload,
  onToast,
  onSettings,
  onEditSetup,
}: StreamingDestinationListProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {destinations.map((dest) => (
        <DestinationCardItem
          key={dest.id}
          destination={dest}
          onReload={onReload}
          onToast={onToast}
          onSettings={onSettings}
          onEditSetup={onEditSetup}
        />
      ))}
    </div>
  );
}

type DestinationCardItemProps = {
  destination: StreamingDestination;
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onSettings: (destination: StreamingDestination) => void;
  onEditSetup: (destinationId: string) => void;
};

const DestinationCardItem = memo(function DestinationCardItem({
  destination,
  onReload,
  onToast,
  onSettings,
  onEditSetup,
}: DestinationCardItemProps) {
  const handleEditSetup = useCallback(() => {
    onEditSetup(destination.id);
  }, [destination.id, onEditSetup]);

  return (
    <DestinationCard
      destination={destination}
      onReload={onReload}
      onToast={onToast}
      onSettings={onSettings}
      onEditSetup={handleEditSetup}
    />
  );
});

export default memo(StreamingDestinationList);
