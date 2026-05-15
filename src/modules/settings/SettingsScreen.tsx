import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/shared/i18n";
import {
  getAuthToken,
  hydrateAuthToken,
  saveTermsPolicyAgreement,
  saveStudentProfile,
  setCachedStudentProfile,
} from "@/shared/services/auth-service";
import { setPreferredLanguage } from "@/shared/store/language-store";
import {
  getAppSettings,
  getEffectiveThemeMode,
  hydrateAppSettings,
  setAutoSyncTwinProgress,
  setDailyStreakReminders,
  setHasAcceptedTermsPolicy,
  setNotificationsEnabled,
  setThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";
import {
  updateStudentProfile,
  useStudentProfile,
} from "@/shared/store/user-store";
import {
  requestNotificationPermissionIfNeeded,
  syncNotificationSettings,
} from "@/shared/services/notification-service";

const LANGUAGE_OPTIONS = [
  { id: "en", labelKey: "settings.languageEnglish", icon: "🇬🇧" },
  { id: "om", labelKey: "settings.languageAfaanOromoo", icon: "🇪🇹" },
] as const;

const SETTINGS_SECTIONS = [
  {
    id: "account",
    titleKey: "settings.account",
    items: [
      {
        id: "profileDetails",
        icon: "person-outline" as const,
        titleKey: "settings.profileDetails",
        subtitleKey: "settings.profileDetailsSubtitle",
        action: "open",
        route: "/profile",
      },
      {
        id: "privacy",
        icon: "shield-checkmark-outline" as const,
        titleKey: "settings.privacy",
        subtitleKey: "settings.privacySubtitle",
        action: "privacy",
      },
    ],
  },
  {
    id: "learningPreferences",
    titleKey: "settings.learningPreferences",
    items: [
      {
        id: "language",
        icon: "language-outline" as const,
        titleKey: "settings.language",
        subtitleKey: "settings.languageSubtitle",
        action: "toggle",
      },
      {
        id: "notifications",
        icon: "notifications-outline" as const,
        titleKey: "settings.notifications",
        subtitleKey: "settings.notificationsSubtitle",
        action: "toggle",
      },
      {
        id: "theme",
        icon: "color-palette-outline" as const,
        titleKey: "settings.theme",
        subtitleKey: "settings.themeSubtitle",
        action: "theme",
      },
    ],
  },
  {
    id: "support",
    titleKey: "settings.support",
    items: [
      {
        id: "helpCenter",
        icon: "help-circle-outline" as const,
        titleKey: "settings.helpCenter",
        subtitleKey: "settings.helpCenterSubtitle",
        action: "help",
      },
      {
        id: "termsPolicy",
        icon: "document-text-outline" as const,
        titleKey: "settings.termsPolicy",
        subtitleKey: "settings.termsPolicySubtitle",
        action: "policy",
      },
    ],
  },
] as const;

const extractHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.developer?.tool ||
    Constants.linkingUri;

  if (!hostUri) return null;

  const sanitized = String(hostUri)
    .replace(/^https?:\/\//, "")
    .replace(/^exp:\/\//, "")
    .split("/")[0]
    .trim();

  if (!sanitized) return null;

  const host = sanitized.includes(":")
    ? sanitized.slice(0, sanitized.lastIndexOf(":"))
    : sanitized;

  return host || null;
};

const resolveApiHost = () => {
  const explicitHost = process.env.EXPO_PUBLIC_NODE_API_HOST?.trim();
  if (explicitHost) return explicitHost;

  const expoHost = extractHostFromExpo();
  if (expoHost) return expoHost;

  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const API_HOST = resolveApiHost();
const NODE_API_BASE_URL =
  process.env.EXPO_PUBLIC_NODE_API_BASE_URL || `http://${API_HOST}:5000`;
const PAYMENTS_SUBSCRIPTIONS_URL = `${NODE_API_BASE_URL}/api/payments/subscriptions`;
const PAYMENTS_CHAPA_INITIALIZE_URL =
  `${NODE_API_BASE_URL}/api/payments/chapa/initialize`;
const PAYMENTS_CHAPA_VERIFY_URL = (txRef: string) =>
  `${NODE_API_BASE_URL}/api/payments/chapa/verify/${encodeURIComponent(txRef)}`;
const SUPPORT_EMAIL = "edutwin2@gmail.com";

const readApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
    };
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // ignore non-json responses
  }
  return fallback;
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const studentProfile = useStudentProfile();
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const currentLanguage =
    studentProfile.preferredLanguage || getAppSettings().preferredLanguage;
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [isSubscribingMonthly, setIsSubscribingMonthly] = useState(false);
  const [isMonthlyActive, setIsMonthlyActive] = useState(false);
  const [monthlyPlanEnd, setMonthlyPlanEnd] = useState<string | null>(null);
  const subscriptionCopy = useMemo(
    () =>
      currentLanguage === "om"
        ? {
            title: "Subscribshinii Barataa",
            subtitle:
              "Pilaana ji'aa filachuun AI tutor, practice fi qabeenya barnootaa guutuu fayyadami.",
            monthlyPlan: "Pilaana Ji'aa",
            monthlyPrice: "149 ETB / ji'a",
            active: "Hojii irra jira",
            inactive: "Hin subscribe goone",
            subscribeNow: "Ji'aan Subscribe godhi",
            subscribing: "Subscribe gochaa jira...",
            manageInfo:
              "Subscribe erga gootee booda status kee as irratti ni mul'ata.",
            successTitle: "Subscription Milkaa'e",
            successMessage: "Pilaana ji'aa siif banameera.",
            failedTitle: "Subscription hin milkoofne",
            failedMessage: "Ammaaf subscribe gochuu hin dandeenye.",
            authRequired: "Maaloo seeniitii booda irra deebi'ii yaali.",
            checkoutPending:
              "Fuula kaffaltii irratti raawwii xumurii. Erga xumurtee booda app kanaatti deebi'i.",
            verifyPending:
              "Kaffaltiin mirkaneeffamaa jira...",
            paymentNotCompleted:
              "Kaffaltiin hin xumuramne. Yoo kaffalte, xiqqoo turii irra deebi'ii yaali.",
          }
        : {
            title: "Student Subscription",
            subtitle:
              "Choose a monthly plan to unlock full AI tutor, practice, and learning resources.",
            monthlyPlan: "Monthly Plan",
            monthlyPrice: "149 ETB / month",
            active: "Active",
            inactive: "Not subscribed",
            subscribeNow: "Subscribe Monthly",
            subscribing: "Subscribing...",
            manageInfo:
              "After subscribing, your latest status appears here automatically.",
            successTitle: "Subscription Activated",
            successMessage: "Your monthly student plan is active.",
            failedTitle: "Subscription Failed",
            failedMessage: "Unable to subscribe right now.",
            authRequired: "Please login again and retry.",
            checkoutPending:
              "Complete your payment on the Chapa page, then return to the app.",
            verifyPending: "Verifying your payment...",
            paymentNotCompleted:
              "Payment is not completed yet. If you already paid, wait a moment and try again.",
          },
    [currentLanguage],
  );

  const loadSubscriptionStatus = useCallback(async () => {
    setIsSubscriptionLoading(true);
    try {
      await hydrateAuthToken();
      const token = getAuthToken();
      if (!token) {
        setIsMonthlyActive(false);
        setMonthlyPlanEnd(null);
        return;
      }

      const response = await fetch(PAYMENTS_SUBSCRIPTIONS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
        },
      });

      if (!response.ok) {
        setIsMonthlyActive(false);
        setMonthlyPlanEnd(null);
        return;
      }

      const payload = (await response.json()) as {
        data?: Array<{
          plan_type?: string;
          status?: string;
          current_period_end?: string;
        }>;
      };

      const subscriptions = Array.isArray(payload?.data) ? payload.data : [];
      const monthly = subscriptions.find(
        (item) => String(item?.plan_type || "").toLowerCase() === "monthly",
      );

      const normalizedStatus = String(monthly?.status || "").toLowerCase();
      const active =
        normalizedStatus === "active" || normalizedStatus === "trialing";
      setIsMonthlyActive(active);
      setMonthlyPlanEnd(
        typeof monthly?.current_period_end === "string"
          ? monthly.current_period_end
          : null,
      );
    } catch {
      setIsMonthlyActive(false);
      setMonthlyPlanEnd(null);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      void hydrateAppSettings().then(() => {
        if (!isMounted) return;
      });
      void loadSubscriptionStatus();
      return () => {
        isMounted = false;
      };
    }, [loadSubscriptionStatus]),
  );

  const themeMode = appSettings.themeMode;
  const isDark =
    themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : themeMode === "dark";

  const handleSubscribeMonthly = async () => {
    if (isSubscribingMonthly) return;

    setIsSubscribingMonthly(true);
    try {
      await hydrateAuthToken();
      const token = getAuthToken();
      if (!token) {
        Alert.alert(subscriptionCopy.failedTitle, subscriptionCopy.authRequired);
        return;
      }

      const initResponse = await fetch(PAYMENTS_CHAPA_INITIALIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
        },
        body: JSON.stringify({
          plan_type: "monthly",
          amount: 149,
          currency: "ETB",
        }),
      });

      if (!initResponse.ok) {
        throw new Error(
          await readApiErrorMessage(initResponse, subscriptionCopy.failedMessage),
        );
      }

      const initPayload = (await initResponse.json()) as {
        data?: {
          tx_ref?: string;
          checkout_url?: string;
        };
      };

      const txRef = String(initPayload?.data?.tx_ref || "").trim();
      const checkoutUrl = String(initPayload?.data?.checkout_url || "").trim();

      if (!txRef || !checkoutUrl) {
        throw new Error("Missing checkout details from payment gateway.");
      }

      Alert.alert(subscriptionCopy.successTitle, subscriptionCopy.checkoutPending);
      await WebBrowser.openBrowserAsync(checkoutUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      Alert.alert(subscriptionCopy.successTitle, subscriptionCopy.verifyPending);
      const verifyResponse = await fetch(PAYMENTS_CHAPA_VERIFY_URL(txRef), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
        },
      });

      if (!verifyResponse.ok) {
        throw new Error(
          await readApiErrorMessage(verifyResponse, subscriptionCopy.failedMessage),
        );
      }

      const verifyPayload = (await verifyResponse.json()) as {
        data?: { verified?: boolean; status?: string };
      };
      const verified = Boolean(verifyPayload?.data?.verified);
      const verifyStatus = String(verifyPayload?.data?.status || "").toLowerCase();

      if (!verified) {
        Alert.alert(
          subscriptionCopy.failedTitle,
          verifyStatus
            ? `${subscriptionCopy.paymentNotCompleted} (${verifyStatus})`
            : subscriptionCopy.paymentNotCompleted,
        );
        void loadSubscriptionStatus();
        return;
      }

      setIsMonthlyActive(true);
      setMonthlyPlanEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      Alert.alert(subscriptionCopy.successTitle, subscriptionCopy.successMessage);
      void loadSubscriptionStatus();
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : subscriptionCopy.failedMessage;
      Alert.alert(subscriptionCopy.failedTitle, message);
    } finally {
      setIsSubscribingMonthly(false);
    }
  };
  const applyLanguage = async (language: "en" | "om") => {
    if (language === currentLanguage || isSavingLanguage) {
      return;
    }

    setIsSavingLanguage(true);
    const nextProfile = {
      preferredLanguage: language,
    };

    try {
      updateStudentProfile(nextProfile);
      setPreferredLanguage(language);
      const updatedProfile = await saveStudentProfile(nextProfile);
      setCachedStudentProfile(updatedProfile);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("settings.languageUpdateFailed");
      Alert.alert(t("settings.languageUpdateFailed"), message);
      updateStudentProfile({ preferredLanguage: currentLanguage });
      setPreferredLanguage(currentLanguage);
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleThemeChange = (nextTheme: "light" | "dark" | "system") => {
    setThemeMode(nextTheme);
  };

  const settingsCopy = useMemo(
    () =>
      currentLanguage === "om"
        ? {
            notificationsPermissionDenied:
              "Hayyamni beeksisaa barbaachisaadha."
          }
        : {
            notificationsPermissionDenied:
              "Notification permission is required."
          },
    [currentLanguage],
  );

  const handleNotificationsToggle = async (enabled: boolean) => {
    const previousNotificationsEnabled = appSettings.notificationsEnabled;
    const previousDailyReminders = appSettings.dailyStreakReminders;

    setNotificationsEnabled(enabled);

    if (!enabled) {
      setDailyStreakReminders(false);
      await syncNotificationSettings({
        ...appSettings,
        notificationsEnabled: false,
        dailyStreakReminders: false,
      });
      return;
    }

    const granted = await requestNotificationPermissionIfNeeded();
    if (!granted) {
      setNotificationsEnabled(previousNotificationsEnabled);
      setDailyStreakReminders(previousDailyReminders);
      Alert.alert(t("settings.notifications"), settingsCopy.notificationsPermissionDenied);
      return;
    }

    const nextSettings = {
      ...appSettings,
      notificationsEnabled: true,
      dailyStreakReminders: previousDailyReminders,
    };
    await syncNotificationSettings(nextSettings);
  };

  const handleDailyStreakReminderToggle = async (enabled: boolean) => {
    const previousDailyReminders = appSettings.dailyStreakReminders;
    const previousNotificationsEnabled = appSettings.notificationsEnabled;

    if (enabled && !appSettings.notificationsEnabled) {
      const granted = await requestNotificationPermissionIfNeeded();
      if (!granted) {
        Alert.alert(t("settings.notifications"), settingsCopy.notificationsPermissionDenied);
        return;
      }
      setNotificationsEnabled(true);
    }

    setDailyStreakReminders(enabled);

    try {
      await syncNotificationSettings({
        ...appSettings,
        notificationsEnabled: enabled ? true : appSettings.notificationsEnabled,
        dailyStreakReminders: enabled,
      });
    } catch {
      setDailyStreakReminders(previousDailyReminders);
      setNotificationsEnabled(previousNotificationsEnabled);
      Alert.alert(t("settings.notifications"), settingsCopy.notificationsPermissionDenied);
    }
  };

  const handleAutoSyncTwinProgressToggle = (enabled: boolean) => {
    setAutoSyncTwinProgress(enabled);
  };

  const handleHelp = async () => {
    const subject = currentLanguage === "om"
      ? "Deeggarsa EduTwin"
      : "EduTwin Help Center Support";
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
        return;
      }
    } catch {
      // Fall through to fallback alert with support email.
    }

    Alert.alert(
      t("settings.helpTitle"),
      `${t("settings.helpMessage")}\n\n${SUPPORT_EMAIL}`,
      [{ text: t("settings.ok") }],
    );
  };

  const handlePolicy = () => {
    Alert.alert(
      t("settings.policyTitle"),
      t("settings.policyMessage"),
      [
        { text: t("actions.cancel"), style: "cancel" },
        {
          text: t("settings.agreeTerms"),
          onPress: async () => {
            try {
              await saveTermsPolicyAgreement(true);
              setHasAcceptedTermsPolicy(true);
            } catch (error) {
              Alert.alert(
                t("settings.termsPolicy"),
                error instanceof Error
                  ? error.message
                  : t("settings.failedToSaveProfile"),
              );
            }
          },
        },
      ],
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      t("settings.privacyTitle"),
      t("settings.privacyMessage"),
      [{ text: t("settings.ok") }],
    );
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? "#08111F" : "#FFFFFF",
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 128,
          paddingHorizontal: 16,
          gap: 14,
        }}
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#DCE9FC",
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View
              style={[
                styles.headerBadge,
                {
                  backgroundColor: isDark ? "#121C2E" : "#ECF3FF",
                  borderColor: isDark ? "#2E4368" : "#D4E3FA",
                },
              ]}
            >
              <Ionicons name="settings-outline" size={14} color="#0B5FFF" />
              <Text
                style={[
                  styles.headerBadgeText,
                  { color: isDark ? "#BFD6FF" : "#0B5FFF" },
                ]}
              >
                {t("settings.appSettings")}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.title, { color: isDark ? "#F4F7FB" : "#12233F" }]}
          >
            {t("settings.title")}
          </Text>
          <Text
            style={[styles.subtitle, { color: isDark ? "#AAB7CF" : "#4E6387" }]}
          >
            {t("settings.subtitle")}
          </Text>

          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryPill,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                  borderColor: isDark ? "#2E4368" : "#DCE9FC",
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={14} color="#0B5FFF" />
              <Text
                style={[
                  styles.summaryText,
                  { color: isDark ? "#BFD6FF" : "#35507E" },
                ]}
              >
                {t("settings.secureSync")}
              </Text>
            </View>
            <View
              style={[
                styles.summaryPill,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                  borderColor: isDark ? "#2E4368" : "#DCE9FC",
                },
              ]}
            >
              <Ionicons name="cloud-done-outline" size={14} color="#0B5FFF" />
              <Text
                style={[
                  styles.summaryText,
                  { color: isDark ? "#BFD6FF" : "#35507E" },
                ]}
              >
                {t("settings.cloudReady")}
              </Text>
            </View>
            <View
              style={[
                styles.summaryPill,
                {
                  backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                  borderColor: isDark ? "#2E4368" : "#DCE9FC",
                },
              ]}
            >
              <Ionicons name="language-outline" size={14} color="#0B5FFF" />
              <Text
                style={[
                  styles.summaryText,
                  { color: isDark ? "#BFD6FF" : "#35507E" },
                ]}
              >
                {currentLanguage === "om" ? t("settings.languageAfaanOromoo") : t("settings.languageEnglish")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#DCE9FC",
              },
            ]}
          >
            <Text
              style={[
                styles.quickStatValue,
                { color: isDark ? "#F4F7FB" : "#12233F" },
              ]}
            >
              24/7
            </Text>
            <Text
              style={[
                styles.quickStatLabel,
                { color: isDark ? "#AAB7CF" : "#6D84AA" },
              ]}
            >
              {t("settings.supportAccess")}
            </Text>
          </View>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#DCE9FC",
              },
            ]}
          >
            <Text
              style={[
                styles.quickStatValue,
                { color: isDark ? "#F4F7FB" : "#12233F" },
              ]}
            >
              AES
            </Text>
            <Text
              style={[
                styles.quickStatLabel,
                { color: isDark ? "#AAB7CF" : "#6D84AA" },
              ]}
            >
              {t("settings.secureStorage")}
            </Text>
          </View>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#DCE9FC",
              },
            ]}
          >
            <Text
              style={[
                styles.quickStatValue,
                { color: isDark ? "#F4F7FB" : "#12233F" },
              ]}
            >
              1 Tap
            </Text>
            <Text
              style={[
                styles.quickStatLabel,
                { color: isDark ? "#AAB7CF" : "#6D84AA" },
              ]}
            >
              {t("settings.profileUpdates")}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#DCE9FC",
            },
          ]}
        >
          <View style={styles.subscriptionHeaderRow}>
            <View
              style={[
                styles.subscriptionIconWrap,
                {
                  backgroundColor: isDark ? "#121C2E" : "#ECF3FF",
                },
              ]}
            >
              <Ionicons name="card-outline" size={18} color="#0B5FFF" />
            </View>
            <View style={styles.subscriptionHeaderTextWrap}>
              <Text
                style={[
                  styles.groupTitle,
                  { color: isDark ? "#F4F7FB" : "#12233F" },
                ]}
              >
                {subscriptionCopy.title}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {subscriptionCopy.subtitle}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.subscriptionPlanRow,
              {
                backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                borderColor: isDark ? "#2E4368" : "#DCE9FC",
              },
            ]}
          >
            <View style={styles.subscriptionPlanTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#12233F" },
                ]}
              >
                {subscriptionCopy.monthlyPlan}
              </Text>
              <Text style={styles.subscriptionPriceText}>
                {subscriptionCopy.monthlyPrice}
              </Text>
            </View>
            <View
              style={[
                styles.subscriptionStatusPill,
                isMonthlyActive
                  ? styles.subscriptionStatusPillActive
                  : styles.subscriptionStatusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.subscriptionStatusText,
                  isMonthlyActive
                    ? styles.subscriptionStatusTextActive
                    : styles.subscriptionStatusTextInactive,
                ]}
              >
                {isSubscriptionLoading
                  ? "..."
                  : isMonthlyActive
                    ? subscriptionCopy.active
                    : subscriptionCopy.inactive}
              </Text>
            </View>
          </View>

          {monthlyPlanEnd ? (
            <Text
              style={[
                styles.subscriptionPeriodText,
                { color: isDark ? "#8FA3C0" : "#6D84AA" },
              ]}
            >
              {`Until ${new Date(monthlyPlanEnd).toLocaleDateString()}`}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.subscribeButton,
              (isSubscribingMonthly || isMonthlyActive) &&
                styles.subscribeButtonDisabled,
              pressed && styles.subscribeButtonPressed,
            ]}
            onPress={() => void handleSubscribeMonthly()}
            disabled={isSubscribingMonthly || isMonthlyActive}
          >
            <Text style={styles.subscribeButtonText}>
              {isSubscribingMonthly
                ? subscriptionCopy.subscribing
                : isMonthlyActive
                  ? subscriptionCopy.active
                  : subscriptionCopy.subscribeNow}
            </Text>
          </Pressable>

          <Text
            style={[
              styles.subscriptionInfoText,
              { color: isDark ? "#8FA3C0" : "#6D84AA" },
            ]}
          >
            {subscriptionCopy.manageInfo}
          </Text>
        </View>

        {SETTINGS_SECTIONS.map((group) => (
          <View
            key={group.id}
            style={[
              styles.groupCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#DCE9FC",
              },
            ]}
          >
            <Text
              style={[
                styles.groupTitle,
                { color: isDark ? "#F4F7FB" : "#12233F" },
              ]}
            >
              {t(group.titleKey)}
            </Text>

            {group.items.map((item, index) => {
              const isLast = index === group.items.length - 1;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.settingRow,
                    group.id === "learningPreferences" && styles.learningPrefsRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? "#22324E" : "#EEF3FB",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.settingIconWrap,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#ECF3FF",
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color="#0B5FFF" />
                  </View>

                  <View style={styles.settingTextWrap}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: isDark ? "#F4F7FB" : "#12233F" },
                      ]}
                    >
                      {t(item.titleKey)}
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtitle,
                        { color: isDark ? "#AAB7CF" : "#60779E" },
                      ]}
                    >
                      {t(item.subtitleKey)}
                    </Text>
                    {"infoKey" in item && item.infoKey ? (
                      <Text
                        style={[
                          styles.settingInfo,
                          { color: isDark ? "#8FA3C0" : "#7D8EA9" },
                        ]}
                      >
                        {t(item.infoKey)}
                      </Text>
                    ) : null}
                  </View>

                  {item.action === "open" ? (
                    <Pressable
                      style={styles.settingActionWrap}
                      onPress={() => router.push(item.route as never)}
                    >
                      <Text style={styles.settingActionText}>
                        {t("settings.open")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8A9AB6"
                      />
                    </Pressable>
                  ) : item.action === "privacy" ? (
                    <Pressable
                      style={styles.settingActionWrap}
                      onPress={handlePrivacy}
                    >
                      <Text style={styles.settingActionText}>
                        {t("settings.review")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8A9AB6"
                      />
                    </Pressable>
                  ) : item.action === "help" ? (
                    <Pressable
                      style={styles.settingActionWrap}
                      onPress={() => {
                        void handleHelp();
                      }}
                    >
                      <Text style={styles.settingActionText}>{t("settings.open")}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8A9AB6"
                      />
                    </Pressable>
                  ) : item.action === "policy" ? (
                    <Pressable
                      style={styles.settingActionWrap}
                      onPress={handlePolicy}
                    >
                      <Text style={styles.settingActionText}>{t("settings.read")}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8A9AB6"
                      />
                    </Pressable>
                  ) : item.action === "theme" ? (
                    <View style={styles.themeControlWrap}>
                      <View style={styles.themeChoiceRow}>
                        <Pressable
                          style={[
                            styles.themeChoicePill,
                            {
                              borderColor: isDark ? "#2E4368" : "#D4E3FA",
                              backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                            },
                            themeMode === "system" &&
                              styles.themeChoicePillActive,
                          ]}
                          onPress={() => handleThemeChange("system")}
                          accessibilityLabel={t("settings.phoneTheme")}
                        >
                          <Ionicons
                            name="phone-portrait-outline"
                            size={16}
                            color={
                              themeMode === "system" ? "#0B5FFF" : "#6D84AA"
                            }
                          />
                        </Pressable>
                        <Pressable
                          style={[
                            styles.themeChoicePill,
                            {
                              borderColor: isDark ? "#2E4368" : "#D4E3FA",
                              backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                            },
                            themeMode === "light" &&
                              styles.themeChoicePillActive,
                          ]}
                          onPress={() => handleThemeChange("light")}
                          accessibilityLabel={t("settings.lightMode")}
                        >
                          <Ionicons
                            name="sunny-outline"
                            size={16}
                            color={
                              themeMode === "light" ? "#0B5FFF" : "#6D84AA"
                            }
                          />
                        </Pressable>
                        <Pressable
                          style={[
                            styles.themeChoicePill,
                            {
                              borderColor: isDark ? "#2E4368" : "#D4E3FA",
                              backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                            },
                            themeMode === "dark" &&
                              styles.themeChoicePillActive,
                          ]}
                          onPress={() => handleThemeChange("dark")}
                          accessibilityLabel={t("settings.darkMode")}
                        >
                          <Ionicons
                            name="moon-outline"
                            size={16}
                            color={themeMode === "dark" ? "#0B5FFF" : "#6D84AA"}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.languageStack}>
                      {item.id === "language" ? (
                        <View style={styles.languageRow}>
                          {LANGUAGE_OPTIONS.map((language) => {
                            const selected = currentLanguage === language.id;
                            return (
                              <Pressable
                                key={language.id}
                                style={[
                                  styles.languageOption,
                                  {
                                    borderColor: isDark ? "#2E4368" : "#D4E3FA",
                                    backgroundColor: isDark
                                      ? "#121C2E"
                                      : "#F7FAFF",
                                  },
                                  selected && styles.languageOptionActive,
                                ]}
                                onPress={() => void applyLanguage(language.id)}
                                disabled={isSavingLanguage}
                              >
                                <Text style={styles.languageIcon}>
                                  {language.icon}
                                </Text>
                                <Text
                                  style={[
                                    styles.languageText,
                                    { color: isDark ? "#AAB7CF" : "#6D84AA" },
                                    selected && styles.languageTextActive,
                                  ]}
                                >
                                  {t(language.labelKey)}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : item.id === "notifications" ? (
                        <Switch
                          value={appSettings.notificationsEnabled}
                          onValueChange={(value) => {
                            void handleNotificationsToggle(value);
                          }}
                          thumbColor="#FFFFFF"
                          trackColor={{ false: "#D6E4FF", true: "#0B5FFF" }}
                        />
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#DCE9FC",
            },
          ]}
        >
          <Text
            style={[
              styles.groupTitle,
              { color: isDark ? "#F4F7FB" : "#12233F" },
            ]}
          >
              {t("settings.learningControls")}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#12233F" },
                ]}
              >
                {t("settings.dailyStreakReminders")}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {t("settings.dailyStreakRemindersSubtitle")}
              </Text>
            </View>
            <Switch
              value={appSettings.dailyStreakReminders}
              onValueChange={(value) => {
                void handleDailyStreakReminderToggle(value);
              }}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#D6E4FF", true: "#0B5FFF" }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text
                style={[
                  styles.settingTitle,
                  { color: isDark ? "#F4F7FB" : "#12233F" },
                ]}
              >
                {t("settings.autoSyncTwinProgress")}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {t("settings.autoSyncTwinProgressSubtitle")}
              </Text>
            </View>
            <Switch
              value={appSettings.autoSyncTwinProgress}
              onValueChange={handleAutoSyncTwinProgressToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: "#D6E4FF", true: "#0B5FFF" }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#0A2A55",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECF3FF",
    borderWidth: 1,
    borderColor: "#D4E3FA",
  },
  headerBadgeText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#DCE9FC",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryText: {
    color: "#35507E",
    fontSize: 11,
    fontWeight: "700",
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: "#6D84AA",
    fontSize: 11,
    fontWeight: "700",
  },
  subscriptionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  subscriptionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  subscriptionPlanRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  subscriptionPlanTextWrap: {
    flex: 1,
    gap: 2,
  },
  subscriptionPriceText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  subscriptionStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subscriptionStatusPillActive: {
    backgroundColor: "#E8FFF2",
  },
  subscriptionStatusPillInactive: {
    backgroundColor: "#EFF4FF",
  },
  subscriptionStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  subscriptionStatusTextActive: {
    color: "#15803D",
  },
  subscriptionStatusTextInactive: {
    color: "#35507E",
  },
  subscriptionPeriodText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  subscribeButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#0B5FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  subscribeButtonDisabled: {
    opacity: 0.72,
  },
  subscribeButtonPressed: {
    opacity: 0.88,
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  subscriptionInfoText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  learningPrefsRow: {
    paddingVertical: 10,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#ECF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  settingTextWrap: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  settingInfo: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  settingActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  settingActionText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "800",
  },
  themeToggleGroup: {
    flexDirection: "row",
    gap: 8,
  },
  themeControlWrap: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 1,
    maxWidth: "58%",
  },
  themeChoiceRow: {
    flexDirection: "column",
    alignItems: "flex-end",
    flexWrap: "nowrap",
    gap: 6,
  },
  themeChoicePill: {
    width: 34,
    height: 34,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D4E3FA",
    backgroundColor: "#F7FAFF",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  themeChoicePillActive: {
    backgroundColor: "#ECF3FF",
    borderColor: "#0B5FFF",
  },
  languageStack: {
    alignItems: "flex-end",
    flexShrink: 1,
    maxWidth: "58%",
  },
  languageRow: {
    flexDirection: "column",
    flexWrap: "nowrap",
    justifyContent: "flex-end",
    gap: 8,
  },
  languageOption: {
    minWidth: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4E3FA",
    backgroundColor: "#F7FAFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  languageOptionActive: {
    borderColor: "#0B5FFF",
    backgroundColor: "#ECF3FF",
  },
  languageIcon: {
    fontSize: 14,
  },
  languageText: {
    color: "#6D84AA",
    fontSize: 12,
    fontWeight: "800",
  },
  languageTextActive: {
    color: "#0B5FFF",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
});
