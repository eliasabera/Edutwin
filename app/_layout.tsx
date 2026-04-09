import { COLORS } from "@/shared/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const MENU_SIZE = 56;
const ACTION_SIZE = 52;
const MENU_MARGIN = 10;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [appIsReady, setAppIsReady] = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);
  const [radialVisible, setRadialVisible] = useState(false);
  const initialMenuY = insets.top + 8;
  const menuPosition = useRef(
    new Animated.ValueXY({ x: 18, y: initialMenuY }),
  ).current;
  const radialProgress = useRef(new Animated.Value(0)).current;
  const menuPositionRef = useRef({ x: 18, y: initialMenuY });
  const [menuAnchor, setMenuAnchor] = useState({ x: 18, y: initialMenuY });
  const menuPositionInitializedRef = useRef(false);
  useFonts({}); // Add fonts here if needed

  const getDockedMenuPosition = (value: { x: number; y: number }) => {
    const { width, height } = Dimensions.get("window");
    const minX = MENU_MARGIN;
    const maxX = width - MENU_SIZE - MENU_MARGIN;
    const minY = insets.top + 8;
    const maxY = height - insets.bottom - MENU_SIZE - 14;
    const centerX = (minX + maxX) / 2;

    return {
      x: value.x < centerX ? minX : maxX,
      y: Math.max(minY, Math.min(value.y, maxY)),
    };
  };

  const animateMenuToDock = (value: { x: number; y: number }) => {
    const docked = getDockedMenuPosition(value);
    menuPosition.stopAnimation(() => {
      Animated.spring(menuPosition, {
        toValue: docked,
        useNativeDriver: false,
        friction: 7,
        tension: 95,
      }).start(() => {
        menuPositionRef.current = docked;
        setMenuAnchor(docked);
      });
    });
  };

  useEffect(() => {
    if (!menuPositionInitializedRef.current) {
      menuPosition.setValue({ x: 18, y: initialMenuY });
      menuPositionRef.current = { x: 18, y: initialMenuY };
      setMenuAnchor({ x: 18, y: initialMenuY });
      menuPositionInitializedRef.current = true;
    }
  }, [initialMenuY, menuPosition]);

  const sidebarActions = [
    ["Home", "/home", "grid-outline"],
    ["AI Tutor", "/ai-tutor", "chatbubbles-outline"],
    ["Practice", "/practice-hub", "library-outline"],
    ["Lab", "/lab", "flask-outline"],
    ["Textbook", "/textbook", "book-outline"],
    ["Profile", "/profile", "person-outline"],
  ] as const;

  const toggleRadial = () => {
    const next = !radialOpen;
    if (next) {
      setRadialVisible(true);
    }
    setRadialOpen(next);
    radialProgress.stopAnimation();
    Animated.timing(radialProgress, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      duration: next ? 210 : 160,
      easing: next ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    }).start(({ finished }) => {
      if (finished && !next) {
        setRadialVisible(false);
      }
    });
  };

  const closeRadial = (immediate = false) => {
    if (immediate) {
      radialProgress.stopAnimation();
      radialProgress.setValue(0);
      setRadialOpen(false);
      setRadialVisible(false);
      return;
    }

    setRadialOpen(false);
    radialProgress.stopAnimation();
    Animated.timing(radialProgress, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setRadialVisible(false);
      }
    });
  };

  const panMoveEvent = useRef(
    Animated.event([null, { dx: menuPosition.x, dy: menuPosition.y }], {
      useNativeDriver: false,
    }),
  ).current;

  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        if (radialOpen || radialVisible) {
          closeRadial(true);
        }
        menuPosition.stopAnimation();
        menuPosition.extractOffset();
        menuPosition.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: panMoveEvent,
      onPanResponderRelease: () => {
        menuPosition.flattenOffset();
        menuPosition.stopAnimation((value) => {
          animateMenuToDock(value);
        });
      },
      onPanResponderTerminate: () => {
        menuPosition.flattenOffset();
        menuPosition.stopAnimation((value) => {
          animateMenuToDock(value);
        });
      },
    }),
  ).current;

  const shellRoutes = [
    "/home",
    "/ai-tutor",
    "/lab",
    "/textbook",
    "/profile",
    "/practice-hub",
  ];
  const showSidebar = shellRoutes.includes(pathname);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const freeLeft = menuAnchor.x - MENU_MARGIN;
  const freeRight = screenWidth - (menuAnchor.x + MENU_SIZE) - MENU_MARGIN;
  const safeTop = insets.top + 8;
  const safeBottom = insets.bottom + 14;
  const freeTop = menuAnchor.y - safeTop;
  const freeBottom = screenHeight - (menuAnchor.y + MENU_SIZE) - safeBottom;

  const openRight = freeRight >= freeLeft;
  const openDown = freeBottom >= freeTop;

  let arcStartDeg = -150;
  let arcEndDeg = -15;

  if (openRight && openDown) {
    arcStartDeg = 12;
    arcEndDeg = 98;
  } else if (openRight && !openDown) {
    arcStartDeg = -98;
    arcEndDeg = -12;
  } else if (!openRight && openDown) {
    arcStartDeg = 82;
    arcEndDeg = 168;
  } else {
    arcStartDeg = -168;
    arcEndDeg = -82;
  }

  const directionalX = openRight ? freeRight : freeLeft;
  const directionalY = openDown ? freeBottom : freeTop;
  const availableRadius = Math.max(0, Math.min(directionalX, directionalY));
  const radialRadius = Math.max(88, Math.min(140, availableRadius));

  useEffect(() => {
    async function prepare() {
      try {
        // Mock DB/Auth loading delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    closeRadial();
  }, [pathname]);

  if (!appIsReady) return null;

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
      </Stack>

      {showSidebar && (
        <>
          {radialOpen && (
            <Pressable style={styles.backdrop} onPress={() => closeRadial()} />
          )}

          {radialVisible &&
            sidebarActions.map(([_label, path, icon], index) => {
            const count = sidebarActions.length;
            const angleDeg =
              arcStartDeg + (index * (arcEndDeg - arcStartDeg)) / (count - 1);
            const angle = (angleDeg * Math.PI) / 180;
            const offsetX = radialRadius * Math.cos(angle);
            const offsetY = radialRadius * Math.sin(angle);

            return (
              <Animated.View
                key={path}
                pointerEvents={radialOpen ? "auto" : "none"}
                style={[
                  styles.radialAction,
                  {
                    opacity: radialProgress,
                    transform: [
                      { translateX: menuPosition.x },
                      { translateY: menuPosition.y },
                      {
                        translateX: radialProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, offsetX],
                        }),
                      },
                      {
                        translateY: radialProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, offsetY],
                        }),
                      },
                      {
                        scale: radialProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.radialActionButton}
                  activeOpacity={0.85}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  onPress={() => {
                    closeRadial();
                    router.push(path as never);
                  }}
                >
                  <Ionicons
                    name={icon as "grid-outline"}
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
            })}

          <Animated.View
            style={[
              styles.menuButton,
              {
                transform: [
                  { translateX: menuPosition.x },
                  { translateY: menuPosition.y },
                ],
              },
            ]}
            {...menuPanResponder.panHandlers}
          >
            <TouchableOpacity
              style={styles.menuButtonTouch}
              activeOpacity={0.85}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              onPress={toggleRadial}
            >
              <Ionicons
                name={radialOpen ? "close" : "menu"}
                size={26}
                color="white"
              />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  menuButton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: MENU_SIZE,
    height: MENU_SIZE,
    borderRadius: MENU_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
    shadowColor: "#10203D",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === "android"
      ? { renderToHardwareTextureAndroid: true }
      : { shouldRasterizeIOS: true }),
  },
  menuButtonTouch: {
    width: "100%",
    height: "100%",
    borderRadius: MENU_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 18, 31, 0.12)",
    zIndex: 20,
  },
  radialAction: {
    position: "absolute",
    top: 0,
    left: 0,
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    zIndex: 32,
    alignItems: "center",
    ...(Platform.OS === "android"
      ? { renderToHardwareTextureAndroid: true }
      : { shouldRasterizeIOS: true }),
  },
  radialActionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10203D",
    shadowOpacity: 0.12,
    shadowRadius: 9,
    elevation: 6,
  },
});
