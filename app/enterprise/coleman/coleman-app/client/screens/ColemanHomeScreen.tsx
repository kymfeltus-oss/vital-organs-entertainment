import React, { useCallback } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import HomeBackdrop from "../components/home/HomeBackdrop";
import HomeBottomDock from "../components/home/HomeBottomDock";
import HomeHeader from "../components/home/HomeHeader";
import ChordRibbon from "../components/home/ChordRibbon";
import IntelligenceCard from "../components/home/IntelligenceCard";
import NoteLens from "../components/home/NoteLens";
import StageAudioChrome from "../components/home/StageAudioChrome";
import { COLEMAN_WEB_ROUTES } from "../config/environment";
import { useLiveColemanState } from "../hooks/useLiveColemanState";
import { useStageAudioRouting } from "../hooks/useStageAudioRouting";
import { HOME_TOKENS } from "../theme/homeTokens";

type ColemanHomeScreenProps = {
  isPlaying: boolean;
  playBusy: boolean;
  playbackError?: string | null;
  onDismissError?: () => void;
  onPlayPress: () => void;
  onNavigateTab: (tab: "explore" | "library") => void;
};

export default function ColemanHomeScreen({
  isPlaying,
  playBusy,
  playbackError,
  onDismissError,
  onPlayPress,
  onNavigateTab,
}: ColemanHomeScreenProps) {
  const { liveData, activeChordIndex, selectChord, micError, dismissMicError, isStandby } =
    useLiveColemanState();
  const { externalLineConnected, routingProfile, setRoutingProfile } = useStageAudioRouting();

  const openRoute = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Navigation Error", "This feature route is unavailable.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Navigation Error", "Unable to open the feature route.");
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <HomeBackdrop />
      <SafeAreaView style={styles.safe}>
        <HomeHeader
          onMenuPress={() => onNavigateTab("explore")}
          onProfilePress={() => onNavigateTab("library")}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {(playbackError ?? micError) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{playbackError ?? micError}</Text>
              <TouchableOpacity
                onPress={() => {
                  onDismissError?.();
                  dismissMicError();
                }}
              >
                <Text style={styles.dismiss}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <StageAudioChrome
            externalLineConnected={externalLineConnected}
            routingProfile={routingProfile}
            onRoutingProfileChange={(profile) => {
              void setRoutingProfile(profile);
            }}
          />

          <NoteLens
            currentKey={liveData.currentKey}
            currentCents={liveData.currentCents}
            isMicActive={liveData.isMicActive}
            isStandby={isStandby}
          />

          <ChordRibbon
            chordProgression={liveData.chordProgression}
            activeChordIndex={activeChordIndex}
            onSelectChord={selectChord}
            isStandby={isStandby}
          />

          <IntelligenceCard
            currentKey={liveData.currentKey}
            intelligence={liveData.intelligence}
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        <HomeBottomDock
          isPlaying={isPlaying}
          playBusy={playBusy}
          activeTab={null}
          onEdit={() => void openRoute(COLEMAN_WEB_ROUTES.keyFinder)}
          onExplore={() => onNavigateTab("explore")}
          onPlay={() => onPlayPress()}
          onStudio={() => void openRoute(COLEMAN_WEB_ROUTES.tuner)}
          onLibrary={() => onNavigateTab("library")}
          onShare={() => onNavigateTab("library")}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HOME_TOKENS.bgCream },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 16 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: HOME_TOKENS.glassBg,
    borderWidth: 1,
    borderColor: HOME_TOKENS.glassBorder,
  },
  errorText: { flex: 1, fontSize: 11, color: HOME_TOKENS.textPrimary },
  dismiss: { fontSize: 9, letterSpacing: 1, color: HOME_TOKENS.textMuted },
});
