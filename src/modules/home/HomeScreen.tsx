import { useGamification } from "@/shared/services/gamification";
import { useStudentProfile } from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const gamification = useGamification();

  const focusSubject = studentProfile.supportSubjects[0] || "biology";
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
        <View style={styles.energyWrap}>
          <View style={styles.energyAura} />

          <View style={styles.energyStatLeft}>
            <Ionicons name="flame" size={19} color="#FF9600" />
            <Text style={styles.energyStatValue}>
              {gamification.currentStreak}
            </Text>
            <Text style={styles.energyStatLabel}>Streak</Text>
          </View>

          <View style={styles.energyStatRight}>
            <Ionicons name="diamond" size={19} color="#0B5FFF" />
            <Text style={styles.energyStatValue}>{totalXp}</Text>
            <Text style={styles.energyStatLabel}>XP</Text>
          </View>

          <View style={styles.energyRingShell}>
            <View style={styles.energyRingTrack} />
            <View
              style={[
                styles.energyRingProgress,
                {
                  transform: [
                    {
                      rotate: `${Math.max(8, Math.round((readinessPercent / 100) * 360))}deg`,
                    },
                  ],
                },
              ]}
            />

            <View style={styles.energyCore}>
              <Text style={styles.energyGrade}>
                Grade {studentProfile.grade}
              </Text>
              <Text style={styles.energySubject}>{focusSubject}</Text>
              <Text style={styles.energyReadiness}>
                {readinessPercent}% ready
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionZone}>
        <TouchableOpacity activeOpacity={0.86} style={styles.actionOrb}>
          <View style={styles.actionOrbInner}>
            <Ionicons name="flash" size={34} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.actionTitle}>Start Daily Mission</Text>
        <Text style={styles.actionSubtitle}>
          Continue {focusSubject} with your AI twin
        </Text>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
  },
  energyWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  energyAura: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(11, 95, 255, 0.05)",
  },
  energyRingShell: {
    width: 208,
    height: 208,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  energyRingTrack: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 999,
    borderWidth: 11,
    borderColor: "#D9E6FF",
  },
  energyRingProgress: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 999,
    borderWidth: 11,
    borderColor: "transparent",
    borderTopColor: "#0B5FFF",
    borderRightColor: "#FF9600",
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  energyCore: {
    width: 156,
    height: 156,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  energyGrade: {
    color: "#1A202C",
    fontWeight: "800",
    fontSize: 20,
  },
  energySubject: {
    color: "#5A6C87",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "capitalize",
  },
  energyReadiness: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  energyStatLeft: {
    position: "absolute",
    left: 34,
    top: 70,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 150, 0, 0.22)",
    shadowColor: "#FF9600",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  energyStatRight: {
    position: "absolute",
    right: 34,
    top: 70,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
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
    fontSize: 16,
  },
  energyStatLabel: {
    color: "#718096",
    fontWeight: "600",
    fontSize: 11,
  },
  actionZone: {
    marginTop: 14,
    alignItems: "center",
  },
  actionOrb: {
    width: 152,
    height: 152,
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
  actionOrbInner: {
    width: 94,
    height: 94,
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
    marginTop: 16,
    color: "#1A202C",
    fontSize: 24,
    fontWeight: "800",
  },
  actionSubtitle: {
    marginTop: 4,
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  glassDrawer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.1)",
    paddingTop: 10,
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
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
  tileRow: {
    paddingHorizontal: 18,
    gap: 12,
    paddingBottom: 4,
  },
  glassTile: {
    width: 118,
    height: 118,
    borderRadius: 20,
    padding: 12,
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowOpacity: 0.22,
    shadowRadius: 10,
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
