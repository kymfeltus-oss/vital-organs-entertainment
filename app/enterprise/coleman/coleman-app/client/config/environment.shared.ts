import { Platform } from "react-native";

export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_COLEMAN_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const useStandalone = process.env.EXPO_PUBLIC_COLEMAN_STANDALONE === "true";

  if (__DEV__) {
    if (useStandalone) {
      return Platform.OS === "android"
        ? "http://10.0.2.2:5001"
        : "http://localhost:5001";
    }

    return Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";
  }

  const productionRoot =
    process.env.EXPO_PUBLIC_APP_URL?.trim() || "https://vitalorgansent.com";
  return productionRoot.replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
