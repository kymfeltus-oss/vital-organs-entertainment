import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatCentsBadge, formatKeyDisplay, liveFallback } from "../../lib/live-display";
import { HOME_TOKENS } from "../../theme/homeTokens";

type NoteLensProps = {
  currentKey: string | null;
  currentCents: number;
  isMicActive: boolean;
  isStandby?: boolean;
};

export default function NoteLens({
  currentKey,
  currentCents,
  isMicActive,
  isStandby = false,
}: NoteLensProps) {
  const { keyLabel, qualityLabel, badgeLabel } = formatKeyDisplay(
    currentKey,
    currentKey,
    currentCents,
    isStandby,
  );
  const centsBadge = isStandby ? badgeLabel : formatCentsBadge(currentCents);
  const listening = isMicActive && !currentKey && !isStandby;
  const subLabel = listening ? "LISTENING" : liveFallback(qualityLabel);

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, styles.badgeLeft]}>
        <Text style={styles.badgeSymbol}>♭</Text>
        <Text style={styles.badgeLabel}>FLAT</Text>
      </View>

      <View style={styles.lens}>
        <Text style={styles.label}>CURRENT KEY</Text>
        <Text style={styles.note}>{liveFallback(isStandby ? keyLabel : currentKey)}</Text>
        <View style={styles.qualityRow}>
          <Text style={styles.quality}>{subLabel}</Text>
          {centsBadge ? <Text style={styles.chip}>{centsBadge}</Text> : null}
        </View>
      </View>

      <View style={[styles.badge, styles.badgeRight]}>
        <Text style={styles.badgeSymbol}>♯</Text>
        <Text style={styles.badgeLabel}>SHARP</Text>
      </View>
    </View>
  );
}

const LENS_SIZE = 240;

const styles = StyleSheet.create({
  wrap: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  badge: {
    position: "absolute",
    top: "50%",
    marginTop: -28,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    alignItems: "center",
    minWidth: 52,
  },
  badgeLeft: { left: "4%" },
  badgeRight: { right: "4%" },
  badgeSymbol: { fontSize: 16, fontWeight: "600", color: HOME_TOKENS.textPrimary },
  badgeLabel: {
    fontSize: 7,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: HOME_TOKENS.textMuted,
    marginTop: 4,
  },
  lens: {
    width: LENS_SIZE,
    height: LENS_SIZE,
    borderRadius: LENS_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.38)",
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1.4,
    color: HOME_TOKENS.textMuted,
    marginBottom: 4,
  },
  note: {
    fontSize: 72,
    fontWeight: "700",
    color: HOME_TOKENS.textPrimary,
    lineHeight: 76,
  },
  qualityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  quality: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.8,
    color: HOME_TOKENS.textMuted,
  },
  chip: {
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    color: HOME_TOKENS.textMuted,
  },
});
