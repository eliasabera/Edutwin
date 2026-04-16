import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../../shared/constants/colors";
import { recordAssessmentCompletion } from "../../../shared/services/gamification";
import { updateStudentProfile, useStudentProfile } from "../../../shared/store/user-store";
import type {
  PerformanceBand,
  SubjectName,
} from "../../../shared/types/domain.types";

// ==========================================
// 1. MOCK DATA (Configuration & Questions)
// ==========================================

const GRADES = ["9"];

const LANGUAGES = [
  { id: "en", label: "English", icon: "🇬🇧" },
  { id: "om", label: "Afaan Oromoo", icon: "🇪🇹" },
];

// Diagnostic Questions (Grade 8 Level for incoming Grade 9s)
const QUESTIONS = [
  {
    id: 1,
    subject: "Biology",
    text: 'Which organelle is known as the "powerhouse" of the cell?',
    options: ["Nucleus", "Mitochondria", "Ribosome", "Cell Wall"],
    correctIndex: 1,
  },
  {
    id: 2,
    subject: "Physics",
    text: "What is the formula for calculating Speed?",
    options: [
      "Distance × Time",
      "Distance ÷ Time",
      "Time ÷ Distance",
      "Mass × Acceleration",
    ],
    correctIndex: 1,
  },
  {
    id: 3,
    subject: "Chemistry",
    text: "What is the chemical symbol for Water?",
    options: ["H2O", "CO2", "O2", "NaCl"],
    correctIndex: 0,
  },
  {
    id: 4,
    subject: "Math",
    text: "Solve for x: 3x + 5 = 20",
    options: ["3", "4", "5", "6"],
    correctIndex: 2,
  },
  {
    id: 5,
    subject: "Physics",
    text: "Which force pulls objects towards the center of the Earth?",
    options: ["Friction", "Magnetism", "Gravity", "Tension"],
    correctIndex: 2,
  },
];

type QuestionRecord = {
  subject: SubjectName;
  isCorrect: boolean;
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function StudentSetupComponent() {
  const router = useRouter();
  const studentProfile = useStudentProfile();

  const initialGrade = (() => {
    const profileGrade = String(studentProfile.grade || "9").trim();
    return profileGrade || "9";
  })();

  const initialLanguage =
    studentProfile.preferredLanguage === "om" || studentProfile.preferredLanguage === "en"
      ? studentProfile.preferredLanguage
      : null;

  const shouldSkipSetup = Boolean(initialGrade && initialLanguage);

  // --- STATE MANAGEMENT ---
  // Step: 'setup' -> 'quiz' -> 'result'
  const [currentStep, setCurrentStep] = useState<"setup" | "quiz" | "result">(
    shouldSkipSetup ? "quiz" : "setup",
  );

  // Setup State
  const [grade, setGrade] = useState<string | null>(initialGrade || "9");
  const [lang, setLang] = useState<string | null>(initialLanguage);

  // Quiz State
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionRecords, setQuestionRecords] = useState<QuestionRecord[]>([]);

  // --- ACTIONS ---

  // 1. Finish Setup -> Start Quiz
  const startQuiz = () => {
    if (grade && lang) {
      setCurrentStep("quiz");
    }
  };

  // 2. Handle Quiz Answer
  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === QUESTIONS[qIndex].correctIndex;
    setQuestionRecords((prev) => [
      ...prev,
      {
        subject: QUESTIONS[qIndex].subject.toLowerCase() as SubjectName,
        isCorrect,
      },
    ]);

    // Check correctness
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Move to next or finish
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex((prev) => prev + 1);
      setSelectedOption(null); // Reset selection
    } else {
      setCurrentStep("result");
    }
  };

  // 3. Finish Everything -> Go to Home
  const goToHome = () => {
    const percentage = Math.round((score / QUESTIONS.length) * 100);
    const performanceBand: PerformanceBand =
      percentage >= 80 ? "top" : percentage >= 50 ? "medium" : "support";

    const bySubject = questionRecords.reduce<Record<SubjectName, number[]>>(
      (accumulator, item) => {
        accumulator[item.subject] = accumulator[item.subject] || [];
        accumulator[item.subject].push(item.isCorrect ? 1 : 0);
        return accumulator;
      },
      {
        biology: [],
        chemistry: [],
        physics: [],
        math: [],
      },
    );

    const supportSubjects = Object.entries(bySubject)
      .filter(([, values]) => values.length > 0)
      .filter(
        ([, values]) =>
          values.reduce((sum, value) => sum + value, 0) / values.length < 0.5,
      )
      .map(([subject]) => subject) as SubjectName[];

    const strongSubjects = Object.entries(bySubject)
      .filter(([, values]) => values.length > 0)
      .filter(
        ([, values]) =>
          values.reduce((sum, value) => sum + value, 0) / values.length >= 0.75,
      )
      .map(([subject]) => subject) as SubjectName[];

    updateStudentProfile({
      grade: grade || initialGrade || "9",
      preferredLanguage: (lang || "en") as "en" | "om",
      masteryScore: percentage,
      performanceBand,
      supportSubjects,
      strongSubjects,
      diagnosticCompleted: true,
      twinName: `EduTwin Grade ${grade || initialGrade || "9"}`,
    });

    Object.entries(bySubject).forEach(([subject, values]) => {
      if (!values.length) return;

      const correctCount = values.reduce((sum, value) => sum + value, 0);
      recordAssessmentCompletion(
        subject as SubjectName,
        correctCount,
        values.length,
      );
    });

    router.replace("/home" as never);
  };

  // ==========================================
  // 3. RENDERERS (Sub-components)
  // ==========================================

  // --- RENDER: SETUP SCREEN ---
  if (currentStep === "setup") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="construct" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Build Your Profile</Text>
          <Text style={styles.subtitle}>
            Let's customize your EduTwin experience.
          </Text>
        </View>

        {/* Grade Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Grade Level</Text>
          <View style={styles.grid}>
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.card, grade === g && styles.cardSelected]}
                onPress={() => setGrade(g)}
              >
                <Text
                  style={[
                    styles.cardText,
                    grade === g && styles.cardTextSelected,
                  ]}
                >
                  Grade {g}
                </Text>
                {grade === g && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.secondary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Language</Text>
          <View style={styles.row}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.langCard, lang === l.id && styles.cardSelected]}
                onPress={() => setLang(l.id)}
              >
                <Text style={{ fontSize: 30 }}>{l.icon}</Text>
                <Text
                  style={[
                    styles.cardText,
                    lang === l.id && styles.cardTextSelected,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btnPrimary, (!grade || !lang) && styles.btnDisabled]}
            onPress={startQuiz}
            disabled={!grade || !lang}
          >
            <Text style={styles.btnText}>Continue to Evaluation</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- RENDER: QUIZ SCREEN ---
  if (currentStep === "quiz") {
    const currentQ = QUESTIONS[qIndex];
    const progress = (qIndex + 1) / QUESTIONS.length;

    return (
      <View style={[styles.container, { paddingTop: 60 }]}>
        {/* Progress Bar */}
        <View style={styles.header}>
          <Text style={styles.progressLabel}>
            Question {qIndex + 1} of {QUESTIONS.length}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Subject Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentQ.subject}</Text>
          </View>

          {/* Question */}
          <Text style={styles.questionText}>{currentQ.text}</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {currentQ.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  selectedOption === idx && styles.optionSelected,
                ]}
                onPress={() => setSelectedOption(idx)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOption === idx && styles.optionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
                {selectedOption === idx && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Next Button */}
        <View style={styles.fixedFooter}>
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              selectedOption === null && styles.btnDisabled,
            ]}
            onPress={handleNextQuestion}
            disabled={selectedOption === null}
          >
            <Text style={styles.btnText}>
              {qIndex === QUESTIONS.length - 1
                ? "Finish Evaluation"
                : "Next Question"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDER: RESULT SCREEN ---
  if (currentStep === "result") {
    const percentage = (score / QUESTIONS.length) * 100;
    const isGood = percentage >= 60;

    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 24 },
        ]}
      >
        {/* Score Circle */}
        <View
          style={[
            styles.resultCircle,
            { borderColor: isGood ? COLORS.secondary : "#FFC107" },
          ]}
        >
          <Text style={styles.resultScore}>{percentage}%</Text>
          <Text style={styles.resultLabel}>Mastery</Text>
        </View>

        <Text style={styles.title}>
          {isGood ? "Great Start!" : "Baseline Set"}
        </Text>
        <Text style={[styles.subtitle, { marginBottom: 30 }]}>
          Your Digital Twin has been created. We have tailored the content based
          on your results.
        </Text>

        {/* Analysis Card */}
        <View style={styles.analysisCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Knowledge Gaps</Text>
          </View>
          <Text style={{ color: COLORS.text }}>
            {isGood
              ? "You have a strong foundation. We will start with advanced topics."
              : "We detected some gaps in Physics. We've added a review module to your home screen."}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, { width: "100%", marginTop: 40 }]}
          onPress={goToHome}
        >
          <Text style={styles.btnText}>Go to Home</Text>
          <Ionicons name="rocket-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ==========================================
// 4. STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    paddingTop: 60,
  },

  // Header
  header: { alignItems: "center", marginBottom: 30, width: "100%" },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 8,
  },

  // Setup Cards
  section: { marginBottom: 25, width: "100%" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  row: { flexDirection: "row", gap: 12 },

  card: {
    width: "48%",
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  langCard: {
    flex: 1,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  cardSelected: { borderColor: COLORS.secondary, backgroundColor: "#E8F5E9" },
  cardText: { fontSize: 16, fontWeight: "600", color: COLORS.textLight },
  cardTextSelected: { color: COLORS.secondary, fontWeight: "bold" },
  checkIcon: { position: "absolute", top: 8, right: 8 },

  // Quiz Styles
  progressLabel: {
    alignSelf: "flex-start",
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#EEEEEE",
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: COLORS.secondary },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 15,
  },
  badgeText: { color: COLORS.primary, fontWeight: "bold", fontSize: 12 },
  questionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    lineHeight: 30,
    marginBottom: 30,
  },

  optionsList: { gap: 12 },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EEEEEE",
    backgroundColor: COLORS.background,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: "#E6F0FF" },
  optionText: { fontSize: 16, color: COLORS.text, fontWeight: "500" },
  optionTextSelected: { color: COLORS.primary, fontWeight: "bold" },

  // Result Styles
  resultCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  resultScore: { fontSize: 48, fontWeight: "bold", color: COLORS.text },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    textTransform: "uppercase",
  },

  analysisCard: {
    width: "100%",
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text },

  // Footer & Buttons
  footer: { marginTop: 20, marginBottom: 40 },
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },

  btnPrimary: {
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { backgroundColor: "#CCCCCC", shadowOpacity: 0, elevation: 0 },
  btnText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
