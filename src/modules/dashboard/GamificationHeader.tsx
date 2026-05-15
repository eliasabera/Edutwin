import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

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
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.centerpiece}>
        <View style={[styles.centerRingOuter, isDark && styles.centerRingOuterDark]}>
          <View style={[styles.centerRingInner, isDark && styles.centerRingInnerDark]}>
            <Ionicons name="flame" size={28} color="#F97316" />
          </View>
        </View>
        <Text style={[styles.streakNumber, isDark && styles.streakNumberDark]}>{currentStreak}</Text>
        <Text style={[styles.streakLabel, isDark && styles.streakLabelDark]}>Day streak</Text>
      </View>

      <Text style={[styles.title, isDark && styles.titleDark]}>Keep the learning fire active</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        Every quiz, teacher assessment, and practice set makes the digital twin
        sharper and more personal.
      </Text>

      <View style={styles.chipRow}>
        <View style={[styles.chipWarm, isDark && styles.chipWarmDark]}>
          <Ionicons name="trophy-outline" size={16} color="#1D4ED8" />
          <Text style={[styles.chipWarmText, isDark && styles.chipWarmTextDark]}>
            {unlockedAchievements} unlocked
          </Text>
        </View>
        <View style={[styles.chipCool, isDark && styles.chipCoolDark]}>
          <Ionicons name="flash-outline" size={16} color="#7C3AED" />
          <Text style={[styles.chipCoolText, isDark && styles.chipCoolTextDark]}>Best streak {bestStreak}</Text>
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
  cardDark: {
    backgroundColor: "#0E1A2C",
    borderColor: "#22324E",
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
  centerRingOuterDark: {
    backgroundColor: "#2A2217",
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
  centerRingInnerDark: {
    backgroundColor: "#121C2E",
    borderColor: "#3A4E70",
  },
  streakNumber: {
    marginTop: 12,
    color: "#102445",
    fontSize: 34,
    fontWeight: "900",
  },
  streakNumberDark: {
    color: "#F4F7FB",
  },
  streakLabel: {
    color: "#8C5C00",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  streakLabelDark: {
    color: "#F9C67A",
  },
  title: {
    marginTop: 18,
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
  },
  titleDark: {
    color: "#F4F7FB",
  },
  subtitle: {
    marginTop: 8,
    color: "#718096",
    lineHeight: 20,
  },
  subtitleDark: {
    color: "#AAB7CF",
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
  chipWarmDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  chipWarmText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  chipWarmTextDark: {
    color: "#BFD6FF",
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
  chipCoolDark: {
    backgroundColor: "#2A2217",
    borderColor: "#5B4520",
  },
  chipCoolText: {
    color: "#8C5C00",
    fontSize: 12,
    fontWeight: "800",
  },
  chipCoolTextDark: {
    color: "#FFD59A",
  },
});
