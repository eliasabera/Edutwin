import { StyleSheet, Text, View } from "react-native";

type Props = {
  masteryScore: number;
  supportSubjects: string[];
  strongSubjects: string[];
};

export default function MasteryChart({
  masteryScore,
  supportSubjects,
  strongSubjects,
}: Props) {
  const fillWidth = Math.max(8, Math.min(100, masteryScore));

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Twin analysis</Text>
      <Text style={styles.title}>Current mastery profile</Text>

      <View style={styles.scoreRingWrap}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>{masteryScore}%</Text>
          <Text style={styles.scoreLabel}>confidence</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${fillWidth}%` as `${number}%` }]}
        />
      </View>
      <Text style={styles.masteryText}>{masteryScore}% mastery confidence</Text>

      <View style={styles.stack}>
        <View style={styles.columnStrong}>
          <Text style={styles.listTitle}>Strong subjects</Text>
          <Text style={styles.listText}>
            {strongSubjects.length
              ? strongSubjects.join(", ")
              : "No strong subjects recorded yet"}
          </Text>
        </View>

        <View style={styles.columnSupport}>
          <Text style={styles.listTitle}>Support focus</Text>
          <Text style={styles.listText}>
            {supportSubjects.length
              ? supportSubjects.join(", ")
              : "No support subjects recorded yet"}
          </Text>
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
  eyebrow: {
    color: "#718096",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    color: "#1A202C",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
  },
  scoreRingWrap: {
    alignItems: "center",
    marginVertical: 10,
  },
  scoreRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 10,
    borderColor: "#D6E4FF",
    backgroundColor: "#F8FBFF",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0B5FFF",
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#5A6C87",
  },
  track: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "#EAF0FA",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0B5FFF",
  },
  masteryText: {
    marginTop: 10,
    color: "#27466F",
    fontWeight: "700",
    textAlign: "center",
  },
  stack: {
    marginTop: 16,
    gap: 12,
  },
  columnStrong: {
    backgroundColor: "#EEF5FF",
    borderRadius: 18,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#0B5FFF",
  },
  columnSupport: {
    backgroundColor: "#FFF4E5",
    borderRadius: 18,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#F7C948",
  },
  listTitle: {
    color: "#5A6C87",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 8,
  },
  listText: {
    color: "#173153",
    lineHeight: 20,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
