import {
  buildBroadcastDestinationCards,
  DEFAULT_RECOMMENDED_BROADCAST_PLATFORM,
  mapConnectionToOAuthStatus,
} from "@/lib/streaming/broadcast-catalog";
export { buildBroadcastDestinationCards } from "@/lib/streaming/broadcast-catalog";
import { platformMeta } from "@/lib/streaming/platforms";
import { createStreamingDestinationAccount } from "@/lib/streaming/service";
import type { StreamingPlatform } from "@/lib/streaming/types";
import {
  getOrCreateTodayService,
  getTenantEquipmentProfile,
  listServiceBroadcastDestinations,
  listStreamingDestinations,
  replaceServiceBroadcastDestinations,
  updateStreamingDestination,
  writeAuditLog,
} from "@/lib/todays-service/repository";
import type {
  BroadcastDestinationCard,
  ServiceBroadcastDestination,
} from "@/lib/todays-service/types";

export async function listBroadcastDestinationCards(tenantId: string): Promise<{
  selections: ServiceBroadcastDestination[];
  cards: BroadcastDestinationCard[];
  recommendedPlatform: StreamingPlatform;
}> {
  const service = await getOrCreateTodayService(tenantId);
  const [destinations, selections, profile] = await Promise.all([
    listStreamingDestinations(service.id),
    listServiceBroadcastDestinations(service.id),
    getTenantEquipmentProfile(tenantId),
  ]);
  const recommendedPlatform =
    profile?.recommendedBroadcastPlatform ?? DEFAULT_RECOMMENDED_BROADCAST_PLATFORM;

  return {
    selections,
    cards: buildBroadcastDestinationCards({
      destinations,
      selections,
      recommendedPlatform,
    }),
    recommendedPlatform,
  };
}

export async function saveBroadcastDestinationSelections(
  tenantId: string,
  userId: string,
  userEmail: string | null,
  platforms: StreamingPlatform[],
): Promise<{ selections: ServiceBroadcastDestination[]; cards: BroadcastDestinationCard[] }> {
  if (platforms.length === 0) throw new Error("Select at least one broadcast destination.");

  const service = await getOrCreateTodayService(tenantId);
  const existing = await listStreamingDestinations(service.id);
  const destinationByPlatform = new Map(existing.map((d) => [d.platform, d]));
  const profile = await getTenantEquipmentProfile(tenantId);
  const recommendedPlatform = profile?.recommendedBroadcastPlatform ?? DEFAULT_RECOMMENDED_BROADCAST_PLATFORM;

  for (const platform of platforms) {
    if (!destinationByPlatform.has(platform)) {
      const meta = platformMeta(platform);
      await createStreamingDestinationAccount(tenantId, userId, userEmail, {
        platform,
        displayName: meta?.label,
        settings: {},
      });
    }
  }

  const refreshedDestinations = await listStreamingDestinations(service.id);

  for (const dest of refreshedDestinations) {
    const selected = platforms.includes(dest.platform as StreamingPlatform);
    await updateStreamingDestination(dest.id, { selectedForToday: selected });
  }

  const rows = platforms.map((platform, index) => {
    const dest = refreshedDestinations.find((d) => d.platform === platform) ?? null;
    return {
      platform,
      destinationId: dest?.id ?? null,
      displayOrder: index,
      enabled: true,
      connectedAccount: dest?.accountName ?? dest?.channelName ?? null,
      oauthStatus: mapConnectionToOAuthStatus(
        dest?.connectionStatus ?? "not_connected",
        dest?.oauthExpiresAt ?? null,
      ),
      lastTestedAt: dest?.lastSuccessfulTestAt ?? null,
    };
  });

  const selections = await replaceServiceBroadcastDestinations(tenantId, service.id, rows);

  await writeAuditLog({
    tenantId,
    serviceId: service.id,
    userId,
    userEmail,
    action: "broadcast_destinations_save",
    detailJson: { platforms, count: platforms.length },
  });

  const cards = buildBroadcastDestinationCards({
    destinations: refreshedDestinations,
    selections,
    recommendedPlatform,
  });

  return { selections, cards };
}
