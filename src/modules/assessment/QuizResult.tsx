import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../../shared/constants/colors";

export default function QuizResult() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse params (safely handle defaults)
  const score = Number(params.score) || 0;
  const total = Number(params.total) || 3;
  const percentage = Math.round((score / total) * 100);

  // Logic: Determine Feedback based on score
  const isGood = percentage > 60;

  const handleContinue = () => {
    // This is the final step of Onboarding. Now we go to the main app.
    router.replace("/home" as never);
  };

  return (
    <View style={styles.container}>
      {/* 1. Score Circle */}
      <View style={styles.scoreContainer}>
        <View
          style={[
            styles.circle,
            { borderColor: isGood ? COLORS.secondary : "#FFC107" },
          ]}
        >
          <Text style={styles.scoreText}>{percentage}%</Text>
          <Text style={styles.totalText}>Mastery</Text>
        </View>

        <Text style={styles.title}>
          {isGood ? "Great Baseline!" : "Gaps Detected"}
        </Text>
        <Text style={styles.subtitle}>
          We have analyzed your answers to build your Digital Twin.
        </Text>
      </View>

      {/* 2. Analysis Card (The "Twin" Logic) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="analytics" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Knowledge Profile</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Science</Text>
          <View style={styles.statBarBg}>
            <View
              style={[
                styles.statBarFill,
                { width: "80%", backgroundColor: COLORS.secondary },
              ]}
            />
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Math</Text>
          <View style={styles.statBarBg}>
            <View
              style={[
                styles.statBarFill,
                { width: "40%", backgroundColor: "#FFC107" },
              ]}
            />
          </View>
        </View>

        {!isGood && (
          <View style={styles.alertBox}>
            <Ionicons name="alert-circle" size={20} color="#E65100" />
            <Text style={styles.alertText}>
              We recommend reviewing Grade 8 Algebra before starting Grade 9
              Math.
            </Text>
          </View>
        )}
      </View>

      {/* 3. Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleContinue}>
          <Text style={styles.btnText}>Go to Home</Text>
          <Ionicons name="rocket-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    justifyContent: "space-between",
    paddingTop: 60,
  },

  scoreContainer: { alignItems: "center" },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  scoreText: { fontSize: 40, fontWeight: "bold", color: COLORS.text },
  totalText: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  card: { backgroundColor: COLORS.background, padding: 20, borderRadius: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },

  statRow: { marginBottom: 15 },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: COLORS.text,
  },
  statBarBg: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    width: "100%",
  },
  statBarFill: { height: "100%", borderRadius: 4 },

  alertBox: {
    marginTop: 15,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
  },
  alertText: { flex: 1, fontSize: 14, color: "#E65100", lineHeight: 20 },

  footer: { marginBottom: 20 },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
});
