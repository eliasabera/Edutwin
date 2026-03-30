import type { PerformanceBand } from "@/shared/types/domain.types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  twinName: string;
  studentName: string;
  performanceBand: PerformanceBand;
  readinessPercent: number;
};

const bandLabel: Record<PerformanceBand, string> = {
  support: "Needs support",
  medium: "Steady growth",
  top: "Advanced pace",
};

export default function DigitalTwinAvatar({
  twinName,
  studentName,
  performanceBand,
  readinessPercent,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.orbitOuter}>
        <View style={styles.orbitMid}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCore}>
              <Ionicons name="sparkles" size={28} color="#0B5FFF" />
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.eyebrow}>Digital Twin</Text>
      <Text style={styles.title}>{twinName}</Text>
      <Text style={styles.subtitle}>
        Built around {studentName}'s learning behavior, quiz results, and
        textbook progress.
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaLabel}>{bandLabel[performanceBand]}</Text>
        </View>
        <View style={styles.metaPillDark}>
          <Text style={styles.metaLabelDark}>{readinessPercent}% ready</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  orbitOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: "#D6E4FF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFF",
  },
  orbitMid: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#BFD6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  avatarCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  eyebrow: {
    marginTop: 16,
    color: "#8A99B5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    color: "#1A202C",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: "#718096",
    lineHeight: 20,
    textAlign: "center",
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  metaPill: {
    backgroundColor: "#EEF5FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#D6E4FF",
  },
  metaPillDark: {
    backgroundColor: "#FFF4E5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#FFD5A1",
  },
  metaLabel: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  metaLabelDark: {
    color: "#8C5C00",
    fontWeight: "800",
    fontSize: 12,
  },
});
