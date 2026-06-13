import { BaseBroadcastAdapter } from "@/services/broadcast/adapters/BaseBroadcastAdapter";

export class RestreamAdapter extends BaseBroadcastAdapter {
  async connect(): Promise<void> {
    this.markUnavailable("Restream adapter shell — connect() not implemented.");
  }

  async disconnect(): Promise<void> {
    this.markUnavailable("Restream adapter disconnected.");
  }

  async getDestinations(): Promise<unknown[]> {
    return [];
  }

  async startBroadcast(): Promise<void> {
    this.lastError = "startBroadcast() not implemented.";
  }

  async stopBroadcast(): Promise<void> {
    this.lastError = "stopBroadcast() not implemented.";
  }

  async getHealthStatus(): Promise<{ healthy: boolean }> {
    return { healthy: false };
  }
}
