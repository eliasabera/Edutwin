import { COLORS } from "@/shared/constants/colors";
import { gradePracticeAnswer } from "@/shared/services/ai-service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type QuizQuestion = {
  type: "mcq" | "true_false" | "short";
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
  explanation?: string;
};

type Props = {
  route: {
    params?: {
      questions?: QuizQuestion[];
    };
  };
};

const QUESTION_TIME_SECONDS = 30;

export default function InteractiveQuizScreen({ route }: Props) {
  const router = useRouter();
  const questions = route?.params?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [hintVisible, setHintVisible] = useState(false);
  const [shortAnswer, setShortAnswer] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  useEffect(() => {
    if (isFinished || attempted || isGrading) {
      return;
    }

    if (timeLeft <= 0) {
      setTimeUp(true);
      setAttempted(true);
      setIsCorrect(false);
      setFeedbackText("Time is up. Review the hint and try the next question.");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempted, isGrading, isFinished]);

  const progressLabel = useMemo(() => {
    return `${Math.min(currentIndex + 1, questions.length)}/${questions.length}`;
  }, [currentIndex, questions.length]);

  const submitForGrading = async (studentAnswer: string) => {
    if (!currentQ || isGrading || attempted || !studentAnswer.trim()) {
      return;
    }

    setIsGrading(true);
    const result = await gradePracticeAnswer({
      question: currentQ.question,
      question_type: currentQ.type,
      correct_answer: currentQ.answer,
      student_answer: studentAnswer,
    });

    setIsGrading(false);
    setAttempted(true);
    setIsCorrect(result.is_correct);
    setFeedbackText(result.feedback);
    if (result.is_correct) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const goNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setCurrentIndex(questions.length);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setTimeLeft(QUESTION_TIME_SECONDS);
    setHintVisible(false);
    setShortAnswer("");
    setIsGrading(false);
    setTimeUp(false);
    setFeedbackText("");
    setIsCorrect(null);
    setAttempted(false);
  };

  if (!questions.length) {
    return (
      <View style={styles.screenCenter}>
        <Ionicons name="warning-outline" size={30} color={COLORS.error} />
        <Text style={styles.emptyTitle}>No questions found</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.screenCenter}>
        <Ionicons name="trophy" size={42} color={COLORS.primary} />
        <Text style={styles.completeTitle}>Practice Complete</Text>
        <Text style={styles.completeText}>
          Final score: {correctCount}/{questions.length}
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/practice-hub")}
        >
          <Text style={styles.primaryButtonText}>Back to Practice Hub</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.progressText}>Question {progressLabel}</Text>
        <View style={[styles.timerPill, timeLeft <= 7 && styles.timerUrgent]}>
          <Ionicons name="timer-outline" size={14} color="white" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      <Text style={styles.questionType}>{currentQ.type.toUpperCase()}</Text>
      <Text style={styles.questionText}>{currentQ.question}</Text>

      <TouchableOpacity
        style={styles.hintButton}
        onPress={() => setHintVisible(true)}
        disabled={hintVisible}
      >
        <Text style={styles.hintButtonText}>Need a Hint?</Text>
      </TouchableOpacity>

      {hintVisible && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>
            {currentQ.hint || "Think about the core textbook concept."}
          </Text>
        </View>
      )}

      {currentQ.type === "short" ? (
        <View style={styles.shortWrap}>
          <TextInput
            value={shortAnswer}
            onChangeText={setShortAnswer}
            style={styles.input}
            editable={!attempted && !isGrading && !timeUp}
            placeholder="Type your answer"
            placeholderTextColor={COLORS.textLight}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!shortAnswer.trim() || attempted || isGrading || timeUp) &&
                styles.disabledButton,
            ]}
            onPress={() => submitForGrading(shortAnswer)}
            disabled={!shortAnswer.trim() || attempted || isGrading || timeUp}
          >
            <Text style={styles.primaryButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionList}>
          {(currentQ.options || []).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                (attempted || isGrading || timeUp) && styles.disabledButton,
              ]}
              disabled={attempted || isGrading || timeUp}
              onPress={() => submitForGrading(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isGrading && (
        <View style={styles.gradingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.gradingText}>AI is grading your answer...</Text>
        </View>
      )}

      {attempted && (
        <View
          style={[
            styles.feedbackBox,
            isCorrect ? styles.correctBox : styles.wrongBox,
          ]}
        >
          <Text
            style={[
              styles.feedbackTitle,
              isCorrect ? styles.correctText : styles.wrongText,
            ]}
          >
            {timeUp ? "Time's Up" : isCorrect ? "Correct" : "Not Correct"}
          </Text>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>Next Question</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    paddingHorizontal: 18,
    paddingTop: 36,
    gap: 14,
  },
  screenCenter: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    color: "#1A202C",
    fontWeight: "700",
  },
  timerPill: {
    backgroundColor: "#0B5FFF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: COLORS.error,
  },
  timerText: {
    color: "white",
    fontWeight: "700",
  },
  questionType: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F0FF",
    color: "#0B5FFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 12,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A202C",
    lineHeight: 28,
  },
  hintButton: {
    alignSelf: "flex-start",
    backgroundColor: "#EAFBF2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintButtonText: {
    color: "#0C8E46",
    fontWeight: "700",
  },
  hintBox: {
    backgroundColor: "#FEF8E7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3D27A",
    padding: 12,
  },
  hintText: {
    color: "#5D430B",
    fontWeight: "600",
    lineHeight: 20,
  },
  optionList: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D6E4FF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  optionText: {
    color: "#1A202C",
    fontWeight: "700",
  },
  shortWrap: {
    gap: 10,
  },
  input: {
    minHeight: 110,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#0B5FFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.55,
  },
  gradingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gradingText: {
    color: "#35507E",
    fontWeight: "600",
  },
  feedbackBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  correctBox: {
    borderColor: "#9BE2B7",
    backgroundColor: "#ECFFF4",
  },
  wrongBox: {
    borderColor: "#F3A8A8",
    backgroundColor: "#FFF0F0",
  },
  feedbackTitle: {
    fontWeight: "800",
  },
  correctText: {
    color: "#0C8E46",
  },
  wrongText: {
    color: COLORS.error,
  },
  feedbackText: {
    color: "#1A202C",
    lineHeight: 20,
  },
  emptyTitle: {
    color: "#1A202C",
    fontSize: 18,
    fontWeight: "800",
  },
  completeTitle: {
    color: "#1A202C",
    fontSize: 22,
    fontWeight: "800",
  },
  completeText: {
    color: "#35507E",
    fontWeight: "600",
  },
});
