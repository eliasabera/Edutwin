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
import TextbookReaderScreen from "./TextbookReaderScreen";

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
  const [selectedSubject, setSelectedSubject] = useState<Subject>(SUBJECTS[0]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  const unitsForSubject = useMemo(
    () => SUBJECT_UNITS[selectedSubject],
    [selectedSubject],
  );

  const [selectedUnit, setSelectedUnit] = useState(unitsForSubject[0].name);
  const [selectedTopic, setSelectedTopic] = useState(
    unitsForSubject[0].topics[0],
  );
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);

  const topicsForUnit = useMemo(() => {
    const unit = unitsForSubject.find((entry) => entry.name === selectedUnit);
    return unit?.topics ?? [];
  }, [selectedUnit, unitsForSubject]);

  const totalTopics = useMemo(
    () =>
      unitsForSubject.reduce((count, unit) => count + unit.topics.length, 0),
    [unitsForSubject],
  );

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    const nextUnits = SUBJECT_UNITS[subject];
    const nextUnit = nextUnits[0]?.name ?? "";
    const nextTopic = nextUnits[0]?.topics[0] ?? "";
    setSelectedUnit(nextUnit);
    setSelectedTopic(nextTopic);
    setSubjectDropdownOpen(false);
    setUnitDropdownOpen(false);
    setTopicDropdownOpen(false);
  };

  if (activeLesson) {
    return (
      <View style={styles.readerHost}>
        <TextbookReaderScreen />

        <View style={[styles.readerTopBar, { top: insets.top + 10 }]}>
          <Pressable
            style={styles.readerBackButton}
            onPress={() => setActiveLesson(null)}
          >
            <Ionicons name="chevron-back" size={18} color="#1A202C" />
            <Text style={styles.readerBackText}>Library</Text>
          </Pressable>

          <View style={styles.readerBookBadge}>
            <Text style={styles.readerBookBadgeText} numberOfLines={1}>
              {activeLesson.subject} • {activeLesson.unit} •{" "}
              {activeLesson.topic}
            </Text>
          </View>
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
            paddingBottom: 120 + Math.max(insets.bottom, 8),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="book-outline" size={14} color="#0B5FFF" />
            <Text style={styles.heroBadgeText}>Textbook Library</Text>
          </View>
          <Text style={styles.title}>Topic Reader</Text>

          <View style={styles.metaPill}>
            <Ionicons name="layers-outline" size={14} color="#0B5FFF" />
            <Text style={styles.metaText}>{totalTopics} topics</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.dropdownLabel}>Subject</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setSubjectDropdownOpen((prev) => !prev);
              setUnitDropdownOpen(false);
              setTopicDropdownOpen(false);
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.dropdownTriggerText}>{selectedSubject}</Text>
            <Ionicons
              name={subjectDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#35507E"
            />
          </TouchableOpacity>
          {subjectDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {SUBJECTS.map((subject) => {
                const active = subject === selectedSubject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.dropdownItem,
                      active && styles.dropdownItemActive,
                    ]}
                    onPress={() => handleSelectSubject(subject)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {subject}
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

          <Text style={styles.dropdownLabel}>Unit</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setUnitDropdownOpen((prev) => !prev);
              setSubjectDropdownOpen(false);
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
              setSubjectDropdownOpen(false);
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
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
  readerBookBadge: {
    flex: 1,
    alignItems: "flex-end",
  },
  readerBookBadgeText: {
    color: "#1A202C",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.22)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 250,
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
    gap: 12,
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
    fontSize: 24,
    fontWeight: "800",
    color: "#1A202C",
    marginTop: 12,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#5A6C87",
  },
  metaPill: {
    marginTop: 12,
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
  metaText: {
    color: "#35507E",
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCE7FA",
    gap: 10,
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
