import { COLORS } from "@/shared/constants/colors";
import {
  fetchMyPracticeQuizzes,
  fetchPracticeLibraryQuizzes,
  fetchPracticeQuizDetail,
  generatePracticeQuestions,
  type BackendPracticeQuizSummary,
  type PracticeResponse,
} from "@/shared/services/ai-service";
import { recordPracticeCompletion } from "@/shared/services/gamification";
import { useTranslation } from "@/shared/i18n";
import type {
  PracticeQuestionType,
  PracticeSet,
} from "@/shared/store/practice-store";
import { useStudentProfile } from "@/shared/store/user-store";
import type { SubjectName } from "@/shared/types/domain.types";
import { normalizePracticeQuestions } from "@/shared/services/practice-quiz-normalizer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PracticeAnswer = {
  selected: string;
  isCorrect: boolean;
  revealExplanation: boolean;
  revealHint: boolean;
  cardFlipped: boolean;
};

type PracticeSession = {
  set: PracticeSet;
  currentIndex: number;
  timeLeft: number;
  perQuestion: number;
  answers: Record<number, PracticeAnswer>;
  isComplete: boolean;
  completionTracked: boolean;
};

const SUBJECTS: SubjectName[] = ["biology", "chemistry", "physics", "math"];
const QUESTION_TYPES: PracticeQuestionType[] = ["mcq", "true_false", "short"];

const formatDisplayDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "Recently";
  }

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function PracticeHub() {
  const isDark = useColorScheme() === "dark";
  const { language } = useTranslation();
  const isOm = language === "om";
  const copy = {
    practiceHub: isOm ? "Wiirtuu Shaakala" : "Practice Hub",
    personalizedGeneration: isOm
      ? "Gaaffilee dhuunfaa siif mijatan uumuu"
      : "Personalized Question Generation",
    generateNewSet: isOm ? "Setii haaraa uumuu" : "Generate new set",
    subject: isOm ? "Mataduree" : "Subject",
    questionType: isOm ? "Gosa gaaffii" : "Question type",
    selectQuestionType: isOm ? "Gosa gaaffii filadhu" : "Select question type",
    topicArea: isOm ? "Mata-duree yookaan naannoo" : "Topic or area",
    topicPlaceholder: isOm
      ? "Mata-duree filannoo, fakkeenyaaf Mitoosis"
      : "Optional topic, for example Mitosis",
    numberOfQuestions: isOm ? "Lakkoofsa gaaffilee" : "Number of questions",
    startPractice: isOm ? "Shaakala jalqabi" : "Start Practice",
    noPracticeGeneratedPrefix: isOm
      ? "Shaakalni"
      : "No practice was generated for",
    noPracticeGeneratedSuffix: isOm
      ? "hin uumamne. Mata-duree kitaaba Kutaa"
      : ". Try a more specific Grade",
    noPracticeGeneratedTail: isOm
      ? "caalaa ifaa ta'e yaali."
      : "textbook topic.",
    quizNotSaved: isOm
      ? "Qorannoon backend keessatti hin kuufamne. Irra deebi'ii yaali."
      : "Quiz was not saved in backend. Please retry.",
    noQuestionsYet: isOm
      ? "Qorannoon kun gaaffii hin qabu."
      : "This quiz has no questions yet.",
    failedOpenSaved: isOm
      ? "Qorannoo kuufame banuun hin milkoofne."
      : "Failed to open saved practice quiz.",
    recently: isOm ? "Dhiheenya" : "Recently",
    complete: isOm ? "xumurame" : "complete",
    score: isOm ? "Bu'aa" : "Score",
    question: isOm ? "Gaaffii" : "Question",
    of: isOm ? "kan keessaa" : "of",
    typeYourAnswer: isOm ? "Deebii kee barreessi" : "Type your answer",
    check: isOm ? "Sakatta'i" : "Check",
    answerRevealed: isOm ? "Deebiin mul'ate" : "Answer revealed",
    tapToFlip: isOm ? "Kaardii deebii garagalchi" : "Tap to flip answer card",
    expectedAnswer: isOm ? "Deebii sirrii" : "Expected answer",
    yourAnswer: isOm ? "Deebii kee" : "Your answer",
    flipHint: isOm
      ? "Deebii kee deebii kitaabaa wajjin madaaluuf garagalchi."
      : "Flip to compare your answer with the textbook answer.",
    correct: isOm ? "Sirrii" : "Correct",
    correctAnswer: isOm ? "Deebii sirrii" : "Correct answer",
    hint: isOm ? "Gorsa" : "Hint",
    explain: isOm ? "Ibsi" : "Explain",
    nextQuestion: isOm ? "Gaaffii itti aanu" : "Next question",
    sessionComplete: isOm ? "Kutaan xumurame" : "Session complete",
    retryIncorrect: isOm
      ? "Kan dogoggoran qofa irra deebi'i"
      : "Retry incorrect only",
    teacherBank: isOm ? "Baankii gaaffii barsiisaa" : "Teacher question bank",
    loadingTeacher: isOm
      ? "Qorannoowwan barsiisaa fe'aa jira..."
      : "Loading teacher quizzes...",
    noTeacher: isOm
      ? "Qorannoo barsiisaa ammaaf hin jiru."
      : "No teacher quizzes are available yet.",
    savedSets: isOm ? "Setoota dhuunfaa kuufaman" : "Saved personalized sets",
    loadingSaved: isOm
      ? "Qorannoowwan kuufaman fe'aa jira..."
      : "Loading saved quizzes...",
    noBackendQuiz: isOm
      ? "Backend keessatti qorannoon hin jiru. Oliitti setii jalqabaa kee uumi."
      : "No backend quizzes yet. Generate your first set above.",
    filterQuizzes: isOm ? "Qorannoo matadureen calaluu" : "Filter quizzes by subject",
    allSubjects: isOm ? "Hunda" : "All",
  };
  const formatSubject = (value: SubjectName | string) => {
    const subjectKey = String(value || "").toLowerCase();
    if (subjectKey === "biology") return isOm ? "Baayoloojii" : "Biology";
    if (subjectKey === "chemistry") return isOm ? "Keemistirii" : "Chemistry";
    if (subjectKey === "physics") return isOm ? "Fiiziksii" : "Physics";
    if (subjectKey === "math") return isOm ? "Herrega" : "Math";
    return String(value || "");
  };
  const questionTypeLabel = (type: PracticeQuestionType) => {
    if (type === "mcq") return "MCQ";
    if (type === "true_false") return isOm ? "Dhugaa/Sobaa" : "True/False";
    return isOm ? "Deebii gabaabaa" : "Short answer";
  };
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const [subject, setSubject] = useState<SubjectName>("biology");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [questionTypes, setQuestionTypes] = useState<PracticeQuestionType[]>([
    "mcq",
    "true_false",
    "short",
  ]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);
  const [isFetchingSaved, setIsFetchingSaved] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [savedPracticeSets, setSavedPracticeSets] = useState<
    BackendPracticeQuizSummary[]
  >([]);
  const [teacherPracticeSets, setTeacherPracticeSets] = useState<
    BackendPracticeQuizSummary[]
  >([]);
  const [quizSubjectFilter, setQuizSubjectFilter] = useState<
    SubjectName | "all"
  >("all");
  const [quizFilterDropdownOpen, setQuizFilterDropdownOpen] = useState(false);

  const computeTiming = (count: number) => {
    const perQuestion = Math.max(30, Math.ceil((count * 45) / count));
    return { perQuestion };
  };

  const startSession = (set: PracticeSet) => {
    const { perQuestion } = computeTiming(set.questions.length);
    setSession({
      set,
      currentIndex: 0,
      timeLeft: perQuestion,
      perQuestion,
      answers: {},
      isComplete: false,
      completionTracked: false,
    });
    setShortAnswerInput("");
  };

  const toggleQuestionType = (type: PracticeQuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== type);
      }
      return [...prev, type];
    });
  };

  const selectedTypeLabel = QUESTION_TYPES.filter((type) =>
    questionTypes.includes(type),
  )
    .map((type) => questionTypeLabel(type))
    .join(", ");

  const loadSavedPracticeSets = useCallback(async () => {
    setIsFetchingSaved(true);
    const items = await fetchMyPracticeQuizzes();
    setSavedPracticeSets(items);
    setIsFetchingSaved(false);
  }, []);

  const loadPracticeLibrary = useCallback(async () => {
    setIsFetchingLibrary(true);
    const items = await fetchPracticeLibraryQuizzes();
    setTeacherPracticeSets(items);
    setIsFetchingLibrary(false);
  }, []);

  useEffect(() => {
    void loadPracticeLibrary();
    void loadSavedPracticeSets();
  }, [loadSavedPracticeSets, loadPracticeLibrary]);

  const handleStartPractice = async () => {
    const count = Math.max(1, Math.min(15, Number(questionCount) || 5));
    setIsLoading(true);
    setErrorText("");

    const response: PracticeResponse = await generatePracticeQuestions({
      subject,
      topic: topic.trim() || subject,
      num_questions: count,
      types: questionTypes,
    });

    setIsLoading(false);

    if (!response.questions.length) {
      setErrorText(
        response.error ||
          `${copy.noPracticeGeneratedPrefix} ${formatSubject(subject)}${copy.noPracticeGeneratedSuffix} ${studentProfile.grade} ${copy.noPracticeGeneratedTail}`,
      );
      return;
    }

    if (!response.quizId) {
      setErrorText(copy.quizNotSaved);
      return;
    }

    router.push({
      pathname: "../interactive-quiz",
      params: {
        quizId: response.quizId,
        subject,
        questions: JSON.stringify(response.questions),
      },
    });

    void loadSavedPracticeSets();
    void loadPracticeLibrary();
  };

  const openSavedPracticeSet = async (item: BackendPracticeQuizSummary) => {
    try {
      setErrorText("");
      const detail = await fetchPracticeQuizDetail(item.id);
      if (!detail.questions.length) {
        setErrorText(copy.noQuestionsYet);
        return;
      }

      const normalizedQuestions = normalizePracticeQuestions(detail.questions);
      if (!normalizedQuestions.length) {
        setErrorText(copy.noQuestionsYet);
        return;
      }

      router.push({
        pathname: "../interactive-quiz",
        params: {
          quizId: detail.quizId,
          subject: detail.subject || item.subject,
          questions: JSON.stringify(normalizedQuestions),
        },
      });
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : copy.failedOpenSaved,
      );
    }
  };

  const groupedTeacherSets = useMemo(() => {
    const filtered =
      quizSubjectFilter === "all"
        ? teacherPracticeSets
        : teacherPracticeSets.filter((set) => set.subject === quizSubjectFilter);

    return SUBJECTS.map((subjectKey) => ({
      subject: subjectKey,
      items: filtered.filter((set) => set.subject === subjectKey),
    })).filter((group) => group.items.length > 0);
  }, [quizSubjectFilter, teacherPracticeSets]);

  const groupedSavedSets = useMemo(() => {
    const filtered =
      quizSubjectFilter === "all"
        ? savedPracticeSets
        : savedPracticeSets.filter((set) => set.subject === quizSubjectFilter);

    return SUBJECTS.map((subjectKey) => ({
      subject: subjectKey,
      items: filtered.filter((set) => set.subject === subjectKey),
    })).filter((group) => group.items.length > 0);
  }, [quizSubjectFilter, savedPracticeSets]);

  const advanceQuestion = () => {
    setShortAnswerInput("");
    setSession((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.set.questions.length) {
        return { ...prev, isComplete: true, timeLeft: 0 };
      }
      return { ...prev, currentIndex: nextIndex, timeLeft: prev.perQuestion };
    });
  };

  const updateAnswerState = (update: Partial<PracticeAnswer>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const current = prev.answers[prev.currentIndex];
      if (!current) return prev;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [prev.currentIndex]: { ...current, ...update },
        },
      };
    });
  };

  const submitChoice = (value: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const question = prev.set.questions[prev.currentIndex];
      const isCorrect =
        value.trim().toLowerCase() === question.answer.trim().toLowerCase();
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [prev.currentIndex]: {
            selected: value,
            isCorrect,
            revealExplanation: false,
            revealHint: false,
            cardFlipped: false,
          },
        },
      };
    });
  };

  const submitShortAnswer = () => {
    if (!shortAnswerInput.trim()) return;
    submitChoice(shortAnswerInput.trim());
  };

  const retryIncorrect = () => {
    if (!session) return;
    const incorrectQuestions = session.set.questions.filter((_, index) => {
      const answer = session.answers[index];
      return !answer || !answer.isCorrect;
    });
    if (!incorrectQuestions.length) return;
    startSession({
      ...session.set,
      id: `${session.set.id}-retry`,
      title: `${session.set.title} retry`,
      questionCount: incorrectQuestions.length,
      questions: incorrectQuestions,
    });
  };

  useEffect(() => {
    if (!session || session.isComplete) return;
    if (session.timeLeft <= 0) {
      advanceQuestion();
      return;
    }

    const timer = setInterval(() => {
      setSession((prev) =>
        prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : prev,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.timeLeft, session?.isComplete]);

  useEffect(() => {
    if (!session || !session.isComplete || session.completionTracked) return;

    const score = Object.values(session.answers).filter(
      (item) => item.isCorrect,
    ).length;

    recordPracticeCompletion({
      score,
      totalQuestions: session.set.questions.length,
      subject: session.set.subject,
      source: session.set.source,
    });

    setSession((prev) => (prev ? { ...prev, completionTracked: true } : prev));
  }, [session]);

  const renderLibraryCard = (set: BackendPracticeQuizSummary) => (
    <TouchableOpacity
      key={set.id}
      style={[
        styles.libraryCardCompact,
        {
          backgroundColor: isDark ? "#0E1A2C" : "rgba(255,255,255,0.84)",
          borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
        },
      ]}
      onPress={() => openSavedPracticeSet(set)}
    >
      <View style={styles.libraryHeader}>
        <Text
          style={[
            styles.libraryTitle,
            { color: isDark ? "#F4F7FB" : "#1A202C" },
          ]}
        >
          {set.title}
        </Text>
        <View
          style={[
            styles.libraryBadge,
            set.source === "teacher" ? styles.teacherBadge : styles.aiBadge,
          ]}
        >
          <Text
            style={[
              styles.libraryBadgeText,
              set.source === "teacher"
                ? styles.teacherBadgeText
                : styles.aiBadgeText,
            ]}
          >
            {set.source}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.libraryMeta, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}
      >
        {set.questionCount} • {formatDisplayDate(set.createdAt) || copy.recently}
      </Text>
    </TouchableOpacity>
  );

  const renderSession = () => {
    if (!session) return null;
    const question = session.set.questions[session.currentIndex];
    const answer = session.answers[session.currentIndex];
    const correctCount = Object.values(session.answers).filter(
      (item) => item.isCorrect,
    ).length;
    const progress = Math.round(
      (Object.keys(session.answers).length / session.set.questions.length) *
        100,
    );

    return (
      <View
        style={[
          styles.sessionCard,
          {
            backgroundColor: isDark ? "#0E1A2C" : "rgba(255,255,255,0.84)",
            borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
          },
        ]}
      >
        <View style={styles.sessionHeader}>
          <Text
            style={[
              styles.sessionTitle,
              { color: isDark ? "#F4F7FB" : "#1A202C" },
            ]}
          >
            {session.set.title}
          </Text>
          <View style={styles.timerPill}>
            <Ionicons name="timer" size={14} color="white" />
            <Text style={styles.timerText}>{session.timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text
            style={[
              styles.progressText,
              { color: isDark ? "#AAB7CF" : "#5A6C87" },
            ]}
          >
            {progress}% {copy.complete}
          </Text>
          <Text
            style={[
              styles.scoreText,
              { color: isDark ? "#F4F7FB" : "#1A202C" },
            ]}
          >
            {copy.score}: {correctCount}/{session.set.questions.length}
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? "#17253A" : "#EAF0FA" },
          ]}
        >
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {!session.isComplete ? (
          <>
            <Text style={styles.questionMeta}>
              {copy.question} {session.currentIndex + 1} {copy.of}{" "}
              {session.set.questions.length}
            </Text>
            <Text style={styles.questionText}>{question.question}</Text>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{question.type}</Text>
            </View>

            {question.type === "short" ? (
              <>
                <View style={styles.shortAnswerRow}>
                  <TextInput
                    value={shortAnswerInput}
                    onChangeText={setShortAnswerInput}
                    placeholder={copy.typeYourAnswer}
                    placeholderTextColor={isDark ? "#7D8CA8" : COLORS.textLight}
                    style={[
                      styles.practiceInput,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#FFFFFF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                        color: isDark ? "#F4F7FB" : "#1A202C",
                      },
                    ]}
                    editable={!answer}
                  />
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={submitShortAnswer}
                    disabled={!!answer}
                  >
                    <Text style={styles.primaryActionText}>{copy.check}</Text>
                  </TouchableOpacity>
                </View>
                {!!answer && (
                  <TouchableOpacity
                    style={[
                      styles.flipCard,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                      },
                    ]}
                    onPress={() =>
                      updateAnswerState({ cardFlipped: !answer.cardFlipped })
                    }
                  >
                    <Text
                      style={[
                        styles.flipCardLabel,
                        { color: isDark ? "#BFD6FF" : "#35507E" },
                      ]}
                    >
                      {answer.cardFlipped
                        ? copy.answerRevealed
                        : copy.tapToFlip}
                    </Text>
                    <Text
                      style={[
                        styles.flipCardText,
                        { color: isDark ? "#F4F7FB" : "#1A202C" },
                      ]}
                    >
                      {answer.cardFlipped
                        ? `${copy.expectedAnswer}: ${question.answer}`
                        : `${copy.yourAnswer}: ${answer.selected}`}
                    </Text>
                    <Text
                      style={[
                        styles.flipCardHint,
                        { color: isDark ? "#AAB7CF" : "#5A6C87" },
                      ]}
                    >
                      {answer.cardFlipped
                        ? question.explanation
                        : copy.flipHint}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.optionList}>
                {(question.options || []).map((option) => {
                  const isSelected = answer?.selected === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: isDark ? "#121C2E" : "#FFFFFF",
                          borderColor: isDark ? "#2E4368" : "#D6E4FF",
                        },
                        isSelected && styles.optionSelected,
                        isSelected && answer?.isCorrect && styles.optionCorrect,
                        isSelected && !answer?.isCorrect && styles.optionWrong,
                      ]}
                      onPress={() => submitChoice(option)}
                      disabled={!!answer}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: isDark ? "#F4F7FB" : "#1A202C" },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!!answer && (
              <>
                <View
                  style={[
                    styles.answerBar,
                    {
                      backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                      borderColor: isDark ? "#2E4368" : "#D6E4FF",
                    },
                  ]}
                >
                  <Text
                    style={
                      answer.isCorrect ? styles.correctText : styles.wrongText
                    }
                  >
                    {answer.isCorrect
                      ? copy.correct
                      : `${copy.correctAnswer}: ${question.answer}`}
                  </Text>
                  <View style={styles.answerActions}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryAction,
                        {
                          backgroundColor: isDark ? "#17253A" : "#EEF5FF",
                          borderColor: isDark ? "#2E4368" : "#D6E4FF",
                        },
                      ]}
                      onPress={() =>
                        updateAnswerState({ revealHint: !answer.revealHint })
                      }
                    >
                      <Text style={styles.secondaryActionText}>
                        {copy.hint}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.darkAction,
                        {
                          backgroundColor: isDark ? "#2A2217" : "#FFF4E5",
                          borderColor: isDark ? "#5B4520" : "#FFD5A1",
                        },
                      ]}
                      onPress={() =>
                        updateAnswerState({
                          revealExplanation: !answer.revealExplanation,
                        })
                      }
                    >
                      <Text style={styles.darkActionText}>{copy.explain}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {answer.revealHint && (
                  <View
                    style={[
                      styles.hintBox,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.hintText,
                        { color: isDark ? "#AAB7CF" : "#5A6C87" },
                      ]}
                    >
                      {question.explanation.split(".")[0].trim()}.
                    </Text>
                  </View>
                )}
                {answer.revealExplanation && (
                  <View
                    style={[
                      styles.explainBox,
                      {
                        backgroundColor: isDark ? "#121C2E" : "#F7FAFF",
                        borderColor: isDark ? "#2E4368" : "#D6E4FF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.explainText,
                        { color: isDark ? "#F4F7FB" : "#1A202C" },
                      ]}
                    >
                      {question.explanation}
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.primaryAction, !answer && styles.disabledAction]}
              onPress={advanceQuestion}
              disabled={!answer}
            >
              <Text style={styles.primaryActionText}>{copy.nextQuestion}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.completeWrap}>
            <Ionicons name="trophy" size={34} color={COLORS.primary} />
            <Text
              style={[styles.completeTitle, { color: isDark ? "#F4F7FB" : "#1A202C" }]}
            >
              {copy.sessionComplete}
            </Text>
            <Text
              style={[styles.completeText, { color: isDark ? "#AAB7CF" : "#5A6C87" }]}
            >
              {copy.score}: {correctCount}/{session.set.questions.length}
            </Text>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={retryIncorrect}
            >
              <Text style={styles.primaryActionText}>
                {copy.retryIncorrect}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#08111F" : "#FFFFFF" },
      ]}
    >
      <View pointerEvents="none" style={styles.bgGlowBlue} />
      <View pointerEvents="none" style={styles.bgGlowGold} />
      <View pointerEvents="none" style={styles.bgGlowSky} />

      <ScrollView
        style={styles.container}
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
        <View
          style={[
            styles.homeBadgeCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255, 255, 255, 0.94)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.16)",
            },
          ]}
        >
          <View style={styles.homeBadgeRow}>
            <Ionicons name="sparkles-outline" size={15} color="#0B5FFF" />
            <Text style={[styles.homeBadgeText, { color: isDark ? "#F4F7FB" : "#1A202C" }]}> 
              {copy.practiceHub}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.generatorCard,
            {
              backgroundColor: isDark ? "#0E1A2C" : "rgba(255,255,255,0.84)",
              borderColor: isDark ? "#22324E" : "rgba(11, 95, 255, 0.12)",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>
            {copy.generateNewSet}
          </Text>

          <Text style={[styles.label, { color: isDark ? "#AAB7CF" : "#5B6B86" }]}>{copy.subject}</Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              {
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
              },
            ]}
            onPress={() => {
              setSubjectDropdownOpen((prev) => !prev);
              setTypeDropdownOpen(false);
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.dropdownTriggerText, { color: isDark ? "#F4F7FB" : "#2E4A86" }]}>
              {formatSubject(subject)}
            </Text>
            <Ionicons
              name={subjectDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={isDark ? "#BFD6FF" : "#35507E"}
            />
          </TouchableOpacity>
          {subjectDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  borderColor: isDark ? "#2E4368" : "#D6E4FF",
                  backgroundColor: isDark ? "#0F1D33" : "rgba(255,255,255,0.96)",
                },
              ]}
            >
              {SUBJECTS.map((item) => {
                const active = subject === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.dropdownItem,
                      {
                        borderBottomColor: isDark ? "#22324E" : "#ECF2FF",
                      },
                      active && styles.dropdownItemActive,
                      active && {
                        backgroundColor: isDark ? "#17253A" : "#EEF4FF",
                      },
                    ]}
                    onPress={() => {
                      setSubject(item);
                      setSubjectDropdownOpen(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: isDark ? "#BFD6FF" : "#35507E" },
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {formatSubject(item)}
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

          <Text style={styles.label}>{copy.questionType}</Text>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              {
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
              },
            ]}
            onPress={() => {
              setTypeDropdownOpen((prev) => !prev);
              setSubjectDropdownOpen(false);
            }}
            activeOpacity={0.9}
          >
            <Text
              style={[styles.dropdownTriggerText, { color: isDark ? "#F4F7FB" : "#2E4A86" }]}
              numberOfLines={1}
            >
              {selectedTypeLabel || copy.selectQuestionType}
            </Text>
            <Ionicons
              name={typeDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={isDark ? "#BFD6FF" : "#35507E"}
            />
          </TouchableOpacity>
          {typeDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  borderColor: isDark ? "#2E4368" : "#D6E4FF",
                  backgroundColor: isDark ? "#0F1D33" : "rgba(255,255,255,0.96)",
                },
              ]}
            >
              {QUESTION_TYPES.map((type) => {
                const active = questionTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      {
                        borderBottomColor: isDark ? "#22324E" : "#ECF2FF",
                      },
                      active && styles.dropdownItemActive,
                      active && {
                        backgroundColor: isDark ? "#17253A" : "#EEF4FF",
                      },
                    ]}
                    onPress={() => toggleQuestionType(type)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: isDark ? "#BFD6FF" : "#35507E" },
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {questionTypeLabel(type)}
                    </Text>
                    <Ionicons
                      name={active ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={active ? "#0B5FFF" : "#9BAECC"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.label, { color: isDark ? "#AAB7CF" : "#5B6B86" }]}>{copy.topicArea}</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder={copy.topicPlaceholder}
            placeholderTextColor={isDark ? "#7D8CA8" : COLORS.textLight}
            style={[
              styles.practiceInput,
              {
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
                color: isDark ? "#F4F7FB" : COLORS.text,
              },
            ]}
          />

          <Text style={[styles.label, { color: isDark ? "#AAB7CF" : "#5B6B86" }]}>{copy.numberOfQuestions}</Text>
          <TextInput
            value={questionCount}
            onChangeText={setQuestionCount}
            placeholder="5"
            placeholderTextColor={isDark ? "#7D8CA8" : COLORS.textLight}
            keyboardType="numeric"
            style={[
              styles.practiceInput,
              {
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
                color: isDark ? "#F4F7FB" : COLORS.text,
              },
            ]}
          />

          {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleStartPractice}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="white" />
                <Text style={styles.generateButtonText}>
                  {copy.startPractice}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderSession()}

        <View style={styles.librarySection}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>
            {copy.filterQuizzes}
          </Text>
          <TouchableOpacity
            style={[
              styles.quizFilterTrigger,
              {
                backgroundColor: isDark ? "#121C2E" : "#F5F8FF",
                borderColor: isDark ? "#2E4368" : "#D6E4FF",
              },
            ]}
            onPress={() => setQuizFilterDropdownOpen((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.quizFilterTriggerText,
                { color: isDark ? "#BFD6FF" : "#35507E" },
              ]}
            >
              {quizSubjectFilter === "all"
                ? copy.allSubjects
                : formatSubject(quizSubjectFilter)}
            </Text>
            <Ionicons
              name={quizFilterDropdownOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? "#BFD6FF" : "#35507E"}
            />
          </TouchableOpacity>
          {quizFilterDropdownOpen ? (
            <View
              style={[
                styles.quizFilterMenu,
                {
                  backgroundColor: isDark ? "#121C2E" : "#FFFFFF",
                  borderColor: isDark ? "#2E4368" : "#D6E4FF",
                },
              ]}
            >
              {(["all", ...SUBJECTS] as const).map((item) => {
                const active = quizSubjectFilter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.quizFilterItem,
                      active && {
                        backgroundColor: isDark
                          ? "rgba(11,95,255,0.24)"
                          : "#EAF2FF",
                      },
                    ]}
                    onPress={() => {
                      setQuizSubjectFilter(item);
                      setQuizFilterDropdownOpen(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.quizFilterItemText,
                        { color: isDark ? "#D5E5FF" : "#1A202C" },
                      ]}
                    >
                      {item === "all" ? copy.allSubjects : formatSubject(item)}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={16} color="#0B5FFF" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.librarySection}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>
            {copy.teacherBank}
          </Text>
          {isFetchingLibrary ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                  borderColor: isDark ? "#22324E" : "#DCE9FC",
                },
              ]}
            >
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {copy.loadingTeacher}
              </Text>
            </View>
          ) : groupedTeacherSets.length > 0 ? (
            groupedTeacherSets.map((group) => (
              <View key={group.subject} style={styles.subjectGroupWrap}>
                <Text
                  style={[
                    styles.subjectGroupTitle,
                    { color: isDark ? "#BFD6FF" : "#35507E" },
                  ]}
                >
                  {formatSubject(group.subject)}
                </Text>
                {group.items.map(renderLibraryCard)}
              </View>
            ))
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                  borderColor: isDark ? "#22324E" : "#DCE9FC",
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {copy.noTeacher}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.librarySection}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F4F7FB" : "#1A202C" }]}>
            {copy.savedSets}
          </Text>
          {isFetchingSaved ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                  borderColor: isDark ? "#22324E" : "#DCE9FC",
                },
              ]}
            >
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {copy.loadingSaved}
              </Text>
            </View>
          ) : groupedSavedSets.length > 0 ? (
            groupedSavedSets.map((group) => (
              <View key={group.subject} style={styles.subjectGroupWrap}>
                <Text
                  style={[
                    styles.subjectGroupTitle,
                    { color: isDark ? "#BFD6FF" : "#35507E" },
                  ]}
                >
                  {formatSubject(group.subject)}
                </Text>
                {group.items.map(renderLibraryCard)}
              </View>
            ))
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? "#0E1A2C" : "#FFFFFF",
                  borderColor: isDark ? "#22324E" : "#DCE9FC",
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyText,
                  { color: isDark ? "#AAB7CF" : "#60779E" },
                ]}
              >
                {copy.noBackendQuiz}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F9FF",
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    gap: 16,
  },
  homeBadgeCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#0E234E",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  homeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  homeBadgeText: {
    fontSize: 18,
    fontWeight: "800",
  },
  generatorCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A202C",
  },
  label: {
    marginTop: 4,
    color: "#5B6B86",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
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
    textTransform: "capitalize",
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
    textTransform: "capitalize",
  },
  dropdownItemTextActive: {
    color: "#0B5FFF",
  },
  practiceInput: {
    backgroundColor: "#F5F8FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
  },
  generateButton: {
    marginTop: 6,
    backgroundColor: "#0B5FFF",
    borderRadius: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#0B5FFF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  generateButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  errorText: {
    color: COLORS.error,
    fontWeight: "600",
  },
  librarySection: {
    gap: 10,
  },
  quizFilterTrigger: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizFilterTriggerText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  quizFilterMenu: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -4,
  },
  quizFilterItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizFilterItemText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  filterChipRow: {
    gap: 8,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  subjectGroupWrap: {
    gap: 8,
  },
  subjectGroupTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  libraryCardCompact: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  libraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  libraryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  libraryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  teacherBadge: {
    backgroundColor: "#E8F6EC",
  },
  aiBadge: {
    backgroundColor: "#EDF3FF",
  },
  libraryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  teacherBadgeText: {
    color: "#335A32",
  },
  aiBadgeText: {
    color: "#2E4A86",
  },
  libraryMeta: {
    marginTop: 8,
    color: "#5B6B86",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
  },
  emptyText: {
    color: COLORS.textLight,
  },
  sessionCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(11, 95, 255, 0.12)",
    shadowColor: "#0E234E",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sessionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1A202C",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: {
    color: "white",
    fontWeight: "700",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    color: "#5B6B86",
    fontSize: 12,
    fontWeight: "700",
  },
  scoreText: {
    color: "#2F7A3E",
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E6ECF8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  questionMeta: {
    color: "#5B6B86",
    fontSize: 12,
    fontWeight: "700",
  },
  questionText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typePillText: {
    color: "#2E4A86",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  optionList: {
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#D7E0F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFF",
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#E9F0FF",
  },
  optionCorrect: {
    borderColor: "#2F7A3E",
    backgroundColor: "#E8F6EC",
  },
  optionWrong: {
    borderColor: "#D04646",
    backgroundColor: "#FDECEC",
  },
  optionText: {
    color: "#223452",
    fontWeight: "600",
  },
  shortAnswerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  primaryAction: {
    backgroundColor: "#0B5FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "white",
    fontWeight: "700",
  },
  disabledAction: {
    backgroundColor: "#9BAECC",
  },
  flipCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F0D89C",
  },
  flipCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#8A6418",
  },
  flipCardText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#46330D",
  },
  flipCardHint: {
    marginTop: 6,
    color: "#6E5421",
    lineHeight: 20,
  },
  answerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  correctText: {
    color: "#2F7A3E",
    fontWeight: "700",
  },
  wrongText: {
    color: "#C83E3E",
    fontWeight: "700",
    flex: 1,
  },
  answerActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: "#F0F5FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#D9E6FF",
  },
  secondaryActionText: {
    color: "#2E4A86",
    fontWeight: "700",
    fontSize: 12,
  },
  darkAction: {
    backgroundColor: "#0B5FFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkActionText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  hintBox: {
    backgroundColor: "#F1F7FF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDEBFF",
  },
  hintText: {
    color: "#2E4A86",
    lineHeight: 20,
  },
  explainBox: {
    backgroundColor: "#F1F7FF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DDEBFF",
  },
  explainText: {
    color: "#2E4A86",
    lineHeight: 20,
  },
  completeWrap: {
    alignItems: "center",
    gap: 8,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A202C",
  },
  completeText: {
    color: COLORS.textLight,
  },
});
