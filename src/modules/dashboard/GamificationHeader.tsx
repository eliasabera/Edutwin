import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  currentStreak: number;
  bestStreak: number;
  unlockedAchievements: number;
};

export default function GamificationHeader({
  currentStreak,
  bestStreak,
  unlockedAchievements,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.centerpiece}>
        <View style={styles.centerRingOuter}>
          <View style={styles.centerRingInner}>
            <Ionicons name="flame" size={28} color="#F97316" />
          </View>
        </View>
        <Text style={styles.streakNumber}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>Day streak</Text>
      </View>

      <Text style={styles.title}>Keep the learning fire active</Text>
      <Text style={styles.subtitle}>
        Every quiz, teacher assessment, and practice set makes the digital twin
        sharper and more personal.
      </Text>

      <View style={styles.chipRow}>
        <View style={styles.chipWarm}>
          <Ionicons name="trophy-outline" size={16} color="#1D4ED8" />
          <Text style={styles.chipWarmText}>
            {unlockedAchievements} unlocked
          </Text>
        </View>
        <View style={styles.chipCool}>
          <Ionicons name="flash-outline" size={16} color="#7C3AED" />
          <Text style={styles.chipCoolText}>Best streak {bestStreak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  centerpiece: {
    alignItems: "center",
  },
  centerRingOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
  },
  centerRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFD5A1",
    justifyContent: "center",
    alignItems: "center",
  },
  streakNumber: {
    marginTop: 12,
    color: "#102445",
    fontSize: 34,
    fontWeight: "900",
  },
  streakLabel: {
    color: "#8C5C00",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    marginTop: 18,
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    color: "#718096",
    lineHeight: 20,
  },
  chipRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chipWarm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  chipWarmText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  chipCool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF4E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#FFD5A1",
  },
  chipCoolText: {
    color: "#8C5C00",
    fontSize: 12,
    fontWeight: "800",
  },
});
