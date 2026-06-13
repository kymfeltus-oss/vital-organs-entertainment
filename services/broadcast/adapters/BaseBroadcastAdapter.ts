import type { AdapterConnectionState } from "@/lib/broadcast/types";

export abstract class BaseBroadcastAdapter {
  connectionState: AdapterConnectionState = "disconnected";
  lastError: string | null = null;
  isAvailable = false;

  protected markUnavailable(message: string): void {
    this.connectionState = "disconnected";
    this.lastError = message;
    this.isAvailable = false;
  }

  protected markConnected(): void {
    this.connectionState = "connected";
    this.lastError = null;
    this.isAvailable = true;
  }
}
