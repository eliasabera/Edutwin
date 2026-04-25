import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

type Props = {
  digitalTwinSignals: number;
  teacherAssessmentsCompleted: number;
  aiPracticeCompleted: number;
  lastEventLabel: string;
};

export default function SyncIndicator({
  digitalTwinSignals,
  teacherAssessmentsCompleted,
  aiPracticeCompleted,
  lastEventLabel,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const readinessPercent = Math.min(
    100,
    Math.round((digitalTwinSignals / 8) * 100),
  );

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Digital twin sync</Text>
        <View style={[styles.syncBadge, isDark && styles.syncBadgeDark]}>
          <Ionicons name="sync-outline" size={14} color="#0B5FFF" />
          <Text style={[styles.syncLabel, isDark && styles.syncLabelDark]}>{readinessPercent}% synced</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        Teacher quizzes and assessments shape the twin faster than AI-only
        practice.
      </Text>

      <View style={[styles.metricHero, isDark && styles.metricHeroDark]}>
        <Text style={[styles.metricHeroLabel, isDark && styles.metricHeroLabelDark]}>Twin evidence score</Text>
        <Text style={[styles.metricHeroValue, isDark && styles.metricHeroValueDark]}>{digitalTwinSignals}</Text>
      </View>

      <View style={styles.metricStack}>
        <View style={[styles.metricCardWide, isDark && styles.metricCardWideDark]}>
          <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>{teacherAssessmentsCompleted}</Text>
          <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Teacher evidence</Text>
        </View>
        <View style={styles.metricRowBottom}>
          <View style={[styles.metricCardSmall, isDark && styles.metricCardSmallDark]}>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>{aiPracticeCompleted}</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>AI sessions</Text>
          </View>
          <View style={[styles.metricCardSmallAlt, isDark && styles.metricCardSmallAltDark]}>
            <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>{readinessPercent}%</Text>
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Readiness</Text>
          </View>
        </View>
      </View>

      <View style={[styles.eventCard, isDark && styles.eventCardDark]}>
        <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]}>Latest learning signal</Text>
        <Text style={[styles.eventText, isDark && styles.eventTextDark]}>{lastEventLabel}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A202C",
  },
  titleDark: {
    color: "#F4F7FB",
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF5FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  syncBadgeDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  syncLabel: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  syncLabelDark: {
    color: "#BFD6FF",
  },
  subtitle: {
    marginTop: 10,
    color: "#718096",
    lineHeight: 20,
  },
  subtitleDark: {
    color: "#AAB7CF",
  },
  metricHero: {
    marginTop: 16,
    backgroundColor: "#102445",
    borderRadius: 20,
    padding: 16,
  },
  metricHeroDark: {
    backgroundColor: "#17253A",
  },
  metricHeroLabel: {
    color: "#B9CAEE",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricHeroLabelDark: {
    color: "#B9CAEE",
  },
  metricHeroValue: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: "900",
    color: "white",
  },
  metricHeroValueDark: {
    color: "#F4F7FB",
  },
  metricStack: {
    marginTop: 16,
    gap: 10,
  },
  metricCardWide: {
    backgroundColor: "#EEF5FF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  metricCardWideDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  metricRowBottom: {
    flexDirection: "row",
    gap: 10,
  },
  metricCardSmall: {
    flex: 1,
    backgroundColor: "#EEF5FF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  metricCardSmallDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  metricCardSmallAlt: {
    flex: 1,
    backgroundColor: "#FFF4E5",
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: "#FFD5A1",
  },
  metricCardSmallAltDark: {
    backgroundColor: "#2A2217",
    borderColor: "#5B4520",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#102445",
  },
  metricValueDark: {
    color: "#F4F7FB",
  },
  metricLabel: {
    marginTop: 4,
    color: "#5F7190",
    fontSize: 12,
    fontWeight: "700",
  },
  metricLabelDark: {
    color: "#AAB7CF",
  },
  eventCard: {
    marginTop: 16,
    backgroundColor: "#F7FAFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  eventCardDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  eventTitle: {
    color: "#5A6C87",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "700",
  },
  eventTitleDark: {
    color: "#BFD6FF",
  },
  eventText: {
    marginTop: 8,
    color: "#173153",
    lineHeight: 20,
    fontWeight: "600",
  },
  eventTextDark: {
    color: "#F4F7FB",
  },
});
