import { COLORS } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

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

export default function TabsLayout() {
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
          tabBarStyle: {
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
          tabBarIcon: ({ color, size }) => {
            const iconName = TAB_ICONS[baseRouteName] ?? "grid-outline";
            if (baseRouteName === "home") {
              return (
                <View
                  style={{
                    backgroundColor: COLORS.primary,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: -18,
                    shadowColor: COLORS.primary,
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <Ionicons name={iconName} size={24} color={COLORS.white} />
                </View>
              );
            }
            return <Ionicons name={iconName} size={size} color={color} />;
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
