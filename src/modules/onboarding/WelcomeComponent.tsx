import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../shared/constants/colors";

export default function WelcomeComponent() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={50} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>EduTwin</Text>
        <Text style={styles.subtitle}>
          Your AI & AR Learning Companion.{"\n"}Anytime. Anywhere.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.btnPrimaryText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.btnSecondaryText}>Create an Account</Text>
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
    paddingTop: 80,
  },
  header: { alignItems: "center" },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 36, fontWeight: "bold", color: COLORS.primary },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 10,
  },
  footer: { gap: 16, marginBottom: 40 },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  btnPrimaryText: { color: "white", fontSize: 18, fontWeight: "600" },
  btnSecondary: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  btnSecondaryText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
});
