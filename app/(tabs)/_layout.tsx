import { COLORS } from "@/shared/constants/colors";
import { useTranslation } from "@/shared/i18n";
import { useAppSettings } from "@/shared/store/settings-store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useHideTabBar } from "@/shared/store/ui-store";

type TabIconName =
  | "chatbubbles-outline"
  | "grid-outline"
  | "flask-outline"
  | "person-outline"
  | "book-outline";

const TAB_ICONS: Record<string, TabIconName> = {
  "ai-tutor": "chatbubbles-outline",
  home: "grid-outline",
  lab: "flask-outline",
  profile: "person-outline",
  textbook: "book-outline",
};

const getBaseRouteName = (routeName: string) =>
  routeName.replace(/\/index$/, "");

type TabBarIconProps = {
  iconName: TabIconName;
  size: number;
  focused: boolean;
  isDark: boolean;
};

function TabBarIcon({ iconName, size, focused, isDark }: TabBarIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const inactiveColor = isDark ? "#AFC2E3" : "#1F3E68";

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: focused ? 220 : 170,
      easing: focused ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  return (
    <View style={styles.iconRoot}>
      <Animated.View
        style={[
          styles.activeIconBubble,
          {
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, -8],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name={iconName} size={24} color="#FFFFFF" />
      </Animated.View>

      <Animated.View
        style={[
          styles.inactiveIconLayer,
          {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.97],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name={iconName} size={size} color={inactiveColor} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const hideTabBar = useHideTabBar();
  const pathname = usePathname();
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? deviceTheme === "dark"
      : appSettings.themeMode === "dark";
  const { t } = useTranslation();
  const tabLabelMap: Record<string, string> = {
    "ai-tutor": "navigation.tutor",
    textbook: "navigation.textbook",
    home: "navigation.home",
    lab: "navigation.lab",
    profile: "navigation.profile",
  };

  useEffect(() => {
    const tabRootPaths = new Set([
      "/home",
      "/lab",
      "/profile",
      "/ai-tutor",
      "/textbook",
      "/settings",
      "/practice-hub",
    ]);

    const onHardwareBack = () => {
      if (Platform.OS !== "android") return false;
      if (!tabRootPaths.has(pathname)) return false;
      // Block hardware back in the app shell to avoid accidental tab/route changes.
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack,
    );

    return () => subscription.remove();
  }, [pathname]);

  return (
      <Tabs
        backBehavior="none"
        screenOptions={({ route }) => {
          const baseRouteName = getBaseRouteName(route.name);

          return {
            headerShown: false,
            sceneStyle: {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
            },
            tabBarShowLabel: true,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: isDark ? "#78A5FF" : "#0A4FD1",
            tabBarInactiveTintColor: isDark ? "#AFC2E3" : "#1F3E68",
            tabBarStyle: hideTabBar
              ? { display: "none" }
              : {
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 12,
                  height: 78,
                  paddingTop: 10,
                  paddingBottom: 12,
                  paddingHorizontal: 8,
                  backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                  borderTopWidth: 1,
                  borderColor: isDark ? "#22324E" : "#D7E4F8",
                  borderRadius: 24,
                  shadowColor: isDark ? "#02060D" : "#0E234E",
                  shadowOpacity: 0.12,
                  shadowRadius: 14,
                  elevation: 10,
                },
            tabBarItemStyle: {
              borderRadius: 18,
              marginHorizontal: 2,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "700",
              marginTop: 2,
            },
            tabBarLabel: ({ focused }) => (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: focused ? "800" : "700",
                  marginTop: 2,
                  color: focused
                    ? isDark
                      ? "#78A5FF"
                      : "#0A4FD1"
                    : isDark
                      ? "#AFC2E3"
                      : "#1F3E68",
                }}
                numberOfLines={1}
              >
                {t(tabLabelMap[baseRouteName] ?? "navigation.home") ||
                  baseRouteName}
              </Text>
            ),
            tabBarIcon: ({ size, focused }) => {
              const iconName = TAB_ICONS[baseRouteName] ?? "grid-outline";

              return (
                <TabBarIcon
                  iconName={iconName}
                  size={size}
                  focused={focused}
                  isDark={isDark}
                />
              );
            },
          };
        }}
      >
        <Tabs.Screen
          name="ai-tutor/index"
          options={{
            title: t("navigation.tutor"),
            tabBarLabel: t("navigation.tutor"),
          }}
        />
        <Tabs.Screen
          name="textbook/index"
          options={{
            title: t("navigation.textbook"),
            tabBarLabel: t("navigation.textbook"),
          }}
        />
        <Tabs.Screen
          name="home/index"
          options={{
            title: t("navigation.home"),
            tabBarLabel: t("navigation.home"),
          }}
        />
        <Tabs.Screen
          name="lab/index"
          options={{
            title: t("navigation.lab"),
            tabBarLabel: t("navigation.lab"),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: t("navigation.profile"),
            tabBarLabel: t("navigation.profile"),
          }}
        />
        <Tabs.Screen
          name="practice-hub/index"
          options={{
            title: t("navigation.practice"),
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings/index"
          options={{
            title: t("navigation.settings"),
            href: null,
          }}
        />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  iconRoot: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "android"
      ? { renderToHardwareTextureAndroid: true }
      : { shouldRasterizeIOS: true }),
  },
  activeIconBubble: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  inactiveIconLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
