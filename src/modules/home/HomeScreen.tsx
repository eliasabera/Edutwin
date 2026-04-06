import { useGamification } from "@/shared/services/gamification";
import { useStudentProfile } from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
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
  const totalXp =
    gamification.totalPracticeCompleted * 25 +
    gamification.teacherAssessmentsCompleted * 50 +
    unlockedAchievements.length * 10;
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
      value: `${gamification.currentStreak}`,
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
    {
      id: "teacher",
      icon: "school",
      label: "Teacher Signals",
      value: `${gamification.teacherAssessmentsCompleted}`,
      accent: "#0B5FFF",
      glow: "rgba(11, 95, 255, 0.18)",
    },
  ] as const;

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowBlue} />
      <View style={styles.bgGlowGold} />
      <View style={styles.bgGlowSky} />

      <View style={[styles.headerArea, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <View style={styles.rankBadge}>
            <Ionicons name="podium-outline" size={14} color="#0B5FFF" />
            <Text style={styles.rankBadgeText}>Rank {studentRank}</Text>
          </View>
        </View>

        <View style={styles.energyWrap}>
          <View style={styles.energyStatLeft}>
            <Ionicons name="flame" size={19} color="#FF9600" />
            <Text style={styles.energyStatValue}>{gamification.currentStreak}</Text>
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

        <Text style={styles.actionTitle}>Start Daily Mission</Text>
      </View>

      <View style={[styles.glassDrawer, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.drawerHandle} />

        <View style={styles.drawerHeaderRow}>
          <Text style={styles.drawerTitle}>Command Feed</Text>
          <Pressable style={styles.drawerPulseBadge}>
            <Ionicons name="sparkles" size={14} color="#0B5FFF" />
            <Text style={styles.drawerPulseText}>Live</Text>
          </Pressable>
        </View>

        <View style={styles.drawerHintRow}>
          <Ionicons name="chevron-back" size={16} color="#6B7A99" />
          <Text style={styles.drawerHintText}>Swipe for more cards</Text>
          <Ionicons name="chevron-forward" size={16} color="#6B7A99" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={130}
          snapToAlignment="start"
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
    backgroundColor: "#F4F7FC",
    overflow: "hidden",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -50,
    left: -70,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 8,
  },
  bgGlowGold: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    bottom: 120,
    right: -90,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
    shadowColor: "#FF9600",
    shadowOpacity: 0.28,
    shadowRadius: 42,
    elevation: 8,
  },
  bgGlowSky: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: "42%",
    left: "34%",
    backgroundColor: "rgba(30, 144, 255, 0.08)",
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
  actionTitle: {
    marginTop: 14,
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
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
  drawerHandle: {
    alignSelf: "center",
    width: 62,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(90, 108, 135, 0.35)",
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
  drawerPulseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.35)",
  },
  drawerPulseText: {
    color: "#5A6C87",
    fontWeight: "700",
    fontSize: 12,
  },
  drawerHintRow: {
    marginBottom: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  drawerHintText: {
    color: "#6B7A99",
    fontSize: 12,
    fontWeight: "600",
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