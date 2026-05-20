import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
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
import {
  type AuthScreenColors,
  useAuthIsDark,
  useAuthScreenColors,
} from "../../../shared/constants/auth-screen-theme";
import { setStudentProfile } from "../../../shared/store/user-store";
import { clearTutorChatCache } from "../ai-tutor/ChatContainer";
import { setPreferredLanguage } from "../../../shared/store/language-store";
import { setHasAcceptedTermsPolicy } from "../../../shared/store/settings-store";

const MIN_PASSWORD_LENGTH = 8;

const createStyles = (colors: AuthScreenColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
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
      color: colors.primary,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textLight,
      textAlign: "center",
      lineHeight: 22,
      maxWidth: 300,
    },
    form: { gap: 16 },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
    },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: colors.text },
    visibilityToggle: {
      marginLeft: 10,
      padding: 2,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      marginTop: -2,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 10,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: "white", fontSize: 18, fontWeight: "600" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
    footerText: { color: colors.textLight, fontSize: 16 },
    link: { color: colors.primary, fontSize: 16, fontWeight: "bold" },
  });

export default function LoginComponent() {
  const router = useRouter();
  const colors = useAuthScreenColors();
  const isDark = useAuthIsDark();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      clearTutorChatCache();
      const backendProfile = await fetchStudentProfile({ forceRefresh: true });
      const mappedProfile = mapBackendProfileToStudentProfile(backendProfile);
      setHasAcceptedTermsPolicy(backendProfile.has_accepted_terms_policy === true);
      setStudentProfile({
        fullName: mappedProfile.fullName || "Student",
        grade: mappedProfile.grade || "9",
        masteryScore: mappedProfile.masteryScore ?? 55,
        performanceBand: mappedProfile.performanceBand || "medium",
        preferredLanguage: mappedProfile.preferredLanguage || "en",
        twinName: mappedProfile.twinName || "EduTwin",
        supportSubjects: mappedProfile.supportSubjects || ["physics"],
        strongSubjects: mappedProfile.strongSubjects || ["biology"],
        diagnosticCompleted: mappedProfile.diagnosticCompleted ?? false,
        xp: mappedProfile.xp,
        streak: mappedProfile.streak,
        lastActive: mappedProfile.lastActive,
        studentPhotoUri: mappedProfile.studentPhotoUri,
        twinPhotoUri: mappedProfile.twinPhotoUri,
        isSubscribed: mappedProfile.isSubscribed,
        labBonusUnlock: mappedProfile.labBonusUnlock,
        subscriptionStatus: mappedProfile.subscriptionStatus,
        subscriptionPeriodEnd: mappedProfile.subscriptionPeriodEnd,
      });
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
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{copy.loginTitle}</Text>
          <Text style={styles.subtitle}>{copy.loginSubtitle}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.emailPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textLight}
              style={styles.icon}
            />
            <TextInput
              placeholder={copy.passwordPlaceholder}
              placeholderTextColor={colors.placeholder}
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
                color={colors.textLight}
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
