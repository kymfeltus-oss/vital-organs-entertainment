import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { liveFallback } from "../../lib/live-display";
import type { LiveColemanState } from "../../lib/live-types";
import { COLEMAN_BRAND, HOME_TOKENS } from "../../theme/homeTokens";

type IntelligenceCardProps = {
  currentKey: string | null;
  intelligence: LiveColemanState["intelligence"];
};

export default function IntelligenceCard({ currentKey, intelligence }: IntelligenceCardProps) {
  const isLive = intelligence.status === "LIVE";
  const voicings = intelligence.suggestedVoicings;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={12} color={HOME_TOKENS.textPrimary} />
          <Text style={styles.title}>COLEMAN INTELLIGENCE</Text>
        </View>
        <View style={[styles.liveChip, !isLive && styles.liveOff]}>
          {isLive ? <View style={styles.livePulse} /> : null}
          <Text style={styles.liveText}>{isLive ? "● LIVE" : "OFFLINE"}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>FUNCTION</Text>
          <Text style={styles.fieldValue}>{liveFallback(intelligence.functionName)}</Text>
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>CADENCE POTENTIAL</Text>
          <Text style={styles.fieldValue}>{liveFallback(intelligence.cadencePotential)}</Text>
          <View style={styles.meter}>
            <View
              style={[
                styles.meterFill,
                { width: `${Math.min(100, Math.max(0, intelligence.cadenceScore))}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.dial}>
          <Text style={styles.dialPrimary}>{liveFallback(currentKey)}</Text>
          <Text style={styles.dialSecondary}>{currentKey ? `${currentKey} MAJOR` : "—"}</Text>
        </View>

        <View style={[styles.col, styles.colRight]}>
          <Text style={styles.fieldLabel}>NASHVILLE NUMBER</Text>
          <Text style={styles.heroValue}>{liveFallback(intelligence.nashvilleNumber)}</Text>
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>SCALE DEGREE</Text>
          <Text style={styles.fieldValue}>{liveFallback(intelligence.scaleDegree)}</Text>
        </View>
      </View>

      <View style={styles.voicings}>
        {voicings.length === 0 ? (
          <View style={styles.voicingPill}>
            <Text style={styles.voicingTextMuted}>[ + ]</Text>
          </View>
        ) : (
          voicings.map((voicing, index) => (
            <View key={`${voicing}-${index}`} style={styles.voicingPill}>
              <Text style={styles.voicingText}>{voicing}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: HOME_TOKENS.textPrimary,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
  },
  liveOff: { opacity: 0.55 },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: HOME_TOKENS.liveRed,
  },
  liveText: { fontSize: 8, fontWeight: "600", letterSpacing: 1, color: HOME_TOKENS.textPrimary },
  grid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  col: { flex: 1 },
  colRight: { alignItems: "flex-end" },
  fieldLabel: {
    fontSize: 7,
    fontWeight: "500",
    letterSpacing: 1.4,
    color: HOME_TOKENS.textMuted,
  },
  fieldValue: {
    fontSize: 11,
    fontWeight: "700",
    color: HOME_TOKENS.textPrimary,
    marginTop: 4,
  },
  heroValue: {
    fontSize: 22,
    fontWeight: "700",
    color: HOME_TOKENS.textPrimary,
    marginTop: 4,
  },
  meter: {
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
    marginTop: 6,
    overflow: "hidden",
    width: "100%",
  },
  meterFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLEMAN_BRAND.accentGold,
  },
  dial: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  dialPrimary: { fontSize: 14, fontWeight: "700", color: HOME_TOKENS.textPrimary },
  dialSecondary: {
    fontSize: 7,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: HOME_TOKENS.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  voicings: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  voicingPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  voicingText: { fontSize: 9, fontWeight: "500", color: HOME_TOKENS.textPrimary },
  voicingTextMuted: { fontSize: 9, fontWeight: "500", color: "rgba(110,100,88,0.5)" },
});
