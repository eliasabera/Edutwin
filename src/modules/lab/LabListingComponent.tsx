import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { COLORS } from "../../../shared/constants/colors";
import {
  fetchAllCanvasLabResources,
  type LabCanvasResource,
} from "../../../shared/services/ai-service";
import { getArTopics } from "../../../shared/services/ar-service";

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

const SUBJECT_TITLE: Record<SubjectKey, string> = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  math: "Math",
};

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
  const arTopics = getArTopics();
  const [canvasResources, setCanvasResources] = useState<LabItem[]>([]);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [activeCanvasUrl, setActiveCanvasUrl] = useState<string | null>(null);
  const [selectedChapterBySubject, setSelectedChapterBySubject] = useState<
    Record<SubjectKey, string>
  >({
    biology: "",
    chemistry: "",
    physics: "",
    math: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadCanvasResources = async () => {
      setIsLoadingCanvas(true);
      try {
        const fetched = await fetchAllCanvasLabResources();
        if (!isMounted) return;

        const mapped = fetched.map((item: LabCanvasResource) => {
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
        });

        setCanvasResources(mapped);
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
  }, []);

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

  const openSimulation = (url: string) => {
    setActiveCanvasUrl(url);
  };

  const openArModel = (modelId: string) => {
    router.push({
      pathname: "/ar-view/[modelId]",
      params: { modelId },
    });
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgGlowBlue} />
      <View pointerEvents="none" style={styles.bgGlowGold} />
      <View pointerEvents="none" style={styles.bgGlowSky} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 120 + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="flask-outline" size={14} color="#0B5FFF" />
            <Text style={styles.heroBadgeText}>Lab by Subject</Text>
          </View>

          <Text style={styles.title}>Virtual Lab</Text>
          <Text style={styles.subtitle}>
            Each subject has separate Canvas simulations and AR models.
          </Text>

          <View style={styles.heroMetaPill}>
            <Ionicons name="layers-outline" size={14} color="#0B5FFF" />
            <Text style={styles.heroMetaText}>
              {sections.length} subjects
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.subject} style={styles.subjectCard}>
            {(() => {
              const selectedChapterCandidate =
                selectedChapterBySubject[section.subject] ?? "";
              const selectedChapter = section.chapters.includes(
                selectedChapterCandidate,
              )
                ? selectedChapterCandidate
                : (section.chapters[0] ?? "");
              const filteredCanvas = selectedChapter
                ? section.canvasItems.filter(
                    (item) => item.chapter === selectedChapter,
                  )
                : section.canvasItems;
              const filteredAr = selectedChapter
                ? section.arItems.filter(
                    (item) => item.chapter === selectedChapter,
                  )
                : section.arItems;

              return (
                <>
                  <View style={styles.subjectHeader}>
                    <Text style={styles.subjectTitle}>
                      {SUBJECT_TITLE[section.subject]}
                    </Text>
                    <View style={styles.subjectBadge}>
                      <Text style={styles.subjectBadgeText}>
                        {filteredCanvas.length} Canvas • {filteredAr.length} AR
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    contentContainerStyle={styles.chapterFilterRow}
                  >
                    {section.chapters.map((chapter) => {
                      const active = selectedChapter === chapter;
                      return (
                        <TouchableOpacity
                          key={chapter}
                          style={[
                            styles.chapterChip,
                            active && styles.chapterChipActive,
                          ]}
                          onPress={() =>
                            setSelectedChapterBySubject((current) => ({
                              ...current,
                              [section.subject]: chapter,
                            }))
                          }
                          activeOpacity={0.9}
                        >
                          <Text
                            style={[
                              styles.chapterChipText,
                              active && styles.chapterChipTextActive,
                            ]}
                          >
                            {chapter}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.modelBlock}>
                    <Text style={styles.modelBlockTitle}>Canvas Models</Text>
                    {filteredCanvas.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {isLoadingCanvas ? "Loading canvas models..." : "No canvas models yet."}
                      </Text>
                    ) : (
                      filteredCanvas.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.canvasCard}
                          onPress={() => openSimulation(item.url)}
                          activeOpacity={0.9}
                        >
                          <View
                            style={[
                              styles.iconBox,
                              styles.iconBoxBlue,
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
                              <Text style={styles.category}>
                                CANVAS
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={COLORS.textLight}
                              />
                            </View>
                            <Text style={styles.labTitle}>{item.title}</Text>
                            <Text style={styles.chapterText}>
                              {item.chapter}
                            </Text>
                            <Text style={styles.desc}>{item.desc}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>

                  <View style={styles.modelBlock}>
                    <Text style={styles.modelBlockTitle}>AR Models</Text>
                    {filteredAr.length === 0 ? (
                      <Text style={styles.emptyText}>No AR models yet.</Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled
                        contentContainerStyle={styles.arRow}
                      >
                        {filteredAr.map((topic) => (
                          <TouchableOpacity
                            key={topic.id}
                            style={styles.arCard}
                            onPress={() => openArModel(topic.id)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.arIconWrap}>
                              <Ionicons
                                name="cube-outline"
                                size={20}
                                color="#0B5FFF"
                              />
                            </View>
                            <Text style={styles.arTitle} numberOfLines={1}>
                              {topic.topic}
                            </Text>
                            <Text style={styles.arMeta} numberOfLines={1}>
                              {topic.chapter}
                            </Text>
                            <View style={styles.arButtonMini}>
                              <Text style={styles.arButtonMiniText}>
                                Open AR
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={12}
                                color="white"
                              />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </>
              );
            })()}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={Boolean(activeCanvasUrl)}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveCanvasUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingTop: insets.top + 8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Canvas Model</Text>
              <Pressable
                onPress={() => setActiveCanvasUrl(null)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#1A202C" />
              </Pressable>
            </View>
            {activeCanvasUrl ? (
              <WebView
                source={{ uri: activeCanvasUrl }}
                style={styles.modalWebView}
                originWhitelist={["*"]}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loaderWrap}>
                    <ActivityIndicator size="small" color="#0B5FFF" />
                    <Text style={styles.loaderText}>Opening canvas model...</Text>
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
    paddingHorizontal: 18,
    gap: 14,
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
  subjectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    padding: 14,
    shadowColor: "#0E234E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 12,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  subjectTitle: {
    color: "#1A202C",
    fontSize: 20,
    fontWeight: "800",
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
  modelBlock: {
    gap: 10,
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
  modelBlockTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C5379",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
    marginBottom: 4,
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
  arCard: {
    width: 170,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE7FA",
    padding: 12,
    shadowColor: "#0E234E",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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
