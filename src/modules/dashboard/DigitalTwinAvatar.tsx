import type { PerformanceBand } from "@/shared/types/domain.types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

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
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={[styles.orbitOuter, isDark && styles.orbitOuterDark]}>
        <View style={[styles.orbitMid, isDark && styles.orbitMidDark]}>
          <View style={[styles.avatarWrap, isDark && styles.avatarWrapDark]}>
            <View style={[styles.avatarCore, isDark && styles.avatarCoreDark]}>
              <Ionicons name="sparkles" size={28} color="#0B5FFF" />
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]}>Digital Twin</Text>
      <Text style={[styles.title, isDark && styles.titleDark]}>{twinName}</Text>
      <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
        Built around {studentName}'s learning behavior, quiz results, and
        textbook progress.
      </Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, isDark && styles.metaPillDark]}>
          <Text style={[styles.metaLabel, isDark && styles.metaLabelDark]}>{bandLabel[performanceBand]}</Text>
        </View>
        <View style={[styles.metaPillAccent, isDark && styles.metaPillAccentDark]}>
          <Text style={[styles.metaLabelAccent, isDark && styles.metaLabelAccentDark]}>{readinessPercent}% ready</Text>
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
  cardDark: {
    backgroundColor: "#0E1A2C",
    borderColor: "#22324E",
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
  orbitOuterDark: {
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
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
  orbitMidDark: {
    borderColor: "#3A4E70",
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
  avatarWrapDark: {
    backgroundColor: "#17253A",
    borderColor: "#3A4E70",
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
  avatarCoreDark: {
    backgroundColor: "#0E1A2C",
    borderColor: "#3A4E70",
  },
  eyebrow: {
    marginTop: 16,
    color: "#8A99B5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  eyebrowDark: {
    color: "#B9CAEE",
  },
  title: {
    color: "#1A202C",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  titleDark: {
    color: "#F4F7FB",
  },
  subtitle: {
    marginTop: 6,
    color: "#718096",
    lineHeight: 20,
    textAlign: "center",
  },
  subtitleDark: {
    color: "#AAB7CF",
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
    backgroundColor: "#121C2E",
    borderColor: "#2E4368",
  },
  metaPillAccent: {
    backgroundColor: "#FFF4E5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#FFD5A1",
  },
  metaPillAccentDark: {
    backgroundColor: "#2A2217",
    borderColor: "#5B4520",
  },
  metaLabel: {
    color: "#0B5FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  metaLabelDark: {
    color: "#BFD6FF",
  },
  metaLabelAccent: {
    color: "#8C5C00",
    fontWeight: "800",
    fontSize: 12,
  },
  metaLabelAccentDark: {
    color: "#8C5C00",
    fontWeight: "800",
    fontSize: 12,
  },
});
