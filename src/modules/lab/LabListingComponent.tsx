import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../shared/constants/colors";
import { getArTopics } from "../../../shared/services/ar-service";

type SubjectKey = "biology" | "chemistry" | "physics" | "math";

type LabItem = {
  id: string;
  title: string;
  category: "Biology" | "Chemistry" | "Physics" | "Math";
  chapter: string;
  icon: string;
  color: string;
  desc: string;
};

const SUBJECT_ORDER: SubjectKey[] = ["biology", "chemistry", "physics", "math"];

const SUBJECT_TITLE: Record<SubjectKey, string> = {
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  math: "Math",
};

const LABS: LabItem[] = [
  {
    id: "boyles_law",
    title: "Boyle's Law",
    category: "Physics",
    chapter: "Physics Unit 1",
    icon: "flask-outline",
    color: "#FF5722",
    desc: "Explore the relationship between Pressure and Volume in a closed container.",
  },
  {
    id: "projectile_motion",
    title: "Projectile Motion",
    category: "Physics",
    chapter: "Physics Unit 2",
    icon: "basketball-outline",
    color: "#2196F3",
    desc: "Launch objects and study parabolic trajectories under gravity.",
  },
  {
    id: "mitosis",
    title: "Cell Division",
    category: "Biology",
    chapter: "Biology Unit 1",
    icon: "aperture-outline",
    color: "#4CAF50",
    desc: "Visualize the stages of Mitosis in 3D.",
  },
];

const toSubjectKey = (value: string): SubjectKey =>
  value.toLowerCase() as SubjectKey;

export default function LabListingComponent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const arTopics = getArTopics();
  const [selectedChapterBySubject, setSelectedChapterBySubject] = useState<
    Record<SubjectKey, string>
  >({
    biology: "All",
    chemistry: "All",
    physics: "All",
    math: "All",
  });

  const sections = useMemo(() => {
    return SUBJECT_ORDER.map((subject) => {
      const canvasItems = LABS.filter(
        (lab) => toSubjectKey(lab.category) === subject,
      );
      const arItems = arTopics.filter((topic) => topic.subject === subject);
      const chapters = [
        "All",
        ...Array.from(
          new Set([
            ...canvasItems.map((item) => item.chapter),
            ...arItems.map((item) => item.chapter),
          ]),
        ),
      ];

      return {
        subject,
        canvasItems,
        arItems,
        chapters,
      };
    }).filter(
      (section) => section.canvasItems.length > 0 || section.arItems.length > 0,
    );
  }, [arTopics]);

  const openSimulation = (simId: string) => {
    router.push(`/simulation/${simId}`);
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
              {sections.length} subjects ready
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.subject} style={styles.subjectCard}>
            {(() => {
              const selectedChapter =
                selectedChapterBySubject[section.subject] ?? "All";
              const filteredCanvas =
                selectedChapter === "All"
                  ? section.canvasItems
                  : section.canvasItems.filter(
                      (item) => item.chapter === selectedChapter,
                    );
              const filteredAr =
                selectedChapter === "All"
                  ? section.arItems
                  : section.arItems.filter(
                      (item) => item.chapter === selectedChapter,
                    );

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
                        No canvas models yet.
                      </Text>
                    ) : (
                      filteredCanvas.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.canvasCard}
                          onPress={() => openSimulation(item.id)}
                          activeOpacity={0.9}
                        >
                          <View
                            style={[
                              styles.iconBox,
                              {
                                backgroundColor: `${item.color}18`,
                                borderColor: `${item.color}40`,
                              },
                            ]}
                          >
                            <Ionicons
                              name={item.icon as any}
                              size={28}
                              color={item.color}
                            />
                          </View>

                          <View style={styles.info}>
                            <View style={styles.topRow}>
                              <Text
                                style={[styles.category, { color: item.color }]}
                              >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    overflow: "hidden",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -50,
    left: -70,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
  },
  bgGlowGold: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    bottom: 120,
    right: -90,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
  },
  bgGlowSky: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    top: "42%",
    left: "34%",
    backgroundColor: "rgba(30, 144, 255, 0.08)",
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
});
