import { useStudentProfile } from "@/shared/store/user-store";
import TextbookReaderScreen from "@/src/modules/textbook/TextbookReaderScreen";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
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
};

const SUBJECTS: Subject[] = ["Biology", "Chemistry", "Physics", "Math"];
const SUBJECT_ICONS: Record<Subject, keyof typeof Ionicons.glyphMap> = {
  Biology: "leaf-outline",
  Chemistry: "flask-outline",
  Physics: "flash-outline",
  Math: "calculator-outline",
};

const SUBJECT_BOOK_COVERS: Record<Subject, string> = {
  Biology: "https://picsum.photos/id/1040/420/620",
  Chemistry: "https://picsum.photos/id/1033/420/620",
  Physics: "https://picsum.photos/id/1076/420/620",
  Math: "https://picsum.photos/id/1062/420/620",
};

const DEFAULT_TEXTBOOK_URL =
  "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/3d-models/G9-Biology-STB-2023-web.pdf";

const SUBJECT_TEXTBOOK_URLS: Record<Subject, string> = {
  Biology: DEFAULT_TEXTBOOK_URL,
  Chemistry: DEFAULT_TEXTBOOK_URL,
  Physics:
    "https://vzqerbreduraaluicaxe.supabase.co/storage/v1/object/public/3d-models/G9-Physics-STB-2023-webUnit1.pdf",
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

export default function TextbookScreen() {
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);

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

        const priority = isSupport ? 0 : isStrong ? 2 : 1;

        return {
          subject,
          isSupport,
          isStrong,
          coverImage: SUBJECT_BOOK_COVERS[subject],
          priority,
        };
      });

      return cards.sort((a, b) => a.priority - b.priority);
    },
    [strongSet, supportSet],
  );

  const handleSelectSubject = (subject: Subject) => {
    setActiveLesson({
      subject,
      textbookUrl: SUBJECT_TEXTBOOK_URLS[subject],
    });
  };

  if (activeLesson) {
    return (
      <View style={styles.readerHost}>
        <TextbookReaderScreen lesson={activeLesson} />

        <View pointerEvents="box-none" style={[styles.readerTopBar, { top: insets.top + 10 }]}> 
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
            paddingBottom: 24 + Math.max(insets.bottom, 8),
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

                <View style={[styles.subjectImageFrame, { borderColor: accent }]}>
                  <Image
                    source={{ uri: entry.coverImage }}
                    style={styles.subjectImage}
                    resizeMode="cover"
                  />
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
  subjectImageFrame: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    backgroundColor: "#DDE8FF",
  },
  subjectImage: {
    width: "100%",
    height: "100%",
  },
});
