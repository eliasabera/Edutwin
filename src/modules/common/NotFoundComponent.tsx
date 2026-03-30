import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../shared/constants/colors";

export default function NotFoundComponent() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
        <Text style={styles.title}>Page Not Found</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
  },
  link: {
    marginTop: 30,
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  linkText: { fontSize: 16, color: COLORS.primary, fontWeight: "600" },
});
