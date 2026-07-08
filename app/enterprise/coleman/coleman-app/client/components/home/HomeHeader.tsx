import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HOME_TOKENS } from "../../theme/homeTokens";

type HomeHeaderProps = {
  onMenuPress: () => void;
  onProfilePress: () => void;
};

export default function HomeHeader({
  onMenuPress,
  onProfilePress,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.85}>
        <Ionicons name="menu" size={20} color={HOME_TOKENS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.logoWrap} pointerEvents="none">
        <Image
          source={require("../../assets/coleman_logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="COLEMAN"
        />
      </View>

      <TouchableOpacity style={styles.profile} onPress={onProfilePress} activeOpacity={0.85}>
        <View style={styles.profileSilhouette}>
          <View style={styles.profileHat} />
          <View style={styles.profileHead} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: HOME_TOKENS.bgCream,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HOME_TOKENS.bgCream,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  logo: {
    height: 72,
    width: 220,
    maxWidth: "52%",
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
  },
  profileSilhouette: {
    flex: 1,
    backgroundColor: "#E8E0D6",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  profileHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: HOME_TOKENS.textPrimary,
    marginBottom: 8,
  },
  profileHat: {
    position: "absolute",
    top: 8,
    width: 28,
    height: 10,
    borderRadius: 5,
    backgroundColor: HOME_TOKENS.textPrimary,
  },
});
