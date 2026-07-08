import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLEMAN_BRAND, HOME_TOKENS } from "../../theme/homeTokens";

type HomeBottomDockProps = {
  isPlaying: boolean;
  playBusy: boolean;
  onEdit: () => void;
  onExplore: () => void;
  onPlay: () => void;
  onStudio: () => void;
  onLibrary: () => void;
  onShare: () => void;
  activeTab: "explore" | "studio" | "library" | null;
};

export default function HomeBottomDock({
  isPlaying,
  playBusy,
  onEdit,
  onExplore,
  onPlay,
  onStudio,
  onLibrary,
  onShare,
  activeTab,
}: HomeBottomDockProps) {
  return (
    <View style={styles.dock}>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.88}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>

      <View style={styles.nav}>
        <DockTab
          label="EXPLORE"
          icon="musical-notes-outline"
          active={activeTab === "explore"}
          onPress={onExplore}
        />

        <View style={styles.playWrap}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={onPlay}
            disabled={playBusy}
            activeOpacity={0.9}
          >
            {isPlaying ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.playIcon} />
            )}
          </TouchableOpacity>
        </View>

        <DockTab
          label="STUDIO"
          icon="disc-outline"
          active={activeTab === "studio"}
          onPress={onStudio}
        />

        <DockTab
          label="LIBRARY"
          icon="folder-open-outline"
          active={activeTab === "library"}
          onPress={onLibrary}
        />
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
        <Ionicons name="share-outline" size={18} color={HOME_TOKENS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function DockTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Ionicons
        name={icon}
        size={18}
        color={active ? COLEMAN_BRAND.champagne : HOME_TOKENS.textMuted}
      />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 12 : 14,
    backgroundColor: COLEMAN_BRAND.glassFill,
    borderTopWidth: 1,
    borderTopColor: HOME_TOKENS.glassBorder,
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: HOME_TOKENS.textPrimary,
  },
  editText: {
    fontSize: 11,
    fontWeight: "600",
    color: HOME_TOKENS.bgCream,
  },
  nav: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  tab: { alignItems: "center", minWidth: 52, paddingBottom: 2 },
  tabLabel: {
    fontSize: 7,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: HOME_TOKENS.textMuted,
    marginTop: 4,
  },
  tabLabelActive: { color: COLEMAN_BRAND.champagne },
  playWrap: { marginTop: -28, marginHorizontal: 4 },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderStyle: "solid",
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 14,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: COLEMAN_BRAND.bronze,
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLEMAN_BRAND.bronze,
  },
  shareBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
});
