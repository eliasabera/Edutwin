import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../shared/constants/colors";

export default function SplashComponent() {
  const router = useRouter();

  useEffect(() => {
    // Wait for 2 seconds (simulating checks), then go to Login
    const timer = setTimeout(() => {
      router.replace("/setup");
    }, 2000);

    return () => clearTimeout(timer); // Cleanup if user exits early
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="school" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>EduTwin</Text>
        <Text style={styles.subtitle}>AI & AR Learning Companion</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 50,
  },
});
