import { useStudentProfile } from "@/shared/store/user-store";
import TextbookReaderScreen from "@/src/modules/textbook/TextbookReaderScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  unit: string;
  topic: string;
};

const SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "Math"];
const SUBJECT_ICONS: Record<Subject, keyof typeof Ionicons.glyphMap> = {
  Biology: "leaf-outline",
  Chemistry: "flask-outline",
  Physics: "flash-outline",
  Math: "calculator-outline",
};

const SUBJECT_OFFSETS: Record<Subject, number> = {
  Biology: -4,
  Chemistry: 2,
  Physics: 0,
  Math: 4,
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

export default function TextbookScreen() {
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  const unitsForSubject = useMemo(
    () => (selectedSubject ? SUBJECT_UNITS[selectedSubject] : []),
    [selectedSubject],
  );

  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);

  const topicsForUnit = useMemo(() => {
    const unit = unitsForSubject.find((entry) => entry.name === selectedUnit);
    return unit?.topics ?? [];
  }, [selectedUnit, unitsForSubject]);

  const totalTopics = useMemo(
    () =>
      Object.values(SUBJECT_UNITS).reduce(
        (count, units) =>
          count + units.reduce((unitCount, unit) => unitCount + unit.topics.length, 0),
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

  const subjectCards = useMemo(
    () => {
      const cards = SUBJECTS.map((subject) => {
        const key = subject.toLowerCase() as "biology" | "chemistry" | "physics" | "math";
        const isSupport = supportSet.has(key);
        const isStrong = strongSet.has(key);

        const base = Math.max(28, Math.min(88, studentProfile.masteryScore));
        const supportDelta = isSupport ? -22 : 0;
        const strongDelta = isStrong ? 12 : 0;
        const progress = Math.max(
          24,
          Math.min(95, base + SUBJECT_OFFSETS[subject] + supportDelta + strongDelta),
        );

        const priority = isSupport ? 0 : isStrong ? 2 : 1;

        return {
          subject,
          isSupport,
          isStrong,
          progress,
          priority,
          statusLabel: isSupport
            ? "Support Needed"
            : isStrong
              ? "Strong Subject"
              : "On Track",
        };
      });

      return cards.sort((a, b) => a.priority - b.priority);
    },
    [strongSet, studentProfile.masteryScore, supportSet],
  );

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    const nextUnits = SUBJECT_UNITS[subject];
    const nextUnit = nextUnits[0]?.name ?? "";
    const nextTopic = nextUnits[0]?.topics[0] ?? "";
    setSelectedUnit(nextUnit);
    setSelectedTopic(nextTopic);
    setUnitDropdownOpen(false);
    setTopicDropdownOpen(false);
  };

  if (activeLesson) {
    return (
      <View style={styles.readerHost}>
        <TextbookReaderScreen lesson={activeLesson} />

        <View style={[styles.readerTopBar, { top: insets.top + 10 }]}>
          <Pressable
            style={styles.readerBackButton}
            onPress={() => setActiveLesson(null)}
          >
            <Ionicons name="chevron-back" size={18} color="#1A202C" />
            <Text style={styles.readerBackText}>Library</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowBlue} />
      <View style={styles.bgGlowGold} />
      <View style={styles.bgGlowSky} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom:
              (selectedSubject ? 120 : 24) + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="book-outline" size={14} color="#0B5FFF" />
            <Text style={styles.heroBadgeText}>Textbook Library</Text>
          </View>
        </View>

        {!selectedSubject ? (
          <View style={styles.subjectGridOnly}>
            {subjectCards.map((entry) => {
              const accent = entry.isSupport
                ? "#FF9600"
                : entry.isStrong
                  ? "#17A34A"
                  : "#0B5FFF";

              return (
                <Pressable
                  key={entry.subject}
                  style={({ pressed }) => [
                    styles.subjectCard,
                    entry.isSupport && styles.subjectCardSupport,
                    pressed && styles.subjectCardPressed,
                  ]}
                  onPress={() => handleSelectSubject(entry.subject)}
                >
                  <View style={styles.subjectCardTopRow}>
                    <View style={styles.subjectTitleWrap}>
                      <View style={styles.subjectIconWrap}>
                        <Ionicons
                          name={SUBJECT_ICONS[entry.subject]}
                          size={15}
                          color="#0B5FFF"
                        />
                      </View>
                      <Text style={styles.subjectCardTitle}>
                        {entry.subject === "Math" ? "Mathematics" : entry.subject}
                      </Text>
                    </View>
                    {entry.isSupport || entry.isStrong ? (
                      <View
                        style={[
                          styles.statusChip,
                          entry.isSupport
                            ? styles.statusChipSupport
                            : styles.statusChipStrong,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            entry.isSupport
                              ? styles.statusChipTextSupport
                              : styles.statusChipTextStrong,
                          ]}
                        >
                          {entry.isSupport ? "Support" : "Strong"}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.subjectCardStatus}>{entry.statusLabel}</Text>

                  <View style={styles.subjectProgressWrap}>
                    <View style={styles.subjectProgressTrack} />
                    <View
                      style={[
                        styles.subjectProgressArc,
                        {
                          borderTopColor: accent,
                          borderRightColor: accent,
                          transform: [
                            {
                              rotate: `${Math.max(8, Math.round((entry.progress / 100) * 360))}deg`,
                            },
                          ],
                        },
                      ]}
                    />
                    <Text style={styles.subjectProgressValue}>{entry.progress}%</Text>
                  </View>
                  <Text style={styles.progressLabel}>Tap to continue</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.pathCard}>
            <View style={styles.pathCardTopRow}>
              <View>
                <Text style={styles.formTitle}>{selectedSubject} Learning Path</Text>
                <Text style={styles.formHint}>
                  Select a unit and topic to continue.
                </Text>
              </View>
              <Pressable
                style={styles.changeSubjectBtn}
                onPress={() => {
                  setSelectedSubject(null);
                  setUnitDropdownOpen(false);
                  setTopicDropdownOpen(false);
                }}
              >
                <Ionicons name="swap-horizontal" size={14} color="#0B5FFF" />
                <Text style={styles.changeSubjectText}>Subjects</Text>
              </Pressable>
            </View>

            <View style={styles.pathTag}>
              <Ionicons name="bookmarks-outline" size={13} color="#0B5FFF" />
              <Text style={styles.pathTagText}>Step 2 of 2</Text>
            </View>

            <Text style={styles.dropdownLabel}>Unit</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setUnitDropdownOpen((prev) => !prev);
                setTopicDropdownOpen(false);
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.dropdownTriggerText}>{selectedUnit}</Text>
              <Ionicons
                name={unitDropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#35507E"
              />
            </TouchableOpacity>
            {unitDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {unitsForSubject.map((unit) => {
                  const active = unit.name === selectedUnit;
                  return (
                    <TouchableOpacity
                      key={unit.name}
                      style={[
                        styles.dropdownItem,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedUnit(unit.name);
                        setSelectedTopic(unit.topics[0] ?? "");
                        setUnitDropdownOpen(false);
                        setTopicDropdownOpen(false);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          active && styles.dropdownItemTextActive,
                        ]}
                      >
                        {unit.name}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#0B5FFF"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.dropdownLabel}>Topic</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setTopicDropdownOpen((prev) => !prev);
                setUnitDropdownOpen(false);
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.dropdownTriggerText}>{selectedTopic}</Text>
              <Ionicons
                name={topicDropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#35507E"
              />
            </TouchableOpacity>
            {topicDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {topicsForUnit.map((topic) => {
                  const active = topic === selectedTopic;
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[
                        styles.dropdownItem,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedTopic(topic);
                        setTopicDropdownOpen(false);
                      }}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          active && styles.dropdownItemTextActive,
                        ]}
                      >
                        {topic}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#0B5FFF"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.openButton,
                pressed && styles.openButtonPressed,
              ]}
              onPress={() =>
                setActiveLesson({
                  subject: selectedSubject,
                  unit: selectedUnit,
                  topic: selectedTopic,
                })
              }
            >
              <Text style={styles.openButtonText}>Open Topic</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
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
    zIndex: 40,
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
    backgroundColor: "#F4F7FC",
  },
  bgGlowBlue: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    top: -70,
    left: -90,
    backgroundColor: "rgba(11, 95, 255, 0.16)",
  },
  bgGlowGold: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: 170,
    right: -70,
    backgroundColor: "rgba(255, 150, 0, 0.14)",
  },
  bgGlowSky: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    top: "45%",
    left: "36%",
    backgroundColor: "rgba(30, 144, 255, 0.08)",
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  heroBadgeText: {
    color: "#1A202C",
    fontSize: 24,
    fontWeight: "900",
  },
  subjectGridOnly: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "94%",
    marginTop: 22,
  },
  subjectCard: {
    width: "48%",
    minHeight: 208,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "rgba(245, 248, 255, 0.96)",
    padding: 16,
    gap: 12,
    shadowColor: "#0E234E",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  subjectCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  subjectCardSupport: {
    borderColor: "rgba(255, 150, 0, 0.42)",
    backgroundColor: "rgba(255, 150, 0, 0.08)",
  },
  subjectCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  subjectTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  subjectIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.26)",
    backgroundColor: "rgba(11, 95, 255, 0.08)",
  },
  subjectCardTitle: {
    color: "#1A202C",
    fontWeight: "800",
    fontSize: 15,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusChipSupport: {
    backgroundColor: "rgba(255, 150, 0, 0.12)",
    borderColor: "rgba(255, 150, 0, 0.32)",
  },
  statusChipStrong: {
    backgroundColor: "rgba(23, 163, 74, 0.1)",
    borderColor: "rgba(23, 163, 74, 0.3)",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusChipTextSupport: {
    color: "#B96A00",
  },
  statusChipTextStrong: {
    color: "#14833B",
  },
  subjectCardStatus: {
    color: "#5A6C87",
    fontSize: 12,
    fontWeight: "700",
    minHeight: 16,
  },
  subjectProgressWrap: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  subjectProgressTrack: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#D8E6FF",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  subjectProgressArc: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "transparent",
  },
  subjectProgressValue: {
    color: "#1A202C",
    fontSize: 13,
    fontWeight: "800",
  },
  progressLabel: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "700",
  },
  pathCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(11, 95, 255, 0.26)",
    gap: 10,
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pathCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  changeSubjectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.28)",
    backgroundColor: "rgba(11, 95, 255, 0.08)",
  },
  changeSubjectText: {
    color: "#0B5FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  pathTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EAF1FF",
    borderWidth: 1,
    borderColor: "#CFE0FF",
  },
  pathTagText: {
    color: "#2F4E87",
    fontSize: 11,
    fontWeight: "700",
  },
  formTitle: {
    color: "#1A202C",
    fontWeight: "800",
    fontSize: 15,
  },
  formHint: {
    color: "#5A6C87",
    fontSize: 12,
    marginTop: -2,
  },
  dropdownLabel: {
    marginTop: 2,
    color: "#35507E",
    fontWeight: "700",
    fontSize: 12,
  },
  dropdownTrigger: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#F5F8FF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dropdownTriggerText: {
    flex: 1,
    color: "#2E4A86",
    fontWeight: "700",
  },
  dropdownMenu: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "rgba(255,255,255,0.96)",
    overflow: "hidden",
  },
  dropdownItem: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ECF2FF",
  },
  dropdownItemActive: {
    backgroundColor: "#EEF4FF",
  },
  dropdownItemText: {
    color: "#35507E",
    fontWeight: "700",
  },
  dropdownItemTextActive: {
    color: "#0B5FFF",
  },
  openButton: {
    marginTop: 4,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#0B5FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  openButtonPressed: {
    opacity: 0.92,
  },
  openButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
