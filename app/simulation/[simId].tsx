import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../shared/constants/colors";
import UniversalCanvas from "../../src/modules/lab/UniversalCanvas";

export default function SimulationScreen() {
  const router = useRouter();
  const { simId } = useLocalSearchParams(); // e.g. "boyles_law"
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, you would fetch the specific config for this ID
  // For now, we assume everything uses the "Universal" canvas we built.

  useEffect(() => {
    // Simulate loading heavy assets
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [simId]);

  return (
    <View style={styles.container}>
      {/* 1. Header (Overlay) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.simTitle}>
            {typeof simId === "string"
              ? simId.replace("_", " ").toUpperCase()
              : "LAB"}
          </Text>
          <Text style={styles.simSubtitle}>Interactive Simulation</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 2. The Canvas (Lab) */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>
            Initializing Lab Environment...
          </Text>
        </View>
      ) : (
        <UniversalCanvas />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a", // Dark background for immersion
  },
  header: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  helpBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
  },
  simTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  simSubtitle: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 20,
    fontSize: 16,
  },
});
