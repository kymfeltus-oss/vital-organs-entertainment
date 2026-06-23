import type { RestreamAdapterResult } from "@/lib/live-hub/restream/types";
import type { VmixAdapterResult } from "@/lib/live-hub/vmix/types";
import type { OpsSnapshot } from "@/lib/ops/types";
import type { StripeHealthPayload } from "@/lib/ops/stripe-health";

export type LiveHubHeartbeatPayload = {
  opsSnapshot: OpsSnapshot;
  vmixState: VmixAdapterResult;
  restreamState: RestreamAdapterResult;
  stripeHealth: StripeHealthPayload;
};
