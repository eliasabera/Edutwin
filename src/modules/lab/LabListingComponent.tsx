import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { COLORS } from "../../../shared/constants/colors";
import { useTranslation } from "../../../shared/i18n";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "../../../shared/store/settings-store";
import { useStudentProfile } from "../../../shared/store/user-store";
import {
  fetchAllCanvasLabResources,
  fetchAllArLabResources,
  type LabCanvasResource,
} from "../../../shared/services/lab";
import { setArTopics, type ArTopic } from "../../../shared/services/ar-service";
import {
  getCurrentPlan,
} from "../../../shared/services/subscription-service";
import {
  getStudentAccessStatus,
  peekStudentAccessStatus,
  type StudentAccessStatus,
} from "../../../shared/services/student-access-service";

type SubjectKey = "biology" | "chemistry" | "physics" | "math";

type LabItem = {
  id: string;
  title: string;
  category: "Biology" | "Chemistry" | "Physics" | "Math";
  chapter: string;
  icon: string;
  desc: string;
  url: string;
};

const HOME_PRIMARY = "#0B5FFF";
const HOME_ACCENT = "#FF9600";

const SUBJECT_ORDER: SubjectKey[] = ["biology", "chemistry", "physics", "math"];

const SUBJECT_ICON: Record<SubjectKey, string> = {
  biology: "leaf-outline",
  chemistry: "flask-outline",
  physics: "flash-outline",
  math: "calculator-outline",
};

const toCategory = (subject: SubjectKey): LabItem["category"] => {
  if (subject === "biology") return "Biology";
  if (subject === "chemistry") return "Chemistry";
  if (subject === "physics") return "Physics";
  return "Math";
};

const toSubjectKey = (value: string): SubjectKey =>
  value.toLowerCase() as SubjectKey;

const chapterNumber = (value: string): number => {
  const match = String(value || "").match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
};

const compareChapterAsc = (a: string, b: string): number => {
  const aNumber = chapterNumber(a);
  const bNumber = chapterNumber(b);
  if (aNumber !== bNumber) {
    return aNumber - bNumber;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

const compareTextAsc = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

export default function LabListingComponent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const appSettings = useAppSettings();
  const studentProfile = useStudentProfile();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";
  const { language } = useTranslation();
  const isOm = language === "om";
  
  const [accessStatus, setAccessStatus] = useState<StudentAccessStatus | null>(
    () => peekStudentAccessStatus(),
  );
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(
    () => !peekStudentAccessStatus(),
  );

  const copy = {
    badge: isOm ? "Labooraatorii Mataduree" : "Lab by Subject",
    title: isOm ? "Labooraatorii Dijitaalaa" : "Virtual Lab",
    subtitle: isOm
      ? "Matadureen tokkoon tokkoon isaa Canvas fi AR adda adda qaba."
      : "Each subject has separate Canvas simulations and AR models.",
    subjects: isOm ? "matadureewwan" : "subjects",
    canvasModels: isOm ? "Moodeloota Canvas" : "Canvas Models",
    arModels: isOm ? "Moodeloota AR" : "AR Models",
    loadingCanvas: isOm
      ? "Moodeloota Canvas fe'aa jira..."
      : "Loading canvas models...",
    noCanvas: isOm ? "Moodeloonni Canvas hin jiran." : "No canvas models yet.",
    noAr: isOm ? "Moodeloonni AR hin jiran." : "No AR models yet.",
    openAr: isOm ? "AR banuu" : "Open AR",
    canvasModel: isOm ? "Moodeela Canvas" : "Canvas Model",
    filterTitle: isOm ? "Filannoo Labooraatorii" : "Lab Filters",
    filterSubtitle: isOm
      ? "Mataduree, haala, fi boqonnaa filadhu."
      : "Pick subject, mode, and chapter.",
    selectSubject: isOm ? "Mataduree" : "Subject",
    selectChapter: isOm ? "Boqonnaa" : "Chapter",
    noChapter: isOm ? "Boqonnaan hin jiru." : "No chapters available.",
    filterHint: isOm
      ? "Qabiyyeen mul'atuuf armaan gadiitti filannoo godhi."
      : "Use the filters to display lab content.",
    openingCanvas: isOm
      ? "Moodeela canvas banaa jira..."
      : "Opening canvas model...",
    lockedFeature: isOm ? "Tajaajila cufame" : "Locked feature",
    freeLabel: isOm ? "Bilisa" : "Free",
    proLabel: isOm ? "Subscription" : "Subscription",
    lockMessage: isOm
      ? "Yaalii bilisaa guyyaa 7 xumurame. Canvas fi AR hunda banuuf subscribe godhi."
      : "Your 7-day free trial has ended. Subscribe to unlock all Canvas and AR models.",
    trialActive: isOm ? "Yaalii bilisa hojii irra" : "Free trial active",
    trialDaysLeft: isOm ? "guyyaa Canvas & AR irratti hafe" : "day(s) left for Canvas & AR",
    trialEnded: isOm ? "Yaalii xumurame — subscribe godhi" : "Trial ended — subscribe to continue",
    loadingSubscription: isOm ? "Haala subscription fe'amaa..." : "Loading subscription status...",
  };

  const isSubscribed = accessStatus?.isSubscribed === true;
  const isOnTrial = accessStatus?.isOnTrial === true;
  const hasLabAccess = accessStatus?.hasLabAccess === true;
  const trialDaysLeft = accessStatus?.trialDaysLeft ?? 0;
  
  const subjectLabel = (subject: SubjectKey) => {
    if (subject === "biology") return isOm ? "Baayoloojii" : "Biology";
    if (subject === "chemistry") return isOm ? "Keemistirii" : "Chemistry";
    if (subject === "physics") return isOm ? "Fiiziksii" : "Physics";
    return isOm ? "Herrega" : "Math";
  };
  
  const [canvasResources, setCanvasResources] = useState<LabItem[]>([]);
  const [arTopics, setArTopicsState] = useState<ArTopic[]>([]);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [activeCanvasUrl, setActiveCanvasUrl] = useState<string | null>(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [hasUsedFilters, setHasUsedFilters] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>("biology");
  const [selectedMode, setSelectedMode] = useState<"canvas" | "ar">("canvas");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const studentGradeNumber = Number.parseInt(
    String(studentProfile.grade || ""),
    10,
  );

  // Load subscription status
  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      const cached = peekStudentAccessStatus();
      if (cached) {
        setAccessStatus(cached);
        setLoadingSubscription(false);
      }
      try {
        const [access, plan] = await Promise.all([
          getStudentAccessStatus(),
          getCurrentPlan(),
        ]);
        if (isMounted) {
          setAccessStatus(access);
          setCurrentPlan(plan);
        }
      } catch (error) {
        console.error("Failed to load subscription:", error);
        if (isMounted) {
          setAccessStatus(null);
        }
      } finally {
        if (isMounted) {
          setLoadingSubscription(false);
        }
      }
    };

    loadSubscription();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCanvasResources = async () => {
      setIsLoadingCanvas(true);
      try {
        const [fetchedCanvas, fetchedAr] = await Promise.all([
          fetchAllCanvasLabResources(),
          fetchAllArLabResources(),
        ]);
        if (!isMounted) return;

        const filteredCanvasByGrade = Number.isFinite(studentGradeNumber)
          ? fetchedCanvas.filter(
              (item) =>
                !item.gradeLevel || item.gradeLevel === studentGradeNumber,
            )
          : fetchedCanvas;

        const filteredArByGrade = Number.isFinite(studentGradeNumber)
          ? fetchedAr.filter(
              (item) =>
                !item.gradeLevel || item.gradeLevel === studentGradeNumber,
            )
          : fetchedAr;

        const mappedCanvas = filteredCanvasByGrade.map(
          (item: LabCanvasResource) => {
            const subjectKey = toSubjectKey(item.subject);
            return {
              id: item.id,
              title: item.title,
              category: toCategory(subjectKey),
              chapter: item.chapter,
              icon: SUBJECT_ICON[subjectKey],
              desc: item.topic,
              url: item.url,
            } as LabItem;
          },
        );

        const mappedAr: ArTopic[] = filteredArByGrade.map((item) => ({
          id: item.id,
          title: item.title,
          topic: item.topic,
          subject: toSubjectKey(item.subject),
          gradeLevel: item.gradeLevel,
          chapter: item.chapter,
          description: `${item.topic} AR model`,
          learningPrompt: `Explore ${item.topic} in AR and explain the key concept.`,
          modelUrl: item.url,
          integrationNote: "Loaded from virtual lab database.",
          isPlaceholderDemo: false,
        }));

        setCanvasResources(mappedCanvas);
        setArTopicsState(mappedAr);
        setArTopics(mappedAr);
      } finally {
        if (isMounted) {
          setIsLoadingCanvas(false);
        }
      }
    };

    void loadCanvasResources();
    return () => {
      isMounted = false;
    };
  }, [studentGradeNumber]);

  const sections = useMemo(() => {
    return SUBJECT_ORDER.map((subject) => {
      const canvasItems = canvasResources
        .filter((lab) => toSubjectKey(lab.category) === subject)
        .sort((a, b) => {
          const chapterOrder = compareChapterAsc(a.chapter, b.chapter);
          if (chapterOrder !== 0) {
            return chapterOrder;
          }
          return compareTextAsc(a.title, b.title);
        });

      const arItems = arTopics
        .filter((topic) => topic.subject === subject)
        .sort((a, b) => {
          const chapterOrder = compareChapterAsc(a.chapter, b.chapter);
          if (chapterOrder !== 0) {
            return chapterOrder;
          }
          return compareTextAsc(a.topic, b.topic);
        });

      const chapters = Array.from(
        new Set([
          ...canvasItems.map((item) => item.chapter),
          ...arItems.map((item) => item.chapter),
        ]),
      ).sort(compareChapterAsc);

      return {
        subject,
        canvasItems,
        arItems,
        chapters,
      };
    });
  }, [arTopics, canvasResources]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.subject === selectedSubject) ??
      sections[0],
    [sections, selectedSubject],
  );

  const availableChapters = activeSection?.chapters ?? [];
  const effectiveChapter = availableChapters.includes(selectedChapter)
    ? selectedChapter
    : (availableChapters[0] ?? "");

  useEffect(() => {
    if (!availableChapters.length) {
      if (selectedChapter !== "") {
        setSelectedChapter("");
      }
      return;
    }

    if (!availableChapters.includes(selectedChapter)) {
      setSelectedChapter(availableChapters[0]);
    }
  }, [availableChapters, selectedChapter]);

  const filteredCanvas = effectiveChapter
    ? (activeSection?.canvasItems ?? []).filter(
        (item) => item.chapter === effectiveChapter,
      )
    : (activeSection?.canvasItems ?? []);

  const filteredAr = effectiveChapter
    ? (activeSection?.arItems ?? []).filter(
        (item) => item.chapter === effectiveChapter,
      )
    : (activeSection?.arItems ?? []);

  const isCanvasLocked = () => !hasLabAccess;

  const isArLocked = () => !hasLabAccess;

  const overviewStats = [
    {
      label: copy.canvasModels,
      value: String(canvasResources.length),
      icon: "layers-outline" as const,
    },
    {
      label: copy.arModels,
      value: String(arTopics.length),
      icon: "cube-outline" as const,
    },
    {
      label: copy.subjects,
      value: String(sections.length),
      icon: "grid-outline" as const,
    },
  ];

  const openSimulation = (url: string) => {
    setActiveCanvasUrl(url);
  };

  const openArModel = (modelId: string) => {
    router.push({
      pathname: "/ar-view/[modelId]",
      params: { modelId },
    });
  };

  const showLockedMessage = () => {
    Alert.alert(copy.lockedFeature, copy.lockMessage, [
      { text: "OK" },
      {
        text: isOm ? "Subscribe" : "Subscribe",
        onPress: () => router.push("/(tabs)/settings"),
      },
    ]);
  };

  // Loading state
  if (loadingSubscription) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? "#08111F" : "#FFFFFF" }]}>
        <ActivityIndicator size="large" color={HOME_PRIMARY} />
        <Text style={[styles.loadingText, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}>
          {copy.loadingSubscription}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
    >
      <View pointerEvents="none" style={styles.bgGlowBlue} />
      <View pointerEvents="none" style={styles.bgGlowGold} />
      <View pointerEvents="none" style={styles.bgGlowSky} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: 120 + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
        <View
          style={[
            styles.labTopBadgeCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.94)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.16)",
            },
          ]}
        >
          <View style={styles.labTopBadgeRow}>
            <Ionicons name="flask-outline" size={15} color="#0B5FFF" />
            <Text
              style={[
                styles.labTopBadgeText,
                { color: isDark ? "#F4F7FB" : "#1A202C" },
              ]}
            >
              {copy.title}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.84)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
            },
          ]}
        >
          <View
            style={[
              styles.heroBadge,
              {
                backgroundColor: isDark ? "#121C2E" : "#E7F0FF",
                borderColor: isDark ? "#2E4368" : "#D4E3FA",
              },
            ]}
          >
            <Ionicons
              name="flask-outline"
              size={14}
              color={isDark ? "#8FB7FF" : "#0B5FFF"}
            />
            <Text
              style={[
                styles.heroBadgeText,
                { color: isDark ? "#D5E5FF" : "#0B5FFF" },
              ]}
            >
              {copy.badge}
            </Text>
          </View>

          <Text
            style={[styles.title, { color: isDark ? "#F4F7FB" : "#1A202C" }]}
          >
            {copy.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}
          >
            {copy.subtitle}
          </Text>

          <View style={styles.overviewGrid}>
            {overviewStats.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.overviewStatCard,
                  {
                    backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                    borderColor: isDark ? "#2E4368" : "#D6E4FF",
                  },
                ]}
              >
                <View style={styles.overviewStatTop}>
                  <Ionicons name={item.icon} size={15} color="#0B5FFF" />
                  <Text
                    style={[
                      styles.overviewStatValue,
                      { color: isDark ? "#F4F7FB" : "#1A202C" },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.overviewStatLabel,
                    { color: isDark ? "#AAB7CF" : "#5A6C87" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.subjectCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.84)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
            },
          ]}
        >
          <Pressable
            style={[
              styles.dropdownTrigger,
              {
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
              },
            ]}
            onPress={() => setIsSubjectDropdownOpen((current) => !current)}
          >
            <Text
              style={[
                styles.dropdownTriggerText,
                { color: isDark ? "#BFD6FF" : "#35507E" },
              ]}
            >
              {subjectLabel(selectedSubject)}
            </Text>
            <Ionicons
              name={isSubjectDropdownOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? "#BFD6FF" : "#35507E"}
            />
          </Pressable>

          {isSubjectDropdownOpen ? (
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: isDark ? "#121C2E" : "#FFFFFF",
                  borderColor: isDark ? "#2E4368" : "#D6E4FF",
                },
              ]}
            >
              {SUBJECT_ORDER.map((subject) => {
                const active = selectedSubject === subject;
                return (
                  <Pressable
                    key={subject}
                    style={[
                      styles.dropdownItem,
                      active && {
                        backgroundColor: isDark
                          ? "rgba(11,95,255,0.24)"
                          : "#EAF2FF",
                      },
                    ]}
                    onPress={() => {
                      setHasUsedFilters(true);
                      setSelectedSubject(subject);
                      setIsSubjectDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: isDark ? "#D5E5FF" : "#1A202C" },
                      ]}
                    >
                      {subjectLabel(subject)}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={16} color="#0B5FFF" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.modeToggleRow}>
            {[
              {
                key: "canvas" as const,
                label: copy.canvasModels,
                icon: "layers-outline" as const,
              },
              {
                key: "ar" as const,
                label: copy.arModels,
                icon: "cube-outline" as const,
              },
            ].map((mode) => {
              const active = selectedMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.modeToggleChip,
                    {
                      backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                      borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    },
                    active && styles.modeToggleChipActive,
                  ]}
                  onPress={() => setSelectedMode(mode.key)}
                  onPressIn={() => setHasUsedFilters(true)}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={mode.icon}
                    size={14}
                    color={active ? "#FFFFFF" : "#0B5FFF"}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      { color: isDark ? "#BFD6FF" : "#35507E" },
                      active && styles.modeToggleTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Show subscription badge */}
          {isSubscribed ? (
            <View
              style={[
                styles.subscriptionBadge,
                {
                  backgroundColor: isDark ? "#121C2E" : "#E7F0FF",
                  borderColor: isDark ? "#2E4368" : "#D4E3FA",
                },
              ]}
            >
              <Ionicons name="diamond-outline" size={14} color={HOME_PRIMARY} />
              <Text
                style={[
                  styles.subscriptionBadgeText,
                  { color: HOME_PRIMARY },
                ]}
              >
                {currentPlan?.name || "Premium"} • {isOm ? "Hundumaa banaa" : "Full Access"}
              </Text>
            </View>
          ) : null}

          {isOnTrial ? (
            <View
              style={[
                styles.freeNoticeCard,
                {
                  backgroundColor: isDark ? "#0E2240" : "#EAF2FF",
                  borderColor: isDark ? "#1E4A8C" : "#B8D4FF",
                },
              ]}
            >
              <Ionicons name="time-outline" size={14} color={HOME_PRIMARY} />
              <Text
                style={[
                  styles.freeNoticeText,
                  { color: isDark ? "#B8D4FF" : "#0045B0" },
                ]}
              >
                {copy.trialActive}: {trialDaysLeft} {copy.trialDaysLeft}
              </Text>
            </View>
          ) : null}

          {accessStatus?.trialExpired ? (
            <View
              style={[
                styles.freeNoticeCard,
                {
                  backgroundColor: isDark ? "#2A1A1A" : "#FFF5F5",
                  borderColor: isDark ? "#6B2D2D" : "#FECACA",
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={14} color="#DC2626" />
              <Text
                style={[
                  styles.freeNoticeText,
                  { color: isDark ? "#FCA5A5" : "#991B1B" },
                ]}
              >
                {copy.trialEnded}
              </Text>
            </View>
          ) : null}

          {availableChapters.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#AAB7CF" : "#5A6C87" },
              ]}
            >
              {copy.noChapter}
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={styles.chapterFilterRow}
            >
              {availableChapters.map((chapter) => {
                const active = effectiveChapter === chapter;
                return (
                  <TouchableOpacity
                    key={chapter}
                    style={[
                      styles.chapterChip,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                      },
                      active && styles.chapterChipActive,
                    ]}
                    onPress={() => setSelectedChapter(chapter)}
                    onPressIn={() => setHasUsedFilters(true)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.chapterChipText,
                        { color: isDark ? "#BFD6FF" : "#35507E" },
                        active && styles.chapterChipTextActive,
                      ]}
                    >
                      {chapter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectedMode === "canvas" ? (
            filteredCanvas.length === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#AAB7CF" : "#5A6C87" },
                ]}
              >
                {isLoadingCanvas ? copy.loadingCanvas : copy.noCanvas}
              </Text>
            ) : (
              <View style={styles.modelBlock}>
                {filteredCanvas.map((item) =>
                  (() => {
                    const locked = isCanvasLocked();
                    const freeItem = !locked && !isSubscribed;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.canvasCard,
                          locked && styles.lockedCard,
                          {
                            backgroundColor: isDark
                              ? "rgba(14,26,44,0.9)"
                              : "rgba(255,255,255,0.84)",
                            borderColor: isDark
                              ? "#22324E"
                              : "rgba(11, 95, 255, 0.12)",
                          },
                        ]}
                        onPress={() =>
                          locked
                            ? showLockedMessage()
                            : openSimulation(item.url)
                        }
                        activeOpacity={0.9}
                      >
                        <View
                          style={[
                            styles.iconBox,
                            styles.iconBoxBlue,
                            {
                              backgroundColor: isDark ? "#121C2E" : "#E7F0FF",
                              borderColor: isDark ? "#2E4368" : "#C8DCF9",
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={28}
                            color={HOME_PRIMARY}
                          />
                        </View>

                        <View style={styles.info}>
                          <View style={styles.topRow}>
                            <Text style={styles.category}>CANVAS</Text>
                            {locked ? (
                              <View style={styles.lockBadge}>
                                <Ionicons
                                  name="lock-closed"
                                  size={12}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.lockBadgeText}>
                                  {copy.proLabel}
                                </Text>
                              </View>
                            ) : freeItem ? (
                              <View
                                style={[styles.lockBadge, styles.freeBadge]}
                              >
                                <Ionicons
                                  name="gift-outline"
                                  size={12}
                                  color="#FFFFFF"
                                />
                                <Text style={styles.lockBadgeText}>
                                  {copy.freeLabel}
                                </Text>
                              </View>
                            ) : (
                              <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={isDark ? "#8FA1BF" : COLORS.textLight}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.labTitle,
                              { color: isDark ? "#F4F7FB" : "#1A202C" },
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text
                            style={[
                              styles.chapterText,
                              { color: isDark ? "#BFD6FF" : "#35507E" },
                            ]}
                          >
                            {item.chapter}
                          </Text>
                          <Text
                            style={[
                              styles.desc,
                              { color: isDark ? "#AAB7CF" : "#5A6C87" },
                            ]}
                          >
                            {item.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })(),
                )}
              </View>
            )
          ) : filteredAr.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#AAB7CF" : "#5A6C87" },
              ]}
            >
              {copy.noAr}
            </Text>
          ) : (
            <View style={styles.arStack}>
              {filteredAr.map((topic) =>
                (() => {
                  const locked = isArLocked();
                  const freeItem = !locked && !isSubscribed;
                  return (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.arCardWide,
                        locked && styles.lockedCard,
                        {
                          backgroundColor: isDark
                            ? "rgba(14,26,44,0.9)"
                            : "rgba(255,255,255,0.86)",
                          borderColor: isDark ? "#22324E" : "#DCE7FA",
                        },
                      ]}
                      onPress={() =>
                        locked ? showLockedMessage() : openArModel(topic.id)
                      }
                      activeOpacity={0.9}
                    >
                      <View style={styles.arCardWideTop}>
                        <View
                          style={[
                            styles.arIconWrap,
                            {
                              backgroundColor: isDark ? "#121C2E" : "#E7F0FF",
                            },
                          ]}
                        >
                          <Ionicons
                            name="cube-outline"
                            size={20}
                            color="#0B5FFF"
                          />
                        </View>
                        {locked ? (
                          <View style={styles.lockBadge}>
                            <Ionicons
                              name="lock-closed"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.lockBadgeText}>
                              {copy.proLabel}
                            </Text>
                          </View>
                        ) : freeItem ? (
                          <View style={[styles.lockBadge, styles.freeBadge]}>
                            <Ionicons
                              name="gift-outline"
                              size={12}
                              color="#FFFFFF"
                            />
                            <Text style={styles.lockBadgeText}>
                              {copy.freeLabel}
                            </Text>
                          </View>
                        ) : (
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={isDark ? "#8FA1BF" : COLORS.textLight}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.arTitleWide,
                          { color: isDark ? "#F4F7FB" : "#1A202C" },
                        ]}
                        numberOfLines={1}
                      >
                        {topic.topic}
                      </Text>
                      <Text
                        style={[
                          styles.arMeta,
                          {
                            color: isDark ? "#AAB7CF" : COLORS.textLight,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {topic.chapter}
                      </Text>
                      <View style={styles.arButtonMini}>
                        <Text style={styles.arButtonMiniText}>
                          {locked ? copy.lockedFeature : copy.openAr}
                        </Text>
                        <Ionicons
                          name={locked ? "lock-closed" : "arrow-forward"}
                          size={12}
                          color="white"
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })(),
              )}
            </View>
          )}
        </View>

        {!hasUsedFilters ? (
          <View
            style={[
              styles.tempPlaceholder,
              {
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
              },
            ]}
          >
            <Text
              style={[
                styles.tempPlaceholderText,
                { color: isDark ? "#BFD6FF" : "#35507E" },
              ]}
            >
              {copy.filterHint}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(activeCanvasUrl)}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveCanvasUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                paddingTop: insets.top + 8,
                backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                borderColor: isDark ? "#22324E" : "#E3ECF8",
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? "#F4F7FB" : "#102443" },
                ]}
              >
                {copy.canvasModel}
              </Text>
              <Pressable
                onPress={() => setActiveCanvasUrl(null)}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: isDark ? "#121C2E" : "#EEF4FD" },
                ]}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#F4F7FB" : "#1A202C"}
                />
              </Pressable>
            </View>
            {activeCanvasUrl ? (
              <WebView
                source={{ uri: activeCanvasUrl }}
                style={styles.modalWebView}
                originWhitelist={["*"]}
                startInLoadingState
                renderLoading={() => (
                  <View
                    style={[
                      styles.loaderWrap,
                      { backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF" },
                    ]}
                  >
                    <ActivityIndicator size="small" color="#0B5FFF" />
                    <Text
                      style={[
                        styles.loaderText,
                        { color: isDark ? "#AAB7CF" : "#35507E" },
                      ]}
                    >
                      {copy.openingCanvas}
                    </Text>
                  </View>
                )}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -50,
    left: -70,
    backgroundColor: "transparent",
  },
  bgGlowGold: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    bottom: 120,
    right: -90,
    backgroundColor: "transparent",
  },
  bgGlowSky: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: "42%",
    left: "34%",
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    gap: 14,
  },
  labTopBadgeCard: {
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
  labTopBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labTopBadgeText: {
    fontSize: 18,
    fontWeight: "800",
  },
  tempPlaceholder: {
    marginTop: "auto",
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  tempPlaceholderText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  heroRowWrap: {
    gap: 12,
  },
  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
  },
  heroBadgeText: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: "800",
    color: "#1A202C",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5A6C87",
    marginTop: 8,
  },
  heroMetaPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  heroMetaText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "700",
  },
  heroFeatureCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#0E234E",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  heroFeatureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroFeatureKicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroFeatureTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
    marginTop: 2,
    maxWidth: "88%",
  },
  heroFeatureOrb: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFeatureText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 8,
  },
  overviewStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    gap: 6,
  },
  overviewStatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  overviewStatLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  subjectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    padding: 16,
    shadowColor: "#0E234E",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 14,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  subjectHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  subjectTitle: {
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
  },
  subjectSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  subjectBadgeText: {
    color: "#35507E",
    fontSize: 11,
    fontWeight: "700",
  },
  dropdownTrigger: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownMenu: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -4,
  },
  dropdownItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modelBlock: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: -2,
  },
  chapterFilterRow: {
    gap: 8,
  },
  chapterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  chapterChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  chapterChipText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "700",
  },
  chapterChipTextActive: {
    color: "#FFFFFF",
  },
  modeToggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeToggleChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modeToggleChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modeToggleTextActive: {
    color: "#FFFFFF",
  },
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subscriptionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  freeNoticeCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  freeNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 13,
    color: "#5A6C87",
    lineHeight: 18,
  },
  canvasCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  lockedCard: {
    opacity: 0.86,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconBoxBlue: {
    backgroundColor: "#E7F0FF",
    borderColor: "#C8DCF9",
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  lockBadge: {
    borderRadius: 999,
    backgroundColor: "#35507E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  freeBadge: {
    backgroundColor: "#0B5FFF",
  },
  lockBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  category: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: HOME_ACCENT,
  },
  labTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 2,
  },
  chapterText: {
    fontSize: 12,
    color: "#35507E",
    fontWeight: "700",
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: "#5A6C87",
    lineHeight: 19,
  },
  arRow: {
    gap: 10,
  },
  arStack: {
    gap: 10,
  },
  arCardWide: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE7FA",
    padding: 14,
    shadowColor: "#0E234E",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  arCardWideTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  arIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F0FF",
  },
  arTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#1A202C",
  },
  arTitleWide: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#1A202C",
  },
  arMeta: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textLight,
  },
  arButtonMini: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#0B5FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  arButtonMiniText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 20, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    height: "88%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
  },
  modalHeader: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E3ECF8",
  },
  modalTitle: {
    color: "#102443",
    fontSize: 15,
    fontWeight: "800",
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FD",
  },
  modalWebView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  loaderText: {
    color: "#35507E",
    fontSize: 13,
    fontWeight: "600",
  },
});