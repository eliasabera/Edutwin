import { COLORS } from "@/shared/constants/colors";
import {
  fetchPracticeQuizDetail,
  submitPracticeAttempt,
} from "@/shared/services/ai-service";
import { syncTwinProgress } from "@/shared/services/gamification";
import { useTranslation } from "@/shared/i18n";
import {
  normalizePracticeQuestions,
  type NormalizedPracticeQuestion,
} from "@/shared/services/practice-quiz-normalizer";
import { gradePracticeAnswerWithTimeout } from "@/shared/services/practice-grading";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "@/shared/store/settings-store";

type QuizQuestion = NormalizedPracticeQuestion;

type Props = {
  route: {
    params?: {
      questions?: QuizQuestion[] | string;
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

const stripOptionPrefix = (value: string) =>
  String(value || "")
    .replace(/^\s*\(?[a-zA-Z]\)?[\].:\-]\s*/i, "")
    .replace(/^\s*(option|choice)\s+[a-zA-Z]\s*[:.\-]?\s*/i, "")
    .trim();

const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

const extractOptionIndexFromAnswer = (
  answer: string,
  options: string[] = [],
) => {
  const normalizedAnswer = normalizeText(answer);
  const normalizedStrippedAnswer = normalizeText(stripOptionPrefix(answer));
  const byTextIndex = options.findIndex((option) => {
    const normalizedOption = normalizeText(option);
    const normalizedStrippedOption = normalizeText(stripOptionPrefix(option));

    return (
      normalizedOption === normalizedAnswer ||
      normalizedOption === normalizedStrippedAnswer ||
      normalizedStrippedOption === normalizedAnswer ||
      normalizedStrippedOption === normalizedStrippedAnswer
    );
  });
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

  const optionWord = normalizeText(answer).match(
    /\b(option|choice)\s+([a-z])\b/,
  );
  if (optionWord) {
    const idx = optionWord[2].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const optionNumberWord = normalizeText(answer).match(
    /\b(option|choice)\s+(\d+)\b/,
  );
  if (optionNumberWord) {
    const idx = Number(optionNumberWord[2]) - 1;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const directNumber = String(answer || "").match(/^\s*(\d+)\s*$/);
  if (directNumber) {
    const idx = Number(directNumber[1]) - 1;
    if (idx >= 0 && idx < options.length) {
      return idx;
    }
  }

  const containsTextIndex = options.findIndex((option) => {
    const normalizedOption = normalizeText(stripOptionPrefix(option));
    if (!normalizedOption || normalizedOption.length < 3) {
      return false;
    }
    return (
      normalizedStrippedAnswer.includes(normalizedOption) ||
      normalizedOption.includes(normalizedStrippedAnswer)
    );
  });
  if (containsTextIndex >= 0) {
    return containsTextIndex;
  }

  return -1;
};

const areAnswersEquivalent = (
  question: QuizQuestion,
  provided: string,
  expected: string,
) => {
  if (question.type === "true_false") {
    return (
      normalizeBooleanAnswer(provided) === normalizeBooleanAnswer(expected)
    );
  }

  if (question.type === "mcq" && Array.isArray(question.options)) {
    const providedIndex = extractOptionIndexFromAnswer(
      provided,
      question.options,
    );
    const expectedIndex = extractOptionIndexFromAnswer(
      expected,
      question.options,
    );

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
    const answerTokens = normalizedAnswer
      .split(" ")
      .filter((token) => token.length >= 3);
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
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  const isDark =
    appSettings.themeMode === "system"
      ? (deviceTheme ?? getEffectiveThemeMode()) === "dark"
      : appSettings.themeMode === "dark";
  const styles = useMemo(() => createQuizStyles(isDark), [isDark]);
  const { t } = useTranslation();
  const rawQuestions = route?.params?.questions;
  const initialQuestions = useMemo(() => {
    if (Array.isArray(rawQuestions)) {
      return normalizePracticeQuestions(rawQuestions);
    }
    if (typeof rawQuestions === "string") {
      try {
        const parsed = JSON.parse(rawQuestions);
        return normalizePracticeQuestions(Array.isArray(parsed) ? parsed : []);
      } catch {
        return [] as QuizQuestion[];
      }
    }
    return [] as QuizQuestion[];
  }, [rawQuestions]);
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
  const [answerByIndex, setAnswerByIndex] = useState<Record<number, string>>(
    {},
  );
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);
  const [attemptSaved, setAttemptSaved] = useState(false);

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  useEffect(() => {
    if (!quizId) {
      setQuestions(initialQuestions);
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
        setQuestions(normalizePracticeQuestions(detail.questions || []));
        if (!quizSubject && detail.subject) {
          setQuizSubject(detail.subject);
        }
      } catch (error) {
        if (!mounted) return;
        setHydrateError(
          error instanceof Error ? error.message : t("practice.loadFailed"),
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
  }, [initialQuestions, quizId, quizSubject, t]);

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
      setFeedbackText(t("practice.timeUp"));
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, attempted, isGrading, isFinished]);

  const submitForGrading = async (studentAnswer: string) => {
    if (!currentQ || isGrading || attempted || !studentAnswer.trim()) {
      return;
    }

    setIsGrading(true);
    setAnswerByIndex((current) => ({
      ...current,
      [currentIndex]: studentAnswer.trim(),
    }));
    const localIsCorrect = areAnswersEquivalent(
      currentQ,
      studentAnswer,
      currentQ.answer,
    );
    const fallbackFeedback = localIsCorrect
      ? t("practice.correct")
      : t("practice.notCorrect");

    try {
      const result = await gradePracticeAnswerWithTimeout(
        {
          question: currentQ.question,
          question_type: currentQ.type,
          correct_answer: currentQ.answer,
          student_answer: studentAnswer,
        },
        {
          timeoutMs: 4500,
          fallback: {
            isCorrect: localIsCorrect,
            feedback: fallbackFeedback,
          },
        },
      );

      const normalizedIsCorrect = result.is_correct || localIsCorrect;
      setAttempted(true);
      setIsCorrect(normalizedIsCorrect);
      setFeedbackText(result.feedback || fallbackFeedback);
      if (normalizedIsCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
    } catch {
      setAttempted(true);
      setIsCorrect(localIsCorrect);
      setFeedbackText(fallbackFeedback);
      if (localIsCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
    } finally {
      setIsGrading(false);
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
        result.success ? t("practice.savedBackend") : t("practice.saveFailed"),
      );

      if (quizSubject) {
        void syncTwinProgress({
          subject: quizSubject as "biology" | "chemistry" | "physics" | "math",
          score: correctCount,
          totalQuestions: questions.length,
          xp_delta: Math.max(
            3,
            correctCount === questions.length
              ? 10
              : Math.round(
                  (correctCount / Math.max(1, questions.length)) * 10,
                ) + 2,
          ),
        });
      }
    };

    void submitAttempt();
  }, [
    isFinished,
    quizId,
    attemptSaved,
    isSavingAttempt,
    questions,
    answerByIndex,
    quizSubject,
    correctCount,
    t,
  ]);

  if (isHydrating) {
    return (
      <View
        style={[
          styles.screenCenter,
          { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.completeText}>{t("practice.loadingQuiz")}</Text>
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View
        style={[
          styles.screenCenter,
          { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
        ]}
      >
        <Ionicons name="warning-outline" size={30} color={COLORS.error} />
        <Text style={styles.emptyTitle}>{t("practice.noQuestions")}</Text>
        {!!hydrateError && <Text style={styles.errorText}>{hydrateError}</Text>}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>{t("practice.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View
        style={[
          styles.screenCenter,
          { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
        ]}
      >
        <Ionicons name="trophy" size={42} color={COLORS.primary} />
        <Text style={styles.completeTitle}>
          {t("practice.practiceComplete")}
        </Text>
        <Text style={styles.completeText}>
          {t("practice.finalScore", {
            correct: correctCount,
            total: questions.length,
          })}
        </Text>
        {!!saveStatusText && (
          <Text style={styles.saveStatusText}>{saveStatusText}</Text>
        )}
        {isSavingAttempt ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : null}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(tabs)/practice-hub")}
        >
          <Text style={styles.primaryButtonText}>
            {t("practice.backToHub")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#08111F" : "#F5F9FF" },
      ]}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <Text style={styles.progressText}>
          {t("practice.question", {
            current: Math.min(currentIndex + 1, questions.length),
            total: questions.length,
          })}
        </Text>
        <View style={[styles.timerPill, timeLeft <= 7 && styles.timerUrgent]}>
          <Ionicons name="timer-outline" size={14} color="white" />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      </View>

      <Text style={styles.questionType}>{currentQ.type.toUpperCase()}</Text>
      <Text style={styles.questionText}>{currentQ.question}</Text>

      {!attempted && (
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>{t("practice.hint")}</Text>
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
            placeholder={t("practice.typeYourAnswer")}
            placeholderTextColor={isDark ? "#8FA1BF" : COLORS.textLight}
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
            <Text style={styles.primaryButtonText}>
              {t("practice.submitAnswer")}
            </Text>
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
                  <Text style={styles.optionLetterText}>
                    {getOptionLetter(index)}
                  </Text>
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
          <Text style={styles.gradingText}>{t("practice.grading")}</Text>
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
            {timeUp
              ? t("practice.timeUpState")
              : isCorrect
                ? t("practice.correct")
                : t("practice.notCorrect")}
          </Text>
          <Text style={styles.feedbackText}>{feedbackText}</Text>

          <View style={styles.postActionsRow}>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => setPostExplanationVisible((prev) => !prev)}
            >
              <Text style={styles.secondaryActionText}>
                {postExplanationVisible
                  ? t("practice.hideExplanation")
                  : t("practice.showExplanation")}
              </Text>
            </TouchableOpacity>
          </View>

          {postExplanationVisible && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{t("practice.explanation")}</Text>
              <Text style={styles.infoText}>
                {currentQ.explanation || t("practice.compareWithExplanation")}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, styles.nextButton]}
            onPress={goNext}
          >
            <Text style={styles.primaryButtonText}>
              {t("practice.nextQuestion")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const createQuizStyles = (isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? "#08111F" : "#FFFFFF",
    },
    screenContent: {
      paddingHorizontal: 18,
      paddingTop: 36,
      paddingBottom: 28,
      gap: 14,
    },
    screenCenter: {
      flex: 1,
      backgroundColor: isDark ? "#08111F" : "#FFFFFF",
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
      color: isDark ? "#F4F7FB" : "#1A202C",
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
      backgroundColor: isDark ? "#1A2F4F" : "#E7F0FF",
      color: isDark ? "#78A5FF" : "#0B5FFF",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      fontWeight: "700",
      fontSize: 12,
    },
    questionText: {
      fontSize: 20,
      fontWeight: "800",
      color: isDark ? "#F4F7FB" : "#1A202C",
      lineHeight: 28,
    },
    hintBox: {
      backgroundColor: isDark ? "#2A2410" : "#FEF8E7",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "#6B5A2E" : "#F3D27A",
      padding: 12,
    },
    hintTitle: {
      color: isDark ? "#E8D48A" : "#8A6418",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 6,
    },
    hintText: {
      color: isDark ? "#D4C48A" : "#5D430B",
      fontWeight: "600",
      lineHeight: 20,
    },
    optionList: {
      gap: 10,
    },
    optionButton: {
      backgroundColor: isDark ? "#121C2E" : "white",
      borderWidth: 1,
      borderColor: isDark ? "#2E4368" : "#D6E4FF",
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
      backgroundColor: isDark ? "#1A2F4F" : "#EEF4FF",
      borderWidth: 1,
      borderColor: isDark ? "#2E4368" : "#D6E4FF",
      alignItems: "center",
      justifyContent: "center",
    },
    optionLetterText: {
      color: isDark ? "#B8D4FF" : "#2E4A86",
      fontWeight: "800",
      fontSize: 12,
    },
    optionText: {
      flex: 1,
      color: isDark ? "#F4F7FB" : "#1A202C",
      fontWeight: "700",
    },
    shortWrap: {
      gap: 10,
    },
    input: {
      minHeight: 110,
      backgroundColor: isDark ? "#121C2E" : "white",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "#2E4368" : "#D6E4FF",
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: isDark ? "#F4F7FB" : COLORS.text,
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
      color: isDark ? "#9FB2D6" : "#35507E",
      fontWeight: "600",
    },
    feedbackBox: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
      gap: 8,
    },
    correctBox: {
      borderColor: isDark ? "#2D6B45" : "#9BE2B7",
      backgroundColor: isDark ? "#12301F" : "#ECFFF4",
    },
    wrongBox: {
      borderColor: isDark ? "#6B2D2D" : "#F3A8A8",
      backgroundColor: isDark ? "#2A1A1A" : "#FFF0F0",
    },
    feedbackTitle: {
      fontWeight: "800",
    },
    correctText: {
      color: isDark ? "#86EFAC" : "#0C8E46",
    },
    wrongText: {
      color: isDark ? "#FCA5A5" : COLORS.error,
    },
    feedbackText: {
      color: isDark ? "#EAF1FF" : "#1A202C",
      lineHeight: 20,
    },
    emptyTitle: {
      color: isDark ? "#F4F7FB" : "#1A202C",
      fontSize: 18,
      fontWeight: "800",
    },
    errorText: {
      color: isDark ? "#FCA5A5" : COLORS.error,
      textAlign: "center",
      fontWeight: "600",
      lineHeight: 20,
    },
    completeTitle: {
      color: isDark ? "#F4F7FB" : "#1A202C",
      fontSize: 22,
      fontWeight: "800",
    },
    completeText: {
      color: isDark ? "#9FB2D6" : "#35507E",
      fontWeight: "600",
    },
    saveStatusText: {
      color: isDark ? "#9FB2D6" : "#35507E",
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "600",
    },
    infoCard: {
      marginTop: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2E4368" : "#D6E4FF",
      backgroundColor: isDark ? "#121C2E" : "#F4F8FF",
      padding: 10,
      gap: 4,
    },
    infoTitle: {
      color: isDark ? "#B8D4FF" : "#2E4A86",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    infoText: {
      color: isDark ? "#EAF1FF" : "#1A202C",
      lineHeight: 20,
      fontWeight: "600",
    },
    postActionsRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    secondaryActionBtn: {
      backgroundColor: isDark ? "#1A2F4F" : "#EEF4FF",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isDark ? "#2E4368" : "#D6E4FF",
    },
    secondaryActionText: {
      color: isDark ? "#B8D4FF" : "#2E4A86",
      fontWeight: "700",
      fontSize: 12,
    },
    nextButton: {
      alignSelf: "stretch",
      alignItems: "center",
    },
  });
