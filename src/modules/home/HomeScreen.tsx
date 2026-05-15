import {
  fetchStudentProfile,
  setCachedStudentProfile,
} from "@/shared/services/auth-service";
import {
  fetchAllCanvasLabResources,
  type LabCanvasResource,
} from "@/shared/services/ai-service";
import { getArTopics } from "@/shared/services/ar-service";
import { setPreferredLanguage } from "@/shared/store/language-store";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";
import {
  getStudentProfile,
  updateStudentProfile,
  useStudentProfile,
} from "@/shared/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/shared/i18n";

const FALLBACK_CANVAS_MODELS: LabCanvasResource[] = [
  {
    id: "fallback-physics-definition",
    subject: "physics",
    chapter: "Chapter 1: Foundations",
    title: "Definition and Nature of Physics",
    topic: "Definition and Nature of Physics",
    url: "https://fyp3d-view.onrender.com/grade9/physics/chapter1/Definition_and_Nature_of_Physics.html",
    gradeLevel: 9,
  },
  {
    id: "fallback-chemistry-photosynthesis",
    subject: "chemistry",
    chapter: "Chapter 1",
    title: "Photosynthesis",
    topic: "Photosynthesis",
    url: "https://fyp3d-view.onrender.com/grade9/chemistry/chapter1/Photosynthesis.html",
    gradeLevel: 9,
  },
  {
    id: "fallback-math-exponent-cube",
    subject: "math",
    chapter: "Chapter 3: Algebra",
    title: "Exponent Expansion Cube",
    topic: "Exponent Expansion Cube",
    url: "https://fyp3d-view.onrender.com/grade9/maths/chapter3/5.exponent_expansion_cube.html",
    gradeLevel: 9,
  },
];

type ShowcaseSlide = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  cta: string;
  target: "ai" | "canvas" | "ar";
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useTranslation();
  const isOm = language === "om";
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";

  const studentProfile = useStudentProfile();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [canvasItems, setCanvasItems] = useState<LabCanvasResource[]>([]);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const showcaseSlideX = useState(() => new Animated.Value(0))[0];
  const showcaseOpacity = useState(() => new Animated.Value(1))[0];

  const studentGradeNumber = Number.parseInt(
    String(studentProfile.grade || ""),
    10,
  );
  const homeCopy = {
    homeBadge: isOm ? "Mana" : "Home",
    streakLabel: isOm
      ? "guyyaa barnootaa walitti fufee"
      : "day learning streak",
    learningFlow: isOm ? "Tartiiba Barnoota EduTwin" : "EduTwin Learning Flow",
    aiTitle: isOm ? "Qajeelfama Gorsaa AI" : "AI Tutor Guidance",
    aiDescription: isOm
      ? "Gorsa dhuunfaa, ibsa saffisaa, fi karaalee shaakalaa sadarkaa barnootaa keetiin wal qabatan argadhu."
      : "Get personalized hints, instant explanations, and adaptive practice paths that match each student's mastery level.",
    openAiTutor: isOm ? "Gorsaa AI Bani" : "Open AI Tutor",
    canvasTitle: isOm
      ? "Kaanaavaasii Walitti Hidhata"
      : "Interactive Learning Canvas",
    canvasFallbackDescription: isOm
      ? "Moodeelota walitti hidhata qabaniin yaad-rimeewwan mul'ataa gochuun baradhu."
      : "Explore interactive concept simulations that turn abstract ideas into visual understanding.",
    openLab: isOm ? "Labooraatorii Bani" : "Open Learning Lab",
    arKicker: isOm ? "Cuuphannoo" : "Immersive",
    arTitle: isOm ? "Istuudiyoo Barnoota AR" : "AR Learning Studio",
    arDescription: isOm
      ? "Yaad-rimeewwan ulfaatoo muuxannoo 3D walitti hidhata qabuutti jijjiiri."
      : "Transform abstract concepts into interactive 3D experiences.",
    launchAr: isOm ? "Muuxannoo AR Jalqabi" : "Launch AR Experience",
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const syncProfile = async () => {
        if (isMounted) {
          setIsSyncing(true);
        }

        try {
          const latestProfile = await fetchStudentProfile({
            forceRefresh: true,
          });
          if (!isMounted) return;

          setCachedStudentProfile(latestProfile);

          const currentProfile = getStudentProfile();
          const normalizedStrong = Array.isArray(latestProfile.strong_subjects)
            ? latestProfile.strong_subjects.filter((item) =>
                ["biology", "chemistry", "physics", "math"].includes(item),
              )
            : [];
          const strongSet = new Set(normalizedStrong);
          const normalizedSupport = Array.isArray(
            latestProfile.support_subjects,
          )
            ? latestProfile.support_subjects
                .filter((item) =>
                  ["biology", "chemistry", "physics", "math"].includes(item),
                )
                .filter((item) => !strongSet.has(item))
            : [];

          updateStudentProfile({
            fullName: latestProfile.full_name || currentProfile.fullName,
            grade: String(
              latestProfile.grade_level ??
                latestProfile.grade ??
                currentProfile.grade,
            ),
            preferredLanguage: latestProfile.language === "om" ? "om" : "en",
            masteryScore:
              typeof latestProfile.mastery_score === "number"
                ? latestProfile.mastery_score
                : currentProfile.masteryScore,
            performanceBand:
              latestProfile.performance_band === "top"
                ? "top"
                : latestProfile.performance_band === "support" ||
                    latestProfile.performance_band === "low"
                  ? "support"
                  : latestProfile.performance_band === "medium"
                    ? "medium"
                    : currentProfile.performanceBand,
            twinName: latestProfile.twin_name || currentProfile.twinName,
            supportSubjects:
              normalizedSupport as typeof currentProfile.supportSubjects,
            strongSubjects:
              normalizedStrong as typeof currentProfile.strongSubjects,
            diagnosticCompleted:
              typeof latestProfile.diagnostic_completed === "boolean"
                ? latestProfile.diagnostic_completed
                : currentProfile.diagnosticCompleted,
            xp:
              typeof latestProfile.xp === "number"
                ? latestProfile.xp
                : currentProfile.xp,
            streak:
              typeof latestProfile.streak === "number"
                ? latestProfile.streak
                : currentProfile.streak,
            lastActive:
              typeof latestProfile.last_active === "string"
                ? latestProfile.last_active
                : currentProfile.lastActive,
          });

          await setPreferredLanguage(
            latestProfile.language === "om" ? "om" : "en",
          );
        } catch {
          // Keep the local profile when backend is unavailable.
        } finally {
          if (isMounted) {
            setIsSyncing(false);
          }
        }
      };

      void syncProfile();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  useEffect(() => {
    let isMounted = true;

    const loadCanvas = async () => {
      setIsLoadingCanvas(true);
      try {
        const fetched = await fetchAllCanvasLabResources();
        if (!isMounted) return;

        const gradeMatched = Number.isFinite(studentGradeNumber)
          ? fetched.filter(
              (item) =>
                !item.gradeLevel || item.gradeLevel === studentGradeNumber,
            )
          : fetched;

        const merged = [...gradeMatched];
        for (const fallback of FALLBACK_CANVAS_MODELS) {
          if (
            Number.isFinite(studentGradeNumber) &&
            fallback.gradeLevel &&
            fallback.gradeLevel !== studentGradeNumber
          ) {
            continue;
          }
          if (!merged.some((item) => item.subject === fallback.subject)) {
            merged.push(fallback);
          }
        }

        const subjectPriority: Array<LabCanvasResource["subject"]> = [
          "physics",
          "chemistry",
          "math",
        ];

        const prioritized = subjectPriority
          .map(
            (subject) =>
              merged.find((item) => item.subject === subject) || null,
          )
          .filter(Boolean) as LabCanvasResource[];

        const remaining = merged.filter(
          (item) => !prioritized.some((selected) => selected.id === item.id),
        );

        const orderedCanvas = [...prioritized, ...remaining].slice(0, 5);

        setCanvasItems(orderedCanvas);
      } finally {
        if (isMounted) {
          setIsLoadingCanvas(false);
        }
      }
    };

    void loadCanvas();

    return () => {
      isMounted = false;
    };
  }, [studentGradeNumber]);

  const profileName = studentProfile.fullName || t("home.studentFallback");
  const displayName = profileName.split(" ")[0];
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const featuredAr = useMemo(() => {
    const allAr = getArTopics();
    if (!allAr.length) return null;

    const preferredSubject =
      studentProfile.supportSubjects?.[0] ||
      studentProfile.strongSubjects?.[0] ||
      "biology";

    return (
      allAr.find((item) => item.subject === preferredSubject) ||
      allAr[0] ||
      null
    );
  }, [studentProfile.strongSubjects, studentProfile.supportSubjects]);

  const prioritizedCanvasItems = useMemo(() => {
    const subjectPriority: Array<LabCanvasResource["subject"]> = [
      "physics",
      "chemistry",
      "math",
    ];

    const prioritizedBySubject = subjectPriority
      .map(
        (subject) =>
          canvasItems.find((item) => item.subject === subject) || null,
      )
      .filter(Boolean) as LabCanvasResource[];

    if (prioritizedBySubject.length > 0) {
      return prioritizedBySubject;
    }

    return canvasItems.slice(0, 4);
  }, [canvasItems]);

  const selectedCanvas = prioritizedCanvasItems[0] || null;

  const showcaseSlides = useMemo<ShowcaseSlide[]>(() => {
    const canvasDescription = isLoadingCanvas
      ? t("home.loadingCanvas")
      : selectedCanvas
        ? isOm
          ? `${selectedCanvas.title} fakkaatan moodeelota waliin shaakali; yaad-rimeewwan qabatamaan hubadhu.`
          : `Practice with interactive models like ${selectedCanvas.title}. Learn by manipulating real concepts instead reading notes.`
        : homeCopy.canvasFallbackDescription;

    return [
      {
        id: "show-ai",
        title: homeCopy.aiTitle,
        description: homeCopy.aiDescription,
        icon: "sparkles-outline",
        cta: homeCopy.openAiTutor,
        target: "ai",
      },
      {
        id: "show-canvas",
        title: homeCopy.canvasTitle,
        description: canvasDescription,
        icon: "layers-outline",
        cta: homeCopy.openLab,
        target: "canvas",
      },
    ];
  }, [
    homeCopy.aiDescription,
    homeCopy.aiTitle,
    homeCopy.canvasFallbackDescription,
    homeCopy.canvasTitle,
    homeCopy.openAiTutor,
    homeCopy.openLab,
    isLoadingCanvas,
    isOm,
    selectedCanvas,
    t,
  ]);

  const activeShowcase =
    showcaseSlides[activeShowcaseIndex] || showcaseSlides[0];

  useEffect(() => {
    setActiveShowcaseIndex((prev) =>
      prev >= showcaseSlides.length ? 0 : prev,
    );
  }, [showcaseSlides.length]);

  useEffect(() => {
    if (showcaseSlides.length <= 1) return;

    const interval = setInterval(() => {
      setActiveShowcaseIndex((prev) => (prev + 1) % showcaseSlides.length);
    }, 4200);

    return () => clearInterval(interval);
  }, [showcaseSlides.length]);

  useEffect(() => {
    showcaseSlideX.setValue(22);
    showcaseOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(showcaseSlideX, {
        toValue: 0,
        duration: 340,
        useNativeDriver: true,
      }),
      Animated.timing(showcaseOpacity, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeShowcaseIndex, showcaseOpacity, showcaseSlideX]);

  const handleOpenShowcase = useCallback(() => {
    if (!activeShowcase) return;

    if (activeShowcase.target === "ai") {
      router.push("/(tabs)/ai-tutor" as never);
      return;
    }

    if (activeShowcase.target === "canvas") {
      router.push("/(tabs)/lab" as never);
      return;
    }

    if (featuredAr?.id) {
      router.push(`/ar-view/${featuredAr.id}` as never);
    }
  }, [activeShowcase, featuredAr?.id, router]);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 112,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <View
          style={[
            styles.homeBadgeCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.94)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.16)",
            },
          ]}
        >
          <View style={styles.homeBadgeRow}>
            <Ionicons name="home-outline" size={15} color="#0B5FFF" />
            <Text
              style={[
                styles.homeBadgeText,
                { color: isDark ? "#F4F7FB" : "#1A202C" },
              ]}
            >
              {homeCopy.homeBadge}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#DCE9FC",
            },
          ]}
        >
          <View style={styles.profileRow}>
            <View style={styles.profileIdentity}>
              <View
                style={[
                  styles.avatarWrap,
                  {
                    backgroundColor: isDark ? "#1B3256" : "#E7F0FF",
                    borderColor: isDark ? "#3E5E94" : "#C8DBFF",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: isDark ? "#DDEAFF" : "#0B5FFF" },
                  ]}
                >
                  {avatarLetter}
                </Text>
              </View>

              <View style={styles.profileTextWrap}>
                <Text
                  style={[
                    styles.profileName,
                    { color: isDark ? "#F4F7FB" : "#12233F" },
                  ]}
                  numberOfLines={1}
                >
                  {profileName}
                </Text>
                <View style={styles.statusRow}>
                  <Ionicons name="flame" size={12} color="#F7A019" />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isDark ? "#C3D4F2" : "#5073A8" },
                    ]}
                    numberOfLines={1}
                  >
                    {(studentProfile.streak ?? 0).toString()}{" "}
                    {homeCopy.streakLabel}
                  </Text>
                </View>
              </View>
            </View>

            {isSyncing ? (
              <View
                style={[
                  styles.syncPill,
                  {
                    backgroundColor: isDark ? "#121C2E" : "#ECF3FF",
                    borderColor: isDark ? "#2E4368" : "#D4E3FA",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.syncText,
                    { color: isDark ? "#BFD6FF" : "#1F4E9D" },
                  ]}
                >
                  {t("home.syncing")}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.mainFeatureCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
              borderColor: isDark ? "#22324E" : "#DCE9FC",
            },
          ]}
        >
          <View
            style={[
              styles.showcaseCard,
              {
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#DCE9FC",
              },
            ]}
          >
            <Animated.View
              style={[
                styles.showcaseAnimatedContent,
                {
                  opacity: showcaseOpacity,
                  transform: [{ translateX: showcaseSlideX }],
                },
              ]}
            >
              <View
                style={[
                  styles.floatBadge,
                  {
                    backgroundColor: isDark ? "#121C2E" : "#EEF4FF",
                    borderColor: isDark ? "#2E4368" : "#D4E3FA",
                  },
                ]}
              >
                <Ionicons
                  name={activeShowcase.icon}
                  size={20}
                  color="#0B5FFF"
                />
              </View>

              <Text
                style={[
                  styles.showcaseEyebrow,
                  { color: isDark ? "#BFD6FF" : "#4870A8" },
                ]}
              >
                {homeCopy.learningFlow}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.showcaseTitle,
                  { color: isDark ? "#F4F7FB" : "#102646" },
                ]}
              >
                {activeShowcase.title}
              </Text>
              <Text
                numberOfLines={3}
                style={[
                  styles.showcaseDescription,
                  { color: isDark ? "#CFDCF4" : "#4E6790" },
                ]}
              >
                {activeShowcase.description}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.showcaseAction,
                  pressed && styles.primaryActionPressed,
                ]}
                onPress={handleOpenShowcase}
              >
                <Text style={styles.showcaseActionText}>
                  {activeShowcase.cta}
                </Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.dotRow}>
            {showcaseSlides.map((slide, index) => {
              const active = index === activeShowcaseIndex;
              return (
                <View
                  key={`dot-${slide.id}`}
                  style={[
                    styles.dot,
                    {
                      width: active ? 15 : 6,
                      backgroundColor: active
                        ? "#0B5FFF"
                        : isDark
                          ? "#38557F"
                          : "#C4D6F3",
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.fixedCardGap} />

        <View
          style={[
            styles.arInfoCard,
            {
              backgroundColor: isDark ? "#1B3F8C" : "#2A57BE",
              borderColor: isDark ? "#3A63B2" : "#4C75D0",
            },
          ]}
        >
          <View style={styles.arGlowOrb} />

          <View style={styles.arModelWrap}>
            <Image
              source={require("../../../assets/images/ar_model.png")}
              style={styles.arModelImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.arTextWrap}>
            <Text style={[styles.arKicker, { color: "#D7E6FF" }]}>
              {homeCopy.arKicker}
            </Text>
            <Text style={[styles.arTitle, { color: "#F6FAFF" }]}>
              {homeCopy.arTitle}
            </Text>
            <Text style={[styles.arDescription, { color: "#D9E6FF" }]}>
              {homeCopy.arDescription}
            </Text>
          </View>

          <Pressable
            disabled={!featuredAr}
            style={({ pressed }) => [
              styles.arAction,
              !featuredAr && styles.disabledAction,
              pressed && featuredAr && styles.primaryActionPressed,
            ]}
            onPress={() => {
              if (!featuredAr?.id) return;
              router.push(`/ar-view/${featuredAr.id}` as never);
            }}
          >
            <Text style={styles.arActionText}>{homeCopy.launchAr}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 0,
  },
  brandMark: {
    color: "#12233F",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  homeBadgeCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#0E234E",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  homeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  homeBadgeText: {
    fontSize: 18,
    fontWeight: "800",
  },
  profileCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE9FC",
    padding: 12,
    gap: 8,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  profileIdentity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 23,
    fontWeight: "800",
  },
  profileTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "800",
  },
  profileSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  syncPill: {
    borderRadius: 999,
    backgroundColor: "#ECF3FF",
    borderWidth: 1,
    borderColor: "#D4E3FA",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  syncText: {
    color: "#1F4E9D",
    fontSize: 10,
    fontWeight: "700",
  },
  mainFeatureCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    height: 320,
  },
  arInfoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    overflow: "hidden",
    position: "relative",
  },
  sectionHint: {
    color: "#60779E",
    fontSize: 12,
    fontWeight: "600",
  },
  showcaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 14,
    gap: 10,
    position: "relative",
    overflow: "hidden",
  },
  floatBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  showcaseAnimatedContent: {
    gap: 10,
  },
  showcaseEyebrow: {
    fontSize: 12,
    fontWeight: "700",
  },
  showcaseTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    maxWidth: "85%",
  },
  showcaseDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    maxWidth: "88%",
    minHeight: 60,
  },
  showcaseAction: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  showcaseActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 99,
  },
  fixedCardGap: {
    height: 2,
  },
  arTextWrap: {
    gap: 3,
    maxWidth: "52%",
    zIndex: 2,
  },
  arGlowOrb: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 120,
    right: -58,
    top: -78,
    backgroundColor: "rgba(143, 183, 255, 0.24)",
  },
  arModelWrap: {
    position: "absolute",
    right: -28,
    top: -20,
    width: 262,
    height: 188,
    pointerEvents: "none",
    zIndex: 1,
  },
  arModelImage: {
    width: "100%",
    height: "100%",
  },
  arKicker: {
    fontSize: 13,
    fontWeight: "700",
  },
  arTitle: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
  },
  arDescription: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  primaryAction: {
    borderRadius: 14,
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  arAction: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(225,238,255,0.45)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    zIndex: 2,
  },
  arActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryActionPressed: {
    opacity: 0.9,
  },
  disabledAction: {
    backgroundColor: "#9DB8ED",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
});
