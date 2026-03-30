import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

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
  const readinessPercent = Math.min(
    100,
    Math.round((digitalTwinSignals / 8) * 100),
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital twin sync</Text>
        <View style={styles.syncBadge}>
          <Ionicons name="sync-outline" size={14} color="#0B5FFF" />
          <Text style={styles.syncLabel}>{readinessPercent}% synced</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Teacher quizzes and assessments shape the twin faster than AI-only
        practice.
      </Text>

      <View style={styles.metricHero}>
        <Text style={styles.metricHeroLabel}>Twin evidence score</Text>
        <Text style={styles.metricHeroValue}>{digitalTwinSignals}</Text>
      </View>

      <View style={styles.metricStack}>
        <View style={styles.metricCardWide}>
          <Text style={styles.metricValue}>{teacherAssessmentsCompleted}</Text>
          <Text style={styles.metricLabel}>Teacher evidence</Text>
        </View>
        <View style={styles.metricRowBottom}>
          <View style={styles.metricCardSmall}>
            <Text style={styles.metricValue}>{aiPracticeCompleted}</Text>
            <Text style={styles.metricLabel}>AI sessions</Text>
          </View>
          <View style={styles.metricCardSmallAlt}>
            <Text style={styles.metricValue}>{readinessPercent}%</Text>
            <Text style={styles.metricLabel}>Readiness</Text>
          </View>
        </View>
      </View>

      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>Latest learning signal</Text>
        <Text style={styles.eventText}>{lastEventLabel}</Text>
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
  syncLabel: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  subtitle: {
    marginTop: 10,
    color: "#718096",
    lineHeight: 20,
  },
  metricHero: {
    marginTop: 16,
    backgroundColor: "#102445",
    borderRadius: 20,
    padding: 16,
  },
  metricHeroLabel: {
    color: "#B9CAEE",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metricHeroValue: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: "900",
    color: "white",
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
  metricCardSmallAlt: {
    flex: 1,
    backgroundColor: "#FFF4E5",
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    borderColor: "#FFD5A1",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#102445",
  },
  metricLabel: {
    marginTop: 4,
    color: "#5F7190",
    fontSize: 12,
    fontWeight: "700",
  },
  eventCard: {
    marginTop: 16,
    backgroundColor: "#F7FAFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  eventTitle: {
    color: "#5A6C87",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "700",
  },
  eventText: {
    marginTop: 8,
    color: "#173153",
    lineHeight: 20,
    fontWeight: "600",
  },
});
