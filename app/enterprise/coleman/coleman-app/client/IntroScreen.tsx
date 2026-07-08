import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

import { COLEMAN_BRAND, COLEMAN_CANVAS_GRADIENT } from "./theme/homeTokens";

type IntroScreenProps = {
  onEnter: () => void;
};

const { width, height } = Dimensions.get("window");

const BRAND = {
  bgPrimary: COLEMAN_BRAND.bgPrimary,
  textPrimary: COLEMAN_BRAND.textPrimary,
  textSecondary: COLEMAN_BRAND.textSecondary,
  border: COLEMAN_BRAND.border,
  surface: COLEMAN_BRAND.surface,
} as const;

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        delay: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ready, fadeAnim, slideAnim]);

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
        onReadyForDisplay={() => setReady(true)}
      />

      <LinearGradient
        colors={[
          "transparent",
          "transparent",
          "rgba(248, 243, 237, 0.55)",
          "rgba(237, 225, 215, 0.92)",
        ]}
        locations={[0, 0.5, 0.78, 1]}
        style={styles.overlay}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.enterWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onEnter}
            style={styles.enterTouchable}
          >
            <View style={styles.enterButton}>
              <Text style={styles.enterLabel}>ENTER</Text>
              <View style={styles.enterIconPod}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color={BRAND.textPrimary}
                />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.enterHint}>Tap to open your dashboard</Text>
        </Animated.View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 52,
  },
  enterWrap: {
    alignItems: "stretch",
  },
  enterTouchable: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 50,
    elevation: 6,
  },
  enterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.surface,
    gap: 14,
  },
  enterLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: BRAND.textPrimary,
  },
  enterIconPod: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
  },
  enterHint: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.02,
    color: BRAND.textSecondary,
  },
});
