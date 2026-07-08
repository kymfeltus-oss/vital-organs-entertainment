import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { StageRoutingProfile } from "../../lib/audio/stage-audio-types";
import { COLEMAN_BRAND, HOME_TOKENS } from "../../theme/homeTokens";

type StageAudioChromeProps = {
  externalLineConnected: boolean;
  routingProfile: StageRoutingProfile;
  onRoutingProfileChange: (profile: StageRoutingProfile) => void;
};

export default function StageAudioChrome({
  externalLineConnected,
  routingProfile,
  onRoutingProfileChange,
}: StageAudioChromeProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pillRow}>
        <Text
          style={[
            styles.pill,
            externalLineConnected ? styles.pillDirect : styles.pillMic,
          ]}
        >
          {externalLineConnected
            ? "🔒 DIRECT AUDIO LINE CONNECTED"
            : "🎤 INT. MIC GATE ACTIVE"}
        </Text>
      </View>

      <View style={styles.toggle}>
        <Pressable
          style={[
            styles.chip,
            routingProfile === "headphones" && styles.chipActive,
          ]}
          onPress={() => onRoutingProfileChange("headphones")}
        >
          <Text
            style={[
              styles.chipText,
              routingProfile === "headphones" && styles.chipTextActive,
            ]}
          >
            🎧 In-Ears
          </Text>
        </Pressable>
        <Pressable
          style={[styles.chip, routingProfile === "speaker" && styles.chipActive]}
          onPress={() => onRoutingProfileChange("speaker")}
        >
          <Text
            style={[
              styles.chipText,
              routingProfile === "speaker" && styles.chipTextActive,
            ]}
          >
            🔊 Phone Speaker
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14, gap: 10 },
  pillRow: { alignItems: "center" },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    backgroundColor: HOME_TOKENS.glassBg,
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pillDirect: { color: COLEMAN_BRAND.accentGold },
  pillMic: { color: HOME_TOKENS.textMuted },
  toggle: {
    flexDirection: "row",
    gap: 6,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  chip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: "rgba(255,255,255,0.52)",
    borderColor: HOME_TOKENS.glassBorder,
  },
  chipText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: HOME_TOKENS.textMuted,
  },
  chipTextActive: { color: HOME_TOKENS.textPrimary },
});
