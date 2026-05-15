import {
  fetchResolvedTextbook,
  type ResolvedTextbookData,
} from "@/shared/services/textbook-service";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";
import { setHideSidebar, setHideTabBar } from "@/shared/store/ui-store";
import {
  fetchStudentProfile,
  mapBackendProfileToStudentProfile,
  setCachedStudentProfile,
} from "@/shared/services/auth-service";
import { updateStudentProfile, useStudentProfile } from "@/shared/store/user-store";
import { useTranslation } from "@/shared/i18n";
import TextbookReaderScreen from "@/src/modules/textbook/TextbookReaderScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Subject = "Biology" | "Chemistry" | "Physics" | "Math";

type Unit = {
  name: string;
  topics: string[];
};

type ActiveLesson = {
  subject: Subject;
  textbookUrl: string;
  grade: string;
};

const SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "Math"];
const SUBJECT_ICONS: Record<Subject, keyof typeof Ionicons.glyphMap> = {
  Biology: "leaf-outline",
  Chemistry: "flask-outline",
  Physics: "flash-outline",
  Math: "calculator-outline",
};

const DEFAULT_TEXTBOOK_URL = "";

const SUBJECT_TEXTBOOK_URLS: Record<Subject, string> = {
  Biology: DEFAULT_TEXTBOOK_URL,
  Chemistry: DEFAULT_TEXTBOOK_URL,
  Physics: DEFAULT_TEXTBOOK_URL,
  Math: DEFAULT_TEXTBOOK_URL,
};

const SUBJECT_UNITS: Record<Subject, Unit[]> = {
  Biology: [
    {
      name: "Cell Biology",
      topics: ["Cell Structure", "Cell Division", "Transport Across Membrane"],
    },
    {
      name: "Genetics",
      topics: ["DNA and RNA", "Mendelian Inheritance", "Variation"],
    },
    {
      name: "Ecology",
      topics: ["Ecosystems", "Food Webs", "Population Dynamics"],
    },
  ],
  Chemistry: [
    {
      name: "Atomic Structure",
      topics: [
        "Subatomic Particles",
        "Electron Configuration",
        "Periodic Trends",
      ],
    },
    {
      name: "Chemical Bonding",
      topics: ["Ionic Bonding", "Covalent Bonding", "Molecular Shape"],
    },
    {
      name: "Acids and Bases",
      topics: ["pH Scale", "Neutralization", "Indicators"],
    },
  ],
  Physics: [
    { name: "Mechanics", topics: ["Motion", "Forces", "Energy"] },
    {
      name: "Waves",
      topics: ["Sound Waves", "Light Waves", "Wave Properties"],
    },
    {
      name: "Electricity",
      topics: ["Current and Voltage", "Resistance", "Circuits"],
    },
  ],
  Math: [
    {
      name: "Algebra",
      topics: ["Linear Equations", "Quadratic Functions", "Polynomials"],
    },
    {
      name: "Geometry",
      topics: ["Triangles", "Circles", "Coordinate Geometry"],
    },
    {
      name: "Statistics",
      topics: ["Data Representation", "Mean and Median", "Probability Basics"],
    },
  ],
};

const COVER_BY_GRADE_SUBJECT: Record<string, string> = {
  "9-biology": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Biology.png",
  "9-chemistry": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Chemistry.png",
  "9-math": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Maths.png",
  "9-physics": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G9%20Physics.png",
  "10-biology": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Biology.png",
  "10-chemistry": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Chemistry.png",
  "10-math": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Maths.png",
  "10-physics": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G10%20Physics.png",
  "11-biology": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Biology.png",
  "11-chemistry": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Chemistry.png",
  "11-math": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Maths.png",
  "11-physics": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G11%20Physics.png",
  "12-biology": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Biology.png",
  "12-chemistry": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Chemistry.png",
  "12-math": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Maths.png",
  "12-physics": "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/book_cover_page/G12%20Physics.png",
};

const subjectKeyForCover = (subject: Subject): "biology" | "chemistry" | "physics" | "math" => {
  if (subject === "Biology") return "biology";
  if (subject === "Chemistry") return "chemistry";
  if (subject === "Physics") return "physics";
  return "math";
};

export default function TextbookScreen() {
  const insets = useSafeAreaInsets();
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";
  const studentProfile = useStudentProfile();
  const { language } = useTranslation();
  const isOm = language === "om";
  const copy = {
    library: isOm ? "Kuusaa" : "Library",
    textbookLibrary: isOm ? "Kuusaa Kitaabaa" : "Textbook Library",
    biology: isOm ? "Baayoloojii" : "Biology",
    chemistry: isOm ? "Keemistirii" : "Chemistry",
    physics: isOm ? "Fiiziksii" : "Physics",
    mathematics: isOm ? "Herrega" : "Mathematics",
    support: isOm ? "Deeggarsa" : "Support",
    strong: isOm ? "Cimaa" : "Strong",
  };
  const subjectLabel = (subject: Subject) => {
    if (subject === "Biology") return copy.biology;
    if (subject === "Chemistry") return copy.chemistry;
    if (subject === "Physics") return copy.physics;
    return copy.mathematics;
  };
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);
  const [resolvedTextbooks, setResolvedTextbooks] = useState<
    Partial<Record<Subject, ResolvedTextbookData | null>>
  >({});

  useEffect(() => {
    setHideTabBar(Boolean(activeLesson));
    setHideSidebar(Boolean(activeLesson));

    return () => {
      setHideTabBar(false);
      setHideSidebar(false);
    };
  }, [activeLesson]);

  useEffect(() => {
    let isMounted = true;

    const refreshProfile = async () => {
      try {
        const backendProfile = await fetchStudentProfile({ forceRefresh: true });
        if (!isMounted) return;
        setCachedStudentProfile(backendProfile);
        updateStudentProfile(mapBackendProfileToStudentProfile(backendProfile));
      } catch {
        // Ignore fetch errors; the screen can still render with cached/default data.
      }
    };

    void refreshProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalTopics = useMemo(
    () =>
      Object.values(SUBJECT_UNITS).reduce(
        (count, units) =>
          count +
          units.reduce((unitCount, unit) => unitCount + unit.topics.length, 0),
        0,
      ),
    [],
  );

  const supportSet = useMemo(
    () => new Set(studentProfile.supportSubjects),
    [studentProfile.supportSubjects],
  );
  const strongSet = useMemo(
    () => new Set(studentProfile.strongSubjects),
    [studentProfile.strongSubjects],
  );

  const focusSubject: Subject = useMemo(() => {
    const firstSupport = studentProfile.supportSubjects[0];
    if (firstSupport === "biology") return "Biology";
    if (firstSupport === "chemistry") return "Chemistry";
    if (firstSupport === "physics") return "Physics";
    if (firstSupport === "math") return "Math";
    return "Biology";
  }, [studentProfile.supportSubjects]);

  const currentGrade = useMemo(() => {
    const value = String(studentProfile.grade || "9").trim();
    return /^\d+$/.test(value) ? value : "9";
  }, [studentProfile.grade]);

  const subjectCards = useMemo(() => {
    const cards = SUBJECTS.map((subject) => {
      const key = subject.toLowerCase() as
        | "biology"
        | "chemistry"
        | "physics"
        | "math";
      const isSupport = supportSet.has(key);
      const isStrong = strongSet.has(key);

      const priority = isSupport ? 0 : isStrong ? 2 : 1;

      return {
        subject,
        isSupport,
        isStrong,
        priority,
      };
    });

    return cards.sort((a, b) => a.priority - b.priority);
  }, [strongSet, supportSet]);

  useEffect(() => {
    let isMounted = true;
    const currentGrade = String(studentProfile.grade || "9").trim() || "9";

    const fetchByGrade = async () => {
      const mapping: Record<
        Subject,
        "biology" | "chemistry" | "physics" | "math"
      > = {
        Biology: "biology",
        Chemistry: "chemistry",
        Physics: "physics",
        Math: "math",
      };

      const entries = await Promise.all(
        SUBJECTS.map(async (subject) => {
          const resolved = await fetchResolvedTextbook(
            mapping[subject],
            currentGrade,
          );
          return [subject, resolved] as const;
        }),
      );

      if (!isMounted) return;

      setResolvedTextbooks(
        entries.reduce(
          (acc, [subject, resolved]) => {
            acc[subject] = resolved || null;
            return acc;
          },
          {} as Partial<Record<Subject, ResolvedTextbookData | null>>,
        ),
      );
    };

    void fetchByGrade();

    return () => {
      isMounted = false;
    };
  }, [studentProfile.grade]);

  const handleSelectSubject = async (subject: Subject) => {
    const resolved = Object.prototype.hasOwnProperty.call(
      resolvedTextbooks,
      subject,
    )
      ? resolvedTextbooks[subject] || null
      : null;

    let resolvedUrl =
      resolved?.textbook_url || SUBJECT_TEXTBOOK_URLS[subject];
    let resolvedGrade =
      String(resolved?.grade_served || studentProfile.grade || "9").trim() ||
      "9";

    if (!resolvedUrl) {
      const mapping: Record<Subject, "biology" | "chemistry" | "physics" | "math"> = {
        Biology: "biology",
        Chemistry: "chemistry",
        Physics: "physics",
        Math: "math",
      };
      const fetched = await fetchResolvedTextbook(
        mapping[subject],
        resolvedGrade,
      );
      if (fetched?.textbook_url) {
        resolvedUrl = fetched.textbook_url;
        resolvedGrade = String(fetched.grade_served || resolvedGrade).trim() || resolvedGrade;
      }
    }

    setActiveLesson({
      subject,
      textbookUrl: resolvedUrl,
      grade: resolvedGrade,
    });
  };

  if (activeLesson) {
    return (
      <View
        style={[
          styles.readerHost,
          { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
        ]}
      >
        <TextbookReaderScreen lesson={activeLesson} />

        <View
          pointerEvents="box-none"
          style={[styles.readerTopBar, { top: insets.top + 10 }]}
        >
          <Pressable
            style={[
              styles.readerBackButton,
              {
                backgroundColor: isDark
                  ? "rgba(14,26,44,0.96)"
                  : "rgba(255,255,255,0.94)",
                borderColor: isDark
                  ? "rgba(123,167,255,0.28)"
                  : "rgba(11, 95, 255, 0.22)",
              },
            ]}
            onPress={() => setActiveLesson(null)}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={isDark ? "#EAF1FF" : "#1A202C"}
            />
            <Text
              style={[
                styles.readerBackText,
                { color: isDark ? "#EAF1FF" : "#1A202C" },
              ]}
            >
              {copy.library}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
    >
      <View style={styles.bgGlowBlue} />
      <View style={styles.bgGlowGold} />
      <View style={styles.bgGlowSky} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: 24 + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
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
            <Ionicons name="book-outline" size={15} color="#0B5FFF" />
            <Text
              style={[
                styles.homeBadgeText,
                { color: isDark ? "#F4F7FB" : "#1A202C" },
              ]}
            >
              {copy.textbookLibrary}
            </Text>
          </View>
        </View>

        <View style={styles.subjectGridOnly}>
          {subjectCards.map((entry) => {
            const accent = isDark ? "#7BA7FF" : "#0B5FFF";
            const resolved = resolvedTextbooks[entry.subject] || null;
            const fallbackCoverUrl =
              COVER_BY_GRADE_SUBJECT[
                `${currentGrade}-${subjectKeyForCover(entry.subject)}`
              ] || "";
            const coverUrl =
              typeof resolved?.cover_image_url === "string"
                ? resolved.cover_image_url.trim() || fallbackCoverUrl
                : fallbackCoverUrl;

            return (
              <Pressable
                key={entry.subject}
                style={({ pressed }) => [
                  styles.subjectTileStack,
                  pressed && styles.subjectCardPressed,
                ]}
                onPress={() => handleSelectSubject(entry.subject)}
              >
                <View
                  style={[
                    styles.subjectImageCard,
                    {
                      backgroundColor: isDark ? "#17253A" : "#EDF3FF",
                      borderColor: "rgba(11, 95, 255, 0.10)",
                    },
                  ]}
                >
                  {coverUrl ? (
                    <Image
                      source={{ uri: coverUrl }}
                      style={styles.subjectCoverImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.subjectIconBadge,
                        {
                          borderColor: accent,
                          backgroundColor: isDark ? "#0B1424" : "#FFFFFF",
                        },
                      ]}
                    >
                      <Ionicons name="book" size={34} color={accent} />
                      <Ionicons
                        name={SUBJECT_ICONS[entry.subject]}
                        size={16}
                        color={accent}
                        style={styles.subjectIconBadgeOverlay}
                      />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.subjectInfoCard,
                    {
                      borderColor: isDark ? "#22324E" : "#D6E4FF",
                      backgroundColor: isDark
                        ? "#0E1A2C"
                        : "rgba(245, 248, 255, 0.96)",
                    },
                  ]}
                >
                  <View style={styles.subjectInfoTopRow}>
                    <Text
                      style={[
                        styles.subjectCardTitle,
                        { color: isDark ? "#F4F7FB" : "#1A202C" },
                      ]}
                      numberOfLines={1}
                    >
                      {subjectLabel(entry.subject)}
                    </Text>
                    {entry.isSupport || entry.isStrong ? (
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: isDark
                              ? "rgba(123, 167, 255, 0.14)"
                              : "rgba(11, 95, 255, 0.08)",
                            borderColor: isDark
                              ? "rgba(123, 167, 255, 0.42)"
                              : "rgba(11, 95, 255, 0.24)",
                          },
                        ]}
                      >
                        <Text style={[styles.statusChipText, { color: accent }]}>
                          {entry.isSupport ? copy.support : copy.strong}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  readerHost: {
    flex: 1,
  },
  readerTopBar: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 120,
    elevation: 120,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  readerBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  readerBackText: {
    color: "#1A202C",
    fontSize: 12,
    fontWeight: "700",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    top: -70,
    left: -90,
    backgroundColor: "transparent",
  },
  bgGlowGold: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: 170,
    right: -70,
    backgroundColor: "transparent",
  },
  bgGlowSky: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    top: "45%",
    left: "36%",
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
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
  subjectGridOnly: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
    marginTop: 30,
  },
  subjectTileStack: {
    width: "49%",
    backgroundColor: "transparent",
    gap: 16,
    marginBottom: 18,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  subjectCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  subjectCardTitle: {
    fontWeight: "800",
    fontSize: 13,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    backgroundColor: "rgba(11, 95, 255, 0.08)",
    borderColor: "rgba(11, 95, 255, 0.24)",
  },
  statusChipText: {
    color: "#0B5FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  subjectImageCard: {
    width: "100%",
    height: 190,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  subjectCoverImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  subjectIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  subjectIconBadgeOverlay: {
    position: "absolute",
    right: 7,
    bottom: 8,
  },
  subjectInfoCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minHeight: 54,
  },
  subjectInfoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
});
