import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

import {
  ColemanApiError,
  fetchHistory,
  fetchSetlist,
  fetchTheoryCatalog,
  recordPlayback,
  uploadStem,
  type HistoryItem,
  type TheoryItem,
  type TrackItem,
} from "./api/coleman-api";
import { COLEMAN_WEB_ROUTES } from "./config/environment";
import { getStageRoutingManager } from "./lib/audio/stage-routing-manager";
import IntroScreen from "./IntroScreen";
import ColemanHomeScreen from "./screens/ColemanHomeScreen";
import { COLEMAN_BRAND, COLEMAN_CANVAS_GRADIENT } from "./theme/homeTokens";

type NavTab = "home" | "explore" | "history" | "library";

const FEATURE_CARDS = [
  {
    id: "tuner",
    title: "TUNER",
    subtitle: "Live pitch lock",
    icon: "radio-outline" as const,
    href: COLEMAN_WEB_ROUTES.tuner,
  },
  {
    id: "keyfinder",
    title: "KEY FINDER",
    subtitle: "Detect song key",
    icon: "key-outline" as const,
    href: COLEMAN_WEB_ROUTES.keyFinder,
  },
  {
    id: "metronome",
    title: "METRONOME",
    subtitle: "Tempo guide",
    icon: "pulse-outline" as const,
    href: COLEMAN_WEB_ROUTES.metronome,
  },
  {
    id: "theory",
    title: "THEORY ROADMAP",
    subtitle: "NNS & progressions",
    icon: "map-outline" as const,
    href: COLEMAN_WEB_ROUTES.theoryRoadmap,
  },
] as const;

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [setlist, setSetlist] = useState<TrackItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theory, setTheory] = useState<TheoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [apiError, setApiError] = useState<string | null>(null);
  const [activePlaybackSound, setActivePlaybackSound] = useState<Audio.Sound | null>(null);
  const [currentlyPlayingTrackId, setCurrentlyPlayingTrackId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playBusy, setPlayBusy] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const fetchActiveSetlist = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const payload = await fetchSetlist();
      setSetlist(payload);
    } catch (error) {
      setApiError(
        error instanceof ColemanApiError
          ? error.message
          : "Could not connect to COLEMAN API.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setApiError(null);
      const entries = await fetchHistory();
      setHistory(entries);
    } catch (error) {
      setApiError(
        error instanceof ColemanApiError
          ? error.message
          : "Unable to load playback history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadTheory = useCallback(async () => {
    try {
      setTheoryLoading(true);
      setApiError(null);
      const entries = await fetchTheoryCatalog();
      setTheory(entries);
    } catch (error) {
      setApiError(
        error instanceof ColemanApiError
          ? error.message
          : "Unable to load theory roadmap.",
      );
    } finally {
      setTheoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasEntered) return;
    void fetchActiveSetlist();
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, [hasEntered, fetchActiveSetlist]);

  useEffect(() => {
    if (!hasEntered || activeTab !== "history") return;
    void loadHistory();
  }, [hasEntered, activeTab, loadHistory]);

  useEffect(() => {
    if (!hasEntered || activeTab !== "explore") return;
    void loadTheory();
  }, [hasEntered, activeTab, loadTheory]);

  const openFeatureRoute = async (url: string) => {
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
  };

  const uploadAudioPayload = async (trackId: string) => {
    try {
      setUploading(true);
      setApiError(null);

      const docResult = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (docResult.canceled || !docResult.assets?.length) {
        return;
      }

      const fileAsset = docResult.assets[0];
      const formPayload = new FormData();
      formPayload.append("stem", {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: fileAsset.mimeType || "audio/mpeg",
      } as unknown as Blob);

      await uploadStem(trackId, formPayload);
      await fetchActiveSetlist();
    } catch (error) {
      setApiError(
        error instanceof ColemanApiError
          ? error.message
          : "Server rejected the audio file stream.",
      );
    } finally {
      setUploading(false);
    }
  };

  const executeTrackAudioSession = async (track: TrackItem) => {
    if (currentlyPlayingTrackId === track.id && activePlaybackSound) {
      await activePlaybackSound.stopAsync();
      await activePlaybackSound.unloadAsync();
      setActivePlaybackSound(null);
      soundRef.current = null;
      setCurrentlyPlayingTrackId(null);
      return;
    }

    if (track.audioFiles.length === 0) {
      setApiError("Upload a loop or stem before playing this track.");
      return;
    }

    try {
      setApiError(null);

      await getStageRoutingManager().initialize();
      await getStageRoutingManager().setRoutingProfile(
        getStageRoutingManager().getState().routingProfile,
      );
      getStageRoutingManager().setHeadphoneUnplugHandler(() => {
        void (async () => {
          if (activePlaybackSound) {
            await activePlaybackSound.pauseAsync();
          }
        })();
      });

      if (activePlaybackSound) {
        await activePlaybackSound.unloadAsync();
      }

      await getStageRoutingManager().setRoutingProfile(
        getStageRoutingManager().getState().routingProfile,
      );

      const { COLEMAN_API } = await import("./config/environment");
      const remoteResourceTarget = COLEMAN_API.audioStream(track.audioFiles[0]);
      const { sound } = await Audio.Sound.createAsync(
        { uri: remoteResourceTarget },
        { shouldPlay: true, isLooping: true },
      );

      soundRef.current = sound;
      setActivePlaybackSound(sound);
      setCurrentlyPlayingTrackId(track.id);
      await recordPlayback(track.id);
    } catch (error) {
      setApiError(
        error instanceof ColemanApiError
          ? error.message
          : "Could not stream this audio file.",
      );
    }
  };

  const globalKillAllTracks = async () => {
    if (activePlaybackSound) {
      await activePlaybackSound.stopAsync();
      await activePlaybackSound.unloadAsync();
      setActivePlaybackSound(null);
      soundRef.current = null;
      setCurrentlyPlayingTrackId(null);
    }
  };

  const formatTrackMeta = (track: TrackItem) => {
    const key = track.musicalKey || "Open";
    const bpm = track.bpm ? `${track.bpm} BPM` : "Var. Tempo";
    const duration = track.duration && track.duration !== "—" ? track.duration : "—";
    return `${key} • ${bpm} • ${duration}`;
  };

  const libraryTracks = setlist.filter((track) => track.audioFiles.length > 0);

  const renderErrorBanner = () =>
    apiError ? (
      <View style={styles.errorBanner}>
        <Text style={styles.errorBannerText}>{apiError}</Text>
        <TouchableOpacity onPress={() => setApiError(null)} accessibilityLabel="Dismiss error">
          <Text style={styles.errorDismiss}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  const renderHome = () => (
    <>
      <View style={styles.featureGrid}>
        {FEATURE_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.featureCard}
            activeOpacity={0.85}
            onPress={() => void openFeatureRoute(card.href)}
          >
            <View style={styles.iconPod}>
              <Ionicons name={card.icon} size={24} color={BRAND.textPrimary} />
            </View>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureSubtitle}>{card.subtitle}</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={BRAND.textSecondary}
              style={styles.featureChevron}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.glassPanel}>
        <View style={styles.setlistHeader}>
          <Text style={styles.panelHeading}>SERVICE SETLIST</Text>
          <Text style={styles.songCount}>{setlist.length} SONGS</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={BRAND.textPrimary} style={{ marginVertical: 24 }} />
        ) : setlist.length === 0 ? (
          <Text style={styles.emptyCopy}>No songs in the service setlist yet.</Text>
        ) : (
          setlist.map((track) => {
            const isPlaying = currentlyPlayingTrackId === track.id;
            return (
              <View key={track.id} style={[styles.trackRow, isPlaying && styles.trackRowActive]}>
                <TouchableOpacity
                  style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                  onPress={() => void executeTrackAudioSession(track)}
                >
                  <Ionicons
                    name={isPlaying ? "pause-outline" : "play-outline"}
                    size={14}
                    color={isPlaying ? BRAND.accentGold : BRAND.textPrimary}
                    style={!isPlaying ? { marginLeft: 2 } : undefined}
                  />
                </TouchableOpacity>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackMeta}>{formatTrackMeta(track)}</Text>
                  {track.audioFiles.length > 0 ? (
                    <Text style={styles.stemBadge} numberOfLines={1}>
                      {track.audioFiles.length} stem{track.audioFiles.length > 1 ? "s" : ""} attached
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.menuBtn}
                  onPress={() => void uploadAudioPayload(track.id)}
                  disabled={uploading}
                >
                  <MoreVerticalIcon />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </>
  );

  const renderExplore = () => (
    <View style={styles.glassPanel}>
      <Text style={styles.panelHeading}>EXPLORE TOOLS</Text>
      <Text style={styles.sectionSub}>Open production tools in your browser</Text>
      {FEATURE_CARDS.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={styles.linkRow}
          onPress={() => void openFeatureRoute(card.href)}
        >
          <Text style={styles.linkRowTitle}>{card.title}</Text>
          <Ionicons name="open-outline" size={16} color={BRAND.textSecondary} />
        </TouchableOpacity>
      ))}

      <Text style={[styles.panelHeading, { marginTop: 20 }]}>THEORY PREVIEW</Text>
      {theoryLoading ? (
        <ActivityIndicator size="small" color={BRAND.textPrimary} style={{ marginVertical: 16 }} />
      ) : theory.length === 0 ? (
        <Text style={styles.emptyCopy}>No theory progressions loaded.</Text>
      ) : (
        theory.slice(0, 3).map((entry) => (
          <View key={entry.id} style={styles.theoryRow}>
            <Text style={styles.trackTitle}>{entry.title}</Text>
            <Text style={styles.trackMeta}>{entry.nashvilleNumbers}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.glassPanel}>
      <Text style={styles.panelHeading}>PLAYBACK HISTORY</Text>
      {historyLoading ? (
        <ActivityIndicator size="small" color={BRAND.textPrimary} style={{ marginVertical: 24 }} />
      ) : history.length === 0 ? (
        <Text style={styles.emptyCopy}>No playback history recorded yet.</Text>
      ) : (
        history.map((entry) => (
          <View key={entry.id} style={styles.trackRow}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{entry.title}</Text>
              <Text style={styles.trackMeta}>{new Date(entry.playedAt).toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderLibrary = () => (
    <View style={styles.glassPanel}>
      <Text style={styles.panelHeading}>LIBRARY</Text>
      {loading ? (
        <ActivityIndicator size="small" color={BRAND.textPrimary} style={{ marginVertical: 24 }} />
      ) : libraryTracks.length === 0 ? (
        <Text style={styles.emptyCopy}>
          No uploaded stems in the library yet. Upload from a setlist track menu.
        </Text>
      ) : (
        libraryTracks.map((track) => (
          <View key={track.id} style={styles.trackRow}>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackMeta}>
                {track.audioFiles.length} file{track.audioFiles.length > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "explore":
        return renderExplore();
      case "history":
        return renderHistory();
      case "library":
        return renderLibrary();
      default:
        return null;
    }
  };

  const handleHomePlay = async () => {
    if (currentlyPlayingTrackId && activePlaybackSound) {
      await globalKillAllTracks();
      return;
    }

    try {
      setPlayBusy(true);
      setApiError(null);
      const playable = setlist.find((track) => track.audioFiles.length > 0);
      if (!playable) {
        setApiError("Upload a loop or stem before playing.");
        return;
      }
      await executeTrackAudioSession(playable);
    } finally {
      setPlayBusy(false);
    }
  };

  if (!hasEntered) {
    return <IntroScreen onEnter={() => setHasEntered(true)} />;
  }

  if (activeTab === "home") {
    return (
      <ColemanHomeScreen
        isPlaying={Boolean(currentlyPlayingTrackId)}
        playBusy={playBusy}
        playbackError={apiError}
        onDismissError={() => setApiError(null)}
        onPlayPress={() => void handleHomePlay()}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[...COLEMAN_CANVAS_GRADIENT]}
        locations={[0, 0.28, 0.58, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.glassCircleBtn}
            activeOpacity={0.7}
            onPress={() => setActiveTab("home")}
          >
            <Ionicons name="menu" size={20} color={BRAND.textPrimary} />
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <Image
              source={require("./assets/coleman_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="COLEMAN"
            />
          </View>

          <TouchableOpacity style={styles.avatar} onPress={() => setActiveTab("library")}>
            <Text style={styles.avatarInitial}>C</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderErrorBanner()}
          {renderTabContent()}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomNav}>
          {(
            [
              { id: "home" as NavTab, label: "HOME", icon: "home-outline" },
              { id: "explore" as NavTab, label: "EXPLORE", icon: "compass-outline" },
            ] as const
          ).map((item) => (
            <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id)}>
              <Ionicons
                name={item.icon}
                size={20}
                color={activeTab === item.id ? BRAND.accentGold : BRAND.textSecondary}
              />
              <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.centerPlayBtn} onPress={() => void globalKillAllTracks()} activeOpacity={0.9}>
            <View style={styles.centerPlayGlass}>
              <Ionicons name="stop-outline" size={22} color={BRAND.textPrimary} />
            </View>
          </TouchableOpacity>

          {(
            [
              { id: "history" as NavTab, label: "HISTORY", icon: "time-outline" },
              { id: "library" as NavTab, label: "LIBRARY", icon: "albums-outline" },
            ] as const
          ).map((item) => (
            <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id)}>
              <Ionicons
                name={item.icon}
                size={20}
                color={activeTab === item.id ? BRAND.accentGold : BRAND.textSecondary}
              />
              <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

function MoreVerticalIcon() {
  return <Ionicons name="ellipsis-vertical" size={16} color={BRAND.textSecondary} />;
}

const BRAND = {
  bgPrimary: COLEMAN_BRAND.bgPrimary,
  bgSecondary: COLEMAN_BRAND.bgSecondary,
  surface: COLEMAN_BRAND.surface,
  border: COLEMAN_BRAND.border,
  textPrimary: COLEMAN_BRAND.textPrimary,
  textSecondary: COLEMAN_BRAND.textSecondary,
  accentGold: COLEMAN_BRAND.accentGold,
  accentPlatinum: COLEMAN_BRAND.accentPlatinum,
  shadow: "rgba(0, 0, 0, 0.08)",
} as const;

const GLASS_BG = BRAND.surface;
const GLASS_BORDER = BRAND.border;
const ESPRESSO = BRAND.textPrimary;
const MUTED = BRAND.textSecondary;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.bgPrimary },
  safeArea: { flex: 1 },
  header: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  logoImage: { height: 72, width: 220 },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 13, fontWeight: "500", color: ESPRESSO },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: BRAND.surface,
  },
  errorBannerText: { flex: 1, fontSize: 11, color: ESPRESSO, lineHeight: 16 },
  errorDismiss: { fontSize: 9, fontWeight: "500", color: MUTED, letterSpacing: 1 },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  featureCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: GLASS_BG,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    minHeight: 158,
  },
  iconPod: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: ESPRESSO,
    marginBottom: 4,
  },
  featureSubtitle: { fontSize: 10, color: MUTED, fontWeight: "400" },
  featureChevron: { position: "absolute", right: 14, top: 16 },
  glassPanel: {
    backgroundColor: GLASS_BG,
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  panelHeading: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    color: ESPRESSO,
    marginBottom: 14,
  },
  sectionSub: { fontSize: 10, color: MUTED, marginBottom: 12, marginTop: -8 },
  setlistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  songCount: { fontSize: 9, fontWeight: "500", letterSpacing: 1, color: MUTED },
  emptyCopy: {
    paddingVertical: 20,
    textAlign: "center",
    fontSize: 11,
    color: MUTED,
    lineHeight: 18,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)",
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderBottomColor: "transparent",
    borderWidth: 1,
    borderColor: BRAND.accentGold,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderColor: BRAND.accentGold,
  },
  trackInfo: { flex: 1 },
  trackTitle: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.6,
    color: ESPRESSO,
  },
  trackMeta: { fontSize: 10, color: MUTED, marginTop: 3, fontWeight: "400" },
  stemBadge: { fontSize: 9, color: BRAND.accentGold, marginTop: 3 },
  menuBtn: { padding: 8 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)",
  },
  linkRowTitle: { fontSize: 10, fontWeight: "500", letterSpacing: 0.6, color: ESPRESSO },
  theoryRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.35)" },
  bottomNav: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 6 : 14,
    backgroundColor: "rgba(255,255,255,0.52)",
    borderTopWidth: 1,
    borderTopColor: GLASS_BORDER,
  },
  navItem: { alignItems: "center", minWidth: 56, paddingBottom: 4 },
  navLabel: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1,
    color: MUTED,
    marginTop: 4,
  },
  navLabelActive: { color: ESPRESSO },
  centerPlayBtn: { marginBottom: 14, marginTop: -22 },
  centerPlayGlass: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
});
