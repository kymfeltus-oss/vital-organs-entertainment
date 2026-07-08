import React, { useRef } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { StatusBar } from "expo-status-bar";

import { COLEMAN_BRAND } from "./theme/homeTokens";

type IntroScreenProps = {
  onEnter: () => void;
};

const { width, height } = Dimensions.get("window");

const BRAND = {
  bgPrimary: COLEMAN_BRAND.bgPrimary,
} as const;

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  const videoRef = useRef<Video>(null);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Video
        ref={videoRef}
        source={require("./assets/coleman_intro.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={false}
      />

      <View style={styles.enterLayer} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter dashboard"
          onPress={onEnter}
          style={styles.enterHotspot}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.bgPrimary,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  enterLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    paddingBottom: 52,
    zIndex: 4,
  },
  enterHotspot: {
    width: "100%",
    height: 68,
    borderRadius: 28,
  },
});
