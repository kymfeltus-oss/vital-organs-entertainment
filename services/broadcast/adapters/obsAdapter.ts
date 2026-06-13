import { BaseBroadcastAdapter } from "@/services/broadcast/adapters/BaseBroadcastAdapter";

export class ObsAdapter extends BaseBroadcastAdapter {
  async connect(): Promise<void> {
    this.markUnavailable("OBS adapter shell — connect() not implemented.");
  }

  async disconnect(): Promise<void> {
    this.markUnavailable("OBS adapter disconnected.");
  }

  async getScenes(): Promise<string[]> {
    return [];
  }

  async switchScene(_sceneName: string): Promise<void> {
    this.lastError = "switchScene() not implemented.";
  }

  async startStreaming(): Promise<void> {
    this.lastError = "startStreaming() not implemented.";
  }

  async stopStreaming(): Promise<void> {
    this.lastError = "stopStreaming() not implemented.";
  }

  async startRecording(): Promise<void> {
    this.lastError = "startRecording() not implemented.";
  }

  async stopRecording(): Promise<void> {
    this.lastError = "stopRecording() not implemented.";
  }
}
