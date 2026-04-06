import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../../shared/constants/colors";
import {
    fetchStudentProfile,
    loginUser,
    mapBackendProfileToStudentProfile,
} from "../../../shared/services/auth-service";
import { updateStudentProfile } from "../../../shared/store/user-store";

export default function LoginComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);
      await loginUser(trimmedEmail, password);
      const backendProfile = await fetchStudentProfile();
      updateStudentProfile(mapBackendProfileToStudentProfile(backendProfile));
      router.replace("/(tabs)/home" as never);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to login right now.";
      setErrorMessage(message);
      Alert.alert("Login failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue learning with EduTwin.</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    justifyContent: "center",
  },
  header: { marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: COLORS.textLight },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: -2,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { color: COLORS.textLight, fontSize: 16 },
  link: { color: COLORS.primary, fontSize: 16, fontWeight: "bold" },
});
