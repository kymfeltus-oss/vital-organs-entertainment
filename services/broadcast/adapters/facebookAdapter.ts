import { BaseBroadcastAdapter } from "@/services/broadcast/adapters/BaseBroadcastAdapter";

export class FacebookAdapter extends BaseBroadcastAdapter {
  async connect(): Promise<void> {
    this.markUnavailable("Facebook adapter shell — connect() not implemented.");
  }

  async disconnect(): Promise<void> {
    this.markUnavailable("Facebook adapter disconnected.");
  }

  async createLive(): Promise<{ liveId: string | null }> {
    return { liveId: null };
  }

  async startLive(): Promise<void> {
    this.lastError = "startLive() not implemented.";
  }

  async stopLive(): Promise<void> {
    this.lastError = "stopLive() not implemented.";
  }

  async getLiveStatus(): Promise<{ live: boolean }> {
    return { live: false };
  }
}
