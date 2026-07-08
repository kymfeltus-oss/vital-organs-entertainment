import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { formatBarCountLabel, parseProgressionEntry } from "../../lib/live-display";
import { COLEMAN_BRAND, HOME_TOKENS } from "../../theme/homeTokens";

type ChordRibbonProps = {
  chordProgression: string[];
  activeChordIndex: number | null;
  onSelectChord: (index: number) => void;
  isStandby?: boolean;
};

export default function ChordRibbon({
  chordProgression,
  activeChordIndex,
  onSelectChord,
  isStandby = false,
}: ChordRibbonProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isEmpty = chordProgression.length === 0;

  return (
    <View style={styles.ribbon}>
      <View style={styles.head}>
        <Text style={styles.title}>CHORD PROGRESSION</Text>
        <Text style={styles.bars}>{formatBarCountLabel(chordProgression.length, isStandby)}</Text>
      </View>

      <View style={styles.track}>
        <TouchableOpacity
          style={styles.arrow}
          disabled={isEmpty}
          onPress={() => scrollRef.current?.scrollTo({ x: 0, animated: true })}
        >
          <Ionicons name="chevron-back" size={16} color={HOME_TOKENS.textMuted} />
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isEmpty ? (
            <Text style={styles.empty}>—</Text>
          ) : (
            chordProgression.map((entry, index) => {
              const { chord, roman } = parseProgressionEntry(entry);
              const isActive =
                activeChordIndex === index || (activeChordIndex === null && index === 0);
              return (
                <TouchableOpacity
                  key={`${entry}-${index}`}
                  style={[styles.node, isActive && styles.nodeActive]}
                  onPress={() => onSelectChord(index)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chord}>{chord}</Text>
                  <Text style={styles.roman}>{roman}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.arrow}
          disabled={isEmpty}
          onPress={() => scrollRef.current?.scrollTo({ x: 120, animated: true })}
        >
          <Ionicons name="chevron-forward" size={16} color={HOME_TOKENS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    marginBottom: 16,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1.4,
    color: HOME_TOKENS.textMuted,
  },
  bars: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: HOME_TOKENS.textMuted,
  },
  track: { flexDirection: "row", alignItems: "center" },
  arrow: { width: 22, alignItems: "center", justifyContent: "center" },
  scrollContent: { gap: 8, paddingBottom: 4, flexGrow: 1 },
  empty: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "300",
    color: "rgba(110,100,88,0.4)",
    paddingVertical: 12,
    minWidth: 200,
  },
  node: {
    minWidth: 68,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.32)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
  },
  nodeActive: {
    backgroundColor: "rgba(255,255,255,0.48)",
    borderBottomWidth: 4,
    borderBottomColor: COLEMAN_BRAND.accentGold,
  },
  chord: { fontSize: 13, fontWeight: "600", color: HOME_TOKENS.textPrimary },
  roman: {
    fontSize: 9,
    fontWeight: "500",
    color: HOME_TOKENS.textMuted,
    marginTop: 2,
  },
});
