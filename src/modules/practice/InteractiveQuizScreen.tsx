import { COLORS } from "@/shared/constants/colors";
import {
  fetchPracticeQuizDetail,
  gradePracticeAnswer,
  submitPracticeAttempt,
} from "@/shared/services/ai-service";
import { syncTwinProgress } from "@/shared/services/gamification";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type QuizQuestion = {
  id?: string;
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
      quizId?: string;
      subject?: string;
    };
  };
};

const QUESTION_TIME_SECONDS = 30;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeBooleanAnswer = (value: string) => {
  const normalized = normalizeText(value);
  if (normalized === "true" || normalized === "t") return "true";
  if (normalized === "false" || normalized === "f") return "false";
  return normalized;
};

const getOptionLetter = (index: number) =>
  String.fromCharCode(65 + index);

const extractOptionIndexFromAnswer = (
  answer: string,
  options: string[] = [],
) => {
  const normalizedAnswer = normalizeText(answer);
  const byTextIndex = options.findIndex(
    (option) => normalizeText(option) === normalizedAnswer,
  );
  if (byTextIndex >= 0) {
    return byTextIndex;
  }

  const directLetter = answer.match(/^\s*[\[(]?([a-zA-Z])[\])]?\s*$/);
  if (directLetter) {
    const idx = directLetter[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const leadingLetter = answer.match(/^\s*[\[(]?([a-zA-Z])[\]).:-]\s*/);
  if (leadingLetter) {
    const idx = leadingLetter[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const optionWord = normalizeText(answer).match(/\b(option|choice)\s+([a-z])\b/);
  if (optionWord) {
    const idx = optionWord[2].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  return -1;
};

const areAnswersEquivalent = (question: QuizQuestion, provided: string, expected: string) => {
  if (question.type === "true_false") {
    return normalizeBooleanAnswer(provided) === normalizeBooleanAnswer(expected);
  }

  if (question.type === "mcq" && Array.isArray(question.options)) {
    const providedIndex = extractOptionIndexFromAnswer(provided, question.options);
    const expectedIndex = extractOptionIndexFromAnswer(expected, question.options);

    if (providedIndex >= 0 && expectedIndex >= 0) {
      return providedIndex === expectedIndex;
    }

    if (providedIndex >= 0) {
      const providedLetter = getOptionLetter(providedIndex).toLowerCase();
      const normalizedExpected = normalizeText(expected);
      if (
        normalizedExpected === providedLetter ||
        normalizedExpected.startsWith(`${providedLetter} `)
      ) {
        return true;
      }
    }
  }

  return normalizeText(provided) === normalizeText(expected);
};

const getSafeHintText = (question: QuizQuestion) => {
  const rawHint = (question.hint || "").trim();
  const normalizedAnswer = normalizeText(question.answer || "");
  const normalizedHint = normalizeText(rawHint);

  if (!rawHint) {
    return "Focus on the key textbook concept and definitions.";
  }

  if (normalizedAnswer && normalizedAnswer.length >= 3) {
    const answerTokens = normalizedAnswer.split(" ").filter((token) => token.length >= 3);
    const revealsAnswer =
      normalizedHint.includes(normalizedAnswer) ||
      answerTokens.some((token) => normalizedHint.includes(token));

    if (revealsAnswer) {
      return "Think about the core concept, then eliminate options that do not match the chapter rule.";
    }
  }

  return rawHint;
};

export default function InteractiveQuizScreen({ route }: Props) {
  const router = useRouter();
  const initialQuestions = route?.params?.questions || [];
  const quizId = route?.params?.quizId || "";
  const initialSubject = route?.params?.subject || "";
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [quizSubject, setQuizSubject] = useState(initialSubject);
  const [isHydrating, setIsHydrating] = useState(
    initialQuestions.length === 0 && !!quizId,
  );
  const [hydrateError, setHydrateError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [shortAnswer, setShortAnswer] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [saveStatusText, setSaveStatusText] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [postExplanationVisible, setPostExplanationVisible] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerByIndex, setAnswerByIndex] = useState<Record<number, string>>({});
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);
  const [attemptSaved, setAttemptSaved] = useState(false);

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  useEffect(() => {
    if (initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setIsHydrating(false);
      setHydrateError("");
      return;
    }

    if (!quizId) {
      setQuestions([]);
      setIsHydrating(false);
      setHydrateError("");
      return;
    }

    let mounted = true;
    setIsHydrating(true);
    setHydrateError("");

    const hydrate = async () => {
      try {
        const detail = await fetchPracticeQuizDetail(quizId);
        if (!mounted) return;
        setQuestions((detail.questions || []) as QuizQuestion[]);
        if (!quizSubject && detail.subject) {
          setQuizSubject(detail.subject);
        }
      } catch (error) {
        if (!mounted) return;
        setHydrateError(
          error instanceof Error
            ? error.message
            : "Failed to load quiz from backend.",
        );
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [initialQuestions, quizId]);

  useEffect(() => {
    setCurrentIndex(0);
    setTimeLeft(QUESTION_TIME_SECONDS);
    setPostExplanationVisible(false);
    setShortAnswer("");
    setIsGrading(false);
    setTimeUp(false);
    setFeedbackText("");
    setIsCorrect(null);
    setAttempted(false);
    setCorrectCount(0);
    setAnswerByIndex({});
    setAttemptSaved(false);
    setSaveStatusText("");
  }, [questions.length]);

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

    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, attempted, isGrading, isFinished]);

  const progressLabel = useMemo(() => {
    return `${Math.min(currentIndex + 1, questions.length)}/${questions.length}`;
  }, [currentIndex, questions.length]);

  const submitForGrading = async (studentAnswer: string) => {
    if (!currentQ || isGrading || attempted || !studentAnswer.trim()) {
      return;
    }

    setIsGrading(true);
    setAnswerByIndex((current) => ({
      ...current,
      [currentIndex]: studentAnswer.trim(),
    }));
    const result = await gradePracticeAnswer({
      question: currentQ.question,
      question_type: currentQ.type,
      correct_answer: currentQ.answer,
      student_answer: studentAnswer,
    });

    const normalizedIsCorrect =
      result.is_correct ||
      areAnswersEquivalent(currentQ, studentAnswer, currentQ.answer);

    setIsGrading(false);
    setAttempted(true);
    setIsCorrect(normalizedIsCorrect);
    setFeedbackText(result.feedback);
    if (normalizedIsCorrect) {
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
    setPostExplanationVisible(false);
    setShortAnswer("");
    setIsGrading(false);
    setTimeUp(false);
    setFeedbackText("");
    setIsCorrect(null);
    setAttempted(false);
  };

  useEffect(() => {
    if (!isFinished || !quizId || attemptSaved || isSavingAttempt) {
      return;
    }

    const submitAttempt = async () => {
      const answers = questions
        .map((question, index) => ({
          questionId: question.id || "",
          providedAnswer: (answerByIndex[index] || "").trim(),
        }))
        .filter((item) => item.questionId && item.providedAnswer);

      if (!answers.length) {
        setAttemptSaved(true);
        return;
      }

      setIsSavingAttempt(true);
      const result = await submitPracticeAttempt({ quizId, answers });
      setIsSavingAttempt(false);
      setAttemptSaved(true);
      setSaveStatusText(
        result.success
          ? "Your attempt was saved to EduTwin backend."
          : "Attempt could not be saved to backend. Your score is still available locally.",
      );

      if (quizSubject) {
        void syncTwinProgress({
          subject: quizSubject as "biology" | "chemistry" | "physics" | "math",
          score: correctCount,
          totalQuestions: questions.length,
          xp_delta: Math.max(3, correctCount === questions.length ? 10 : Math.round((correctCount / Math.max(1, questions.length)) * 10) + 2),
        });
      }
    };

    void submitAttempt();
  }, [isFinished, quizId, attemptSaved, isSavingAttempt, questions, answerByIndex, quizSubject, correctCount]);

  if (isHydrating) {
    return (
      <View style={styles.screenCenter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.completeText}>Loading quiz from backend...</Text>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={styles.screenCenter}>
        <Ionicons name="warning-outline" size={30} color={COLORS.error} />
        <Text style={styles.emptyTitle}>No questions found</Text>
        {!!hydrateError && <Text style={styles.errorText}>{hydrateError}</Text>}
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
        {!!saveStatusText && <Text style={styles.saveStatusText}>{saveStatusText}</Text>}
        {isSavingAttempt ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : null}
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.progressText}>Question {progressLabel}</Text>
        <View style={[styles.timerPill, timeLeft <= 7 && styles.timerUrgent]}>
          <Ionicons name="timer-outline" size={14} color="white" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      <Text style={styles.questionType}>{currentQ.type.toUpperCase()}</Text>
      <Text style={styles.questionText}>{currentQ.question}</Text>

      {!attempted && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Hint</Text>
          <Text style={styles.hintText}>{getSafeHintText(currentQ)}</Text>
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
          {(currentQ.options || []).map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                (attempted || isGrading || timeUp) && styles.disabledButton,
              ]}
              disabled={attempted || isGrading || timeUp}
              onPress={() => submitForGrading(option)}
            >
              <View style={styles.optionRow}>
                <View style={styles.optionLetterBadge}>
                  <Text style={styles.optionLetterText}>{getOptionLetter(index)}</Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </View>
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

          <View style={styles.postActionsRow}>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => setPostExplanationVisible((prev) => !prev)}
            >
              <Text style={styles.secondaryActionText}>
                {postExplanationVisible ? "Hide Explanation" : "Show Explanation"}
              </Text>
            </TouchableOpacity>
          </View>

          {postExplanationVisible && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Explanation</Text>
              <Text style={styles.infoText}>
                {currentQ.explanation ||
                  "Compare your answer with the textbook explanation for this concept."}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryButton, styles.nextButton]} onPress={goNext}>
            <Text style={styles.primaryButtonText}>Next Question</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },
  screenContent: {
    paddingHorizontal: 18,
    paddingTop: 36,
    paddingBottom: 28,
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
  hintBox: {
    backgroundColor: "#FEF8E7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3D27A",
    padding: 12,
  },
  hintTitle: {
    color: "#8A6418",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
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
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#D6E4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterText: {
    color: "#2E4A86",
    fontWeight: "800",
    fontSize: 12,
  },
  optionText: {
    flex: 1,
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
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
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
  saveStatusText: {
    color: "#35507E",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
  infoCard: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    backgroundColor: "#F4F8FF",
    padding: 10,
    gap: 4,
  },
  infoTitle: {
    color: "#2E4A86",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoText: {
    color: "#1A202C",
    lineHeight: 20,
    fontWeight: "600",
  },
  postActionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  secondaryActionBtn: {
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  secondaryActionText: {
    color: "#2E4A86",
    fontWeight: "700",
    fontSize: 12,
  },
  nextButton: {
    alignSelf: "stretch",
    alignItems: "center",
  },
});
