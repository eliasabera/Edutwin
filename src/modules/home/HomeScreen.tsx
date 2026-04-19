import {
  fetchStudentProfile,
  setCachedStudentProfile
} from "@/shared/services/auth-service";
import { useGamification } from "@/shared/services/gamification";
import { getStudentProfile, updateStudentProfile, useStudentProfile } from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const studentProfile = useStudentProfile();
  const gamification = useGamification();
  const thunderPulse = useRef(new Animated.Value(0)).current;
  const commandFeedScrollRef = useRef<ScrollView>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTileIndex, setActiveTileIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const syncProfile = async () => {
        if (isMounted) {
          setIsSyncing(true);
        }

        try {
          const latestProfile = await fetchStudentProfile({ forceRefresh: true });
          if (!isMounted) return;

          setCachedStudentProfile(latestProfile);

          const currentProfile = getStudentProfile();
          updateStudentProfile({
            fullName: latestProfile.full_name || currentProfile.fullName,
            grade: String(latestProfile.grade_level ?? latestProfile.grade ?? currentProfile.grade),
            preferredLanguage: latestProfile.language === "om" ? "om" : "en",
            masteryScore:
              typeof latestProfile.mastery_score === "number"
                ? latestProfile.mastery_score
                : currentProfile.masteryScore,
            performanceBand:
              latestProfile.performance_band === "top"
                ? "top"
                : latestProfile.performance_band === "support" || latestProfile.performance_band === "low"
                  ? "support"
                  : latestProfile.performance_band === "medium"
                    ? "medium"
                    : currentProfile.performanceBand,
            twinName: latestProfile.twin_name || currentProfile.twinName,
            supportSubjects:
              Array.isArray(latestProfile.support_subjects) && latestProfile.support_subjects.length > 0
                ? (latestProfile.support_subjects.filter((item) =>
                    ["biology", "chemistry", "physics", "math"].includes(item),
                  ) as typeof currentProfile.supportSubjects)
                : currentProfile.supportSubjects,
            strongSubjects:
              Array.isArray(latestProfile.strong_subjects) && latestProfile.strong_subjects.length > 0
                ? (latestProfile.strong_subjects.filter((item) =>
                    ["biology", "chemistry", "physics", "math"].includes(item),
                  ) as typeof currentProfile.strongSubjects)
                : currentProfile.strongSubjects,
            diagnosticCompleted:
              typeof latestProfile.diagnostic_completed === "boolean"
                ? latestProfile.diagnostic_completed
                : currentProfile.diagnosticCompleted,
            xp: typeof latestProfile.xp === "number" ? latestProfile.xp : currentProfile.xp,
            streak:
              typeof latestProfile.streak === "number" ? latestProfile.streak : currentProfile.streak,
            lastActive:
              typeof latestProfile.last_active === "string"
                ? latestProfile.last_active
                : currentProfile.lastActive,
          });
        } catch {
          // Keep the last known profile when the backend is unavailable.
        } finally {
          if (isMounted) {
            setIsSyncing(false);
          }
        }
      };

      void syncProfile();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(thunderPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(thunderPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [thunderPulse]);

  const unlockedAchievements = gamification.achievements.filter(
    (achievement) => achievement.unlocked,
  );
  const readinessPercent = Math.min(
    100,
    Math.round((gamification.digitalTwinSignals / 8) * 100),
  );
  const localEstimatedXp =
    gamification.totalPracticeCompleted * 25 +
    gamification.teacherAssessmentsCompleted * 50 +
    gamification.aiPracticeCompleted * 2 +
    unlockedAchievements.length * 10;
  const totalXp = Math.max(studentProfile.xp ?? 0, localEstimatedXp);
  const activeStreak = Math.max(studentProfile.streak ?? 0, gamification.currentStreak);
  const studentRank = Math.max(1, Math.floor(totalXp / 120) + 1);
  const drawerTiles = [
    {
      id: "sync",
      icon: "sync-outline",
      label: "Twin Sync",
      value: `${readinessPercent}%`,
      accent: "#0B5FFF",
      glow: "rgba(11, 95, 255, 0.18)",
    },
    {
      id: "streak",
      icon: "flame",
      label: "Current Streak",
      value: `${activeStreak}`,
      accent: "#FF9600",
      glow: "rgba(255, 150, 0, 0.2)",
    },
    {
      id: "xp",
      icon: "diamond",
      label: "Total XP",
      value: `${totalXp}`,
      accent: "#0B5FFF",
      glow: "rgba(11, 95, 255, 0.18)",
    },
    {
      id: "achievements",
      icon: "trophy",
      label: "Unlocked",
      value: `${unlockedAchievements.length}`,
      accent: "#FF9600",
      glow: "rgba(255, 150, 0, 0.2)",
    },
  ] as const;

  const scrollToTile = (direction: "prev" | "next") => {
    const nextIndex =
      direction === "prev"
        ? Math.max(0, activeTileIndex - 1)
        : Math.min(drawerTiles.length - 1, activeTileIndex + 1);

    if (nextIndex === activeTileIndex) {
      return;
    }

    commandFeedScrollRef.current?.scrollTo({
      x: nextIndex * 136,
      animated: true,
    });
    setActiveTileIndex(nextIndex);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <View style={styles.rankBadge}>
            <Ionicons name="podium-outline" size={14} color="#0B5FFF" />
            <Text style={styles.rankBadgeText}>Rank {studentRank}</Text>
          </View>
          {isSyncing && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>Syncing</Text>
            </View>
          )}
        </View>

        <View style={styles.energyWrap}>
          <View style={styles.energyStatLeft}>
            <Ionicons name="flame" size={19} color="#FF9600" />
            <Text style={styles.energyStatValue}>{activeStreak}</Text>
            <Text style={styles.energyStatLabel}>Streak</Text>
          </View>

          <View style={styles.energyRingShell}>
            <View style={styles.energyRingTrack} />
            <View
              style={[
                styles.energyRingProgress,
                {
                  transform: [
                    {
                      rotate: `${Math.max(
                        8,
                        Math.round((readinessPercent / 100) * 360),
                      )}deg`,
                    },
                  ],
                },
              ]}
            />

            <View style={styles.energyCore}>
              <Text style={styles.energyCoreLabel}>Twin</Text>
              <Text style={styles.energyName} numberOfLines={2}>
                {studentProfile.twinName || "EduTwin"}
              </Text>
              <Text style={styles.energyRankText}>Rank {studentRank}</Text>
            </View>
          </View>

          <View style={styles.energyStatRight}>
            <Ionicons name="diamond" size={19} color="#0B5FFF" />
            <Text style={styles.energyStatValue}>{totalXp}</Text>
            <Text style={styles.energyStatLabel}>XP</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionZone}>
        <Pressable onPress={() => router.push("/ai-tutor" as never)}>
          <Animated.View
            style={[
              styles.actionOrb,
              {
                transform: [
                  {
                    scale: thunderPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.06],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.actionOrbAura} />
            <View style={styles.actionOrbInner}>
              <Ionicons name="flash" size={34} color="#FFFFFF" />
            </View>
          </Animated.View>
        </Pressable>
      </View>

      <View style={[styles.glassDrawer, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.drawerHeaderRow}>
          <Text style={styles.drawerTitle}>Command Feed</Text>
          <View style={styles.drawerNavRow}>
            <Pressable
              style={[styles.drawerNavButton, activeTileIndex === 0 && styles.drawerNavButtonDisabled]}
              onPress={() => scrollToTile("prev")}
              disabled={activeTileIndex === 0}
            >
              <Ionicons name="chevron-back" size={16} color={activeTileIndex === 0 ? "#A8B6CF" : "#0B5FFF"} />
              <Text style={[styles.drawerNavText, activeTileIndex === 0 && styles.drawerNavTextDisabled]}>Prev</Text>
            </Pressable>
            <Pressable
              style={[
                styles.drawerNavButton,
                activeTileIndex === drawerTiles.length - 1 && styles.drawerNavButtonDisabled,
              ]}
              onPress={() => scrollToTile("next")}
              disabled={activeTileIndex === drawerTiles.length - 1}
            >
              <Text
                style={[
                  styles.drawerNavText,
                  activeTileIndex === drawerTiles.length - 1 && styles.drawerNavTextDisabled,
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={activeTileIndex === drawerTiles.length - 1 ? "#A8B6CF" : "#0B5FFF"}
              />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={commandFeedScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={130}
          snapToAlignment="start"
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(event.nativeEvent.contentOffset.x / 136);
            setActiveTileIndex(Math.max(0, Math.min(drawerTiles.length - 1, nextIndex)));
          }}
          contentContainerStyle={styles.tileRow}
        >
          {drawerTiles.map((tile) => (
            <View
              key={tile.id}
              style={[
                styles.glassTile,
                {
                  shadowColor: tile.glow,
                },
              ]}
            >
              <View
                style={[
                  styles.tileIconWrap,
                  {
                    backgroundColor: `${tile.accent}14`,
                    borderColor: `${tile.accent}44`,
                  },
                ]}
              >
                <Ionicons name={tile.icon} size={18} color={tile.accent} />
              </View>

              <Text style={styles.tileValue}>{tile.value}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  headerArea: {
    alignItems: "center",
    paddingHorizontal: 18,
  },
  brandRow: {
    width: "100%",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 6,
    gap: 10,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.18)",
  },
  rankBadgeText: {
    color: "#0B5FFF",
    fontWeight: "800",
    fontSize: 12,
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(11, 95, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.15)",
  },
  syncBadgeText: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 11,
  },
  energyWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    gap: 8,
  },
  energyRingShell: {
    width: 186,
    height: 186,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  energyRingTrack: {
    position: "absolute",
    width: 186,
    height: 186,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: "#D9E6FF",
  },
  energyRingProgress: {
    position: "absolute",
    width: 186,
    height: 186,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: "transparent",
    borderTopColor: "#0B5FFF",
    borderRightColor: "#FF9600",
  },
  energyCore: {
    width: 136,
    height: 136,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 10,
    shadowColor: "#0E234E",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  energyCoreLabel: {
    color: "#6B7A99",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  energyName: {
    color: "#1A202C",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  energyRankText: {
    color: "#0B5FFF",
    fontWeight: "800",
    fontSize: 11,
  },
  energyStatLeft: {
    minWidth: 70,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 150, 0, 0.22)",
    shadowColor: "#FF9600",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  energyStatRight: {
    minWidth: 70,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.22)",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  energyStatValue: {
    marginTop: 2,
    color: "#1A202C",
    fontWeight: "800",
    fontSize: 14,
  },
  energyStatLabel: {
    color: "#718096",
    fontWeight: "600",
    fontSize: 10,
  },
  actionZone: {
    marginTop: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  actionOrb: {
    width: 154,
    height: 154,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  actionOrbAura: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(11, 95, 255, 0.08)",
  },
  actionOrbInner: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  glassDrawer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: "38%",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.1)",
    paddingTop: 12,
    shadowColor: "#0E234E",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  drawerHeaderRow: {
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerTitle: {
    color: "#1A202C",
    fontSize: 18,
    fontWeight: "800",
  },
  drawerNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  drawerNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.35)",
  },
  drawerNavButtonDisabled: {
    borderColor: "rgba(168, 182, 207, 0.45)",
  },
  drawerNavText: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  drawerNavTextDisabled: {
    color: "#A8B6CF",
  },
  tileRow: {
    paddingHorizontal: 18,
    gap: 12,
    paddingBottom: 10,
  },
  glassTile: {
    width: 124,
    height: 124,
    borderRadius: 24,
    padding: 14,
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
  },
  tileLabel: {
    color: "#718096",
    fontSize: 12,
    fontWeight: "600",
  },
});