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

// --- MOCK DATA (Phase 1: Warm Up) ---
// In a real app, this comes from SQLite based on the user's Grade - 1
const MOCK_QUESTIONS = [
  {
    id: 1,
    topic: "Biology - Cell Structure",
    question: 'Which part of the cell is known as the "powerhouse"?',
    options: ["Nucleus", "Mitochondria", "Ribosome", "Cytoplasm"],
    correctIndex: 1,
  },
  {
    id: 2,
    topic: "Math - Algebra",
    question: "Solve for x: 2x + 4 = 10",
    options: ["x = 2", "x = 3", "x = 5", "x = 6"],
    correctIndex: 1,
  },
  {
    id: 3,
    topic: "Physics - Forces",
    question: "What is the unit of Force?",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    correctIndex: 1,
  },
];

export default function DiagnosticQuiz() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: number; isCorrect: boolean }[]
  >([]);

  const currentQuestion = MOCK_QUESTIONS[currentIndex];
  const progress = (currentIndex + 1) / MOCK_QUESTIONS.length;

  const handleNext = () => {
    if (selectedOption === null) return;

    // 1. Record Answer
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    const newScore = isCorrect ? score + 1 : score;
    const newAnswers = [
      ...answers,
      { questionId: currentQuestion.id, isCorrect },
    ];

    setScore(newScore);
    setAnswers(newAnswers);

    // 2. Move to Next or Finish
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null); // Reset selection
    } else {
      finishQuiz(newScore, newAnswers);
    }
  };

  const finishQuiz = (finalScore: number, finalAnswers: any) => {
    void finalAnswers;
    recordAssessmentCompletion("biology", finalScore, MOCK_QUESTIONS.length);

    // Navigate to Result Page with data
    // We pass the score as a URL parameter
    router.replace({
      pathname: "./QuizResult", // Ideally, we'd make a route for this
      params: { score: finalScore, total: MOCK_QUESTIONS.length },
    });

    // NOTE: Since we haven't created the route file yet, let's just use the component logic
    // For now, let's assume we route to a generic result page or use a state switch.
    // Ideally: router.push(`/assessment/result?score=${finalScore}`);
  };

  return (
    <View style={styles.container}>
      {/* HEADER: Progress */}
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} / {MOCK_QUESTIONS.length}
        </Text>
      </View>

      {/* BODY: Question */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.topicBadge}>{currentQuestion.topic}</Text>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === index && styles.optionSelected,
              ]}
              onPress={() => setSelectedOption(index)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === index && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>

              {selectedOption === index && (
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

      {/* FOOTER: Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.btnPrimary,
            selectedOption === null && styles.btnDisabled,
          ]}
          onPress={handleNext}
          disabled={selectedOption === null}
        >
          <Text style={styles.btnText}>
            {currentIndex === MOCK_QUESTIONS.length - 1
              ? "Finish Assessment"
              : "Next Question"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingTop: 50 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: { height: "100%", backgroundColor: COLORS.secondary }, // Green
  progressText: { color: COLORS.textLight, fontSize: 14, fontWeight: "600" },

  content: { paddingHorizontal: 24, paddingBottom: 100 },
  topicBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F0FF",
    color: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 15,
    overflow: "hidden",
  },
  questionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 30,
    lineHeight: 30,
  },

  optionsContainer: { gap: 12 },
  optionButton: {
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

  footer: {
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
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { backgroundColor: "#CCCCCC", shadowOpacity: 0 },
  btnText: { color: "white", fontSize: 18, fontWeight: "600" },
});
