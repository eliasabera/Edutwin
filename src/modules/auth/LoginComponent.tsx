import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchStudentProfile,
  loginUser,
  mapBackendProfileToStudentProfile,
} from "../../../shared/services/auth-service";
import { updateStudentProfile } from "../../../shared/store/user-store";
import { setPreferredLanguage } from "../../../shared/store/language-store";
import { setHasAcceptedTermsPolicy } from "../../../shared/store/settings-store";

const AUTH_COLORS = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#102445",
  textLight: "#6D84AA",
  primary: "#0056D2",
  error: "#DC3545",
};

const MIN_PASSWORD_LENGTH = 8;

export default function LoginComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const copy = {
    loginTitle: "Welcome back",
    loginSubtitle: "Sign in to continue learning with EduTwin.",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    emailPasswordRequired: "Email and password are required.",
    passwordTooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    invalidEmail: "Please enter a valid email address.",
    loggingIn: "Logging in...",
    signIn: "Log In",
    loginFailed: "Login failed",
    unableToLogin: "Unable to login right now.",
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password.trim()) {
      setErrorMessage(copy.emailPasswordRequired);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage(copy.invalidEmail);
      return;
    }

    if (password.trim().length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(copy.passwordTooShort);
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true);
      await loginUser(trimmedEmail, password);
      const backendProfile = await fetchStudentProfile();
      const mappedProfile = mapBackendProfileToStudentProfile(backendProfile);
      setHasAcceptedTermsPolicy(backendProfile.has_accepted_terms_policy === true);
      updateStudentProfile(mappedProfile);
      await setPreferredLanguage(mappedProfile.preferredLanguage || "en");
      router.replace("/(tabs)/home" as never);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : copy.unableToLogin;
      setErrorMessage(message);
      Alert.alert(copy.loginFailed, message);
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
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{copy.loginTitle}</Text>
          <Text style={styles.subtitle}>{copy.loginSubtitle}</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.emailPlaceholder}
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
              color={AUTH_COLORS.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.visibilityToggle}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={AUTH_COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.btnText}>
              {isLoading ? copy.loggingIn : copy.signIn}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{copy.noAccount}</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>{copy.signUp}</Text>
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
    backgroundColor: AUTH_COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.surface,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  logo: {
    width: 148,
    height: 148,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: AUTH_COLORS.primary,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AUTH_COLORS.background,
    borderWidth: 1,
    borderColor: "#D6DDEA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: AUTH_COLORS.text },
  visibilityToggle: {
    marginLeft: 10,
    padding: 2,
  },
  errorText: {
    color: AUTH_COLORS.error,
    fontSize: 13,
    marginTop: -2,
  },
  btnPrimary: {
    backgroundColor: AUTH_COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: AUTH_COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: AUTH_COLORS.textLight, fontSize: 16 },
  link: { color: AUTH_COLORS.primary, fontSize: 16, fontWeight: "bold" },
});
