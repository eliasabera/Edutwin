import { Platform } from "react-native";
import Constants from "expo-constants";
import type { AppSettings } from "../store/settings-store";

const STREAK_REMINDER_ID = "edutwin-daily-streak-reminder";

let isHandlerConfigured = false;
let notificationsModulePromise: Promise<typeof import("expo-notifications")> | null =
  null;

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const shouldUseNotifications = Platform.OS !== "web" && !isExpoGo;

const getNotifications = async () => {
  if (!shouldUseNotifications) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }

  return notificationsModulePromise;
};

export const configureNotificationHandler = () => {
  if (!shouldUseNotifications || isHandlerConfigured) {
    return;
  }

  void getNotifications().then((Notifications) => {
    if (!Notifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    isHandlerConfigured = true;
  });
};

export const requestNotificationPermissionIfNeeded = async () => {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const cancelDailyStreakReminder = async () => {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID).catch(
    () => {
      // Ignore if there is no existing notification.
    },
  );
};

export const scheduleDailyStreakReminder = async () => {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  const hasPermission = await requestNotificationPermissionIfNeeded();
  if (!hasPermission) {
    throw new Error("Notification permission is required.");
  }

  await cancelDailyStreakReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: {
      title: "Keep your learning streak alive",
      body: "Open EduTwin and complete at least one quick activity today.",
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
};

export const syncNotificationSettings = async (settings: AppSettings) => {
  if (!shouldUseNotifications) {
    return true;
  }

  if (!settings.notificationsEnabled || !settings.dailyStreakReminders) {
    await cancelDailyStreakReminder();
    return true;
  }

  await scheduleDailyStreakReminder();
  return true;
};
