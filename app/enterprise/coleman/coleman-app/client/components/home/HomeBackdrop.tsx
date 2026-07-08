import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { COLEMAN_CANVAS_GRADIENT } from "../../theme/homeTokens";

export default function HomeBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[...COLEMAN_CANVAS_GRADIENT]}
        locations={[0, 0.28, 0.58, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.champagneGlow} />
      <View style={styles.waveA} />
      <View style={styles.waveB} />
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  champagneGlow: {
    position: "absolute",
    top: "8%",
    left: "5%",
    width: "90%",
    height: "42%",
    borderRadius: 999,
    backgroundColor: "rgba(231, 216, 200, 0.22)",
  },
  waveA: {
    position: "absolute",
    top: "-5%",
    left: "-10%",
    width: "120%",
    height: "45%",
    borderRadius: 999,
    backgroundColor: "rgba(248, 243, 237, 0.45)",
  },
  waveB: {
    position: "absolute",
    bottom: "15%",
    right: "-12%",
    width: "85%",
    height: "38%",
    borderRadius: 999,
    backgroundColor: "rgba(231, 216, 200, 0.35)",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(217, 200, 181, 0.06)",
  },
});
