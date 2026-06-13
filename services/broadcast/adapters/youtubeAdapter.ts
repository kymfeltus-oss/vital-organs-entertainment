import { BaseBroadcastAdapter } from "@/services/broadcast/adapters/BaseBroadcastAdapter";

export class YoutubeAdapter extends BaseBroadcastAdapter {
  async connect(): Promise<void> {
    this.markUnavailable("YouTube adapter shell — connect() not implemented.");
  }

  async disconnect(): Promise<void> {
    this.markUnavailable("YouTube adapter disconnected.");
  }

  async createLiveEvent(): Promise<{ eventId: string | null }> {
    return { eventId: null };
  }

  async startLiveEvent(): Promise<void> {
    this.lastError = "startLiveEvent() not implemented.";
  }

  async stopLiveEvent(): Promise<void> {
    this.lastError = "stopLiveEvent() not implemented.";
  }

  async getLiveStatus(): Promise<{ live: boolean }> {
    return { live: false };
  }
}
