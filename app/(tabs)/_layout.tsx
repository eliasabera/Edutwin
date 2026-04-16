import { COLORS } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
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

const TAB_LABELS: Record<string, string> = {
  "ai-tutor": "Tutor",
  textbook: "Textbook",
  home: "Home",
  lab: "Lab",
  profile: "Profile",
};

const getBaseRouteName = (routeName: string) =>
  routeName.replace(/\/index$/, "");

type TabBarIconProps = {
  iconName: TabIconName;
  color: string;
  size: number;
  focused: boolean;
};

function TabBarIcon({ iconName, color, size, focused }: TabBarIconProps) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: focused ? 220 : 170,
      easing: focused
        ? Easing.out(Easing.cubic)
        : Easing.inOut(Easing.quad),
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
        <Ionicons name={iconName} size={24} color={COLORS.white} />
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
        <Ionicons name={iconName} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const hideTabBar = useHideTabBar();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const baseRouteName = getBaseRouteName(route.name);

        return {
          headerShown: false,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
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
                backgroundColor: COLORS.white,
                borderTopWidth: 0,
                borderRadius: 24,
                shadowColor: "#0E234E",
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
          tabBarLabel: TAB_LABELS[baseRouteName] ?? baseRouteName,
          tabBarIcon: ({ color, size, focused }) => {
            const iconName = TAB_ICONS[baseRouteName] ?? "grid-outline";

            return (
              <TabBarIcon
                iconName={iconName}
                color={color}
                size={size}
                focused={focused}
              />
            );
          },
        };
      }}
    >
      <Tabs.Screen
        name="ai-tutor/index"
        options={{
          title: "Tutor",
          tabBarLabel: "Tutor",
        }}
      />
      <Tabs.Screen
        name="textbook/index"
        options={{
          title: "Textbook",
          tabBarLabel: "Textbook",
        }}
      />
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="lab/index"
        options={{
          title: "Lab",
          tabBarLabel: "Lab",
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
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
