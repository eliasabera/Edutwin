import { COLORS } from "@/shared/constants/colors";
import {
  generatePracticeQuestions,
  type PracticeResponse,
} from "@/shared/services/ai-service";
import { recordPracticeCompletion } from "@/shared/services/gamification";
import {
  saveGeneratedPracticeSet,
  usePracticeLibrary,
  type PracticeQuestionType,
  type PracticeSet,
} from "@/shared/store/practice-store";
import { useStudentProfile } from "@/shared/store/user-store";
import type { SubjectName } from "@/shared/types/domain.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
const QUESTION_TYPES: Array<[PracticeQuestionType, string]> = [
  ["mcq", "MCQ"],
  ["true_false", "True/False"],
  ["short", "Short answer"],
];

export default function PracticeHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const studentProfile = useStudentProfile();
  const { teacherPracticeSets, generatedPracticeSets } = usePracticeLibrary();
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
  const [errorText, setErrorText] = useState("");
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState("");

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

  const selectedTypeLabel = QUESTION_TYPES.filter(([type]) =>
    questionTypes.includes(type),
  )
    .map(([, label]) => label)
    .join(", ");

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
          `No practice was generated for ${subject}. Try the exact Grade ${studentProfile.grade} textbook topic.`,
      );
      return;
    }

    const newSet: Omit<PracticeSet, "id" | "createdAt" | "source"> = {
      title: `${subject.toUpperCase()} personalized practice`,
      subject,
      topic: topic.trim() || subject,
      questionTypes,
      questionCount: response.questions.length,
      performanceBand: studentProfile.performanceBand,
      questions: response.questions,
    };

    saveGeneratedPracticeSet(newSet);
    router.push({
      pathname: "../interactive-quiz",
      params: {
        questions: JSON.stringify(response.questions),
      },
    });
  };

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

  const renderLibraryCard = (set: PracticeSet) => (
    <TouchableOpacity
      key={set.id}
      style={styles.libraryCard}
      onPress={() => startSession(set)}
    >
      <View style={styles.libraryHeader}>
        <Text style={styles.libraryTitle}>{set.title}</Text>
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
      <Text style={styles.libraryMeta}>
        {set.subject.toUpperCase()} • {set.questionCount} questions •{" "}
        {set.createdAt}
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
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{session.set.title}</Text>
          <View style={styles.timerPill}>
            <Ionicons name="timer" size={14} color="white" />
            <Text style={styles.timerText}>{session.timeLeft}s</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{progress}% complete</Text>
          <Text style={styles.scoreText}>
            Score: {correctCount}/{session.set.questions.length}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {!session.isComplete ? (
          <>
            <Text style={styles.questionMeta}>
              Question {session.currentIndex + 1} of{" "}
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
                    placeholder="Type your answer"
                    placeholderTextColor={COLORS.textLight}
                    style={styles.practiceInput}
                    editable={!answer}
                  />
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={submitShortAnswer}
                    disabled={!!answer}
                  >
                    <Text style={styles.primaryActionText}>Check</Text>
                  </TouchableOpacity>
                </View>
                {!!answer && (
                  <TouchableOpacity
                    style={styles.flipCard}
                    onPress={() =>
                      updateAnswerState({ cardFlipped: !answer.cardFlipped })
                    }
                  >
                    <Text style={styles.flipCardLabel}>
                      {answer.cardFlipped
                        ? "Answer revealed"
                        : "Tap to flip answer card"}
                    </Text>
                    <Text style={styles.flipCardText}>
                      {answer.cardFlipped
                        ? `Expected answer: ${question.answer}`
                        : `Your answer: ${answer.selected}`}
                    </Text>
                    <Text style={styles.flipCardHint}>
                      {answer.cardFlipped
                        ? question.explanation
                        : "Flip to compare your answer with the textbook answer."}
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
                        isSelected && styles.optionSelected,
                        isSelected && answer?.isCorrect && styles.optionCorrect,
                        isSelected && !answer?.isCorrect && styles.optionWrong,
                      ]}
                      onPress={() => submitChoice(option)}
                      disabled={!!answer}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!!answer && (
              <>
                <View style={styles.answerBar}>
                  <Text
                    style={
                      answer.isCorrect ? styles.correctText : styles.wrongText
                    }
                  >
                    {answer.isCorrect
                      ? "Correct"
                      : `Correct answer: ${question.answer}`}
                  </Text>
                  <View style={styles.answerActions}>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={() =>
                        updateAnswerState({ revealHint: !answer.revealHint })
                      }
                    >
                      <Text style={styles.secondaryActionText}>Hint</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.darkAction}
                      onPress={() =>
                        updateAnswerState({
                          revealExplanation: !answer.revealExplanation,
                        })
                      }
                    >
                      <Text style={styles.darkActionText}>Explain</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {answer.revealHint && (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      {question.explanation.split(".")[0].trim()}.
                    </Text>
                  </View>
                )}
                {answer.revealExplanation && (
                  <View style={styles.explainBox}>
                    <Text style={styles.explainText}>
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
              <Text style={styles.primaryActionText}>Next question</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.completeWrap}>
            <Ionicons name="trophy" size={34} color={COLORS.primary} />
            <Text style={styles.completeTitle}>Session complete</Text>
            <Text style={styles.completeText}>
              Score: {correctCount}/{session.set.questions.length}
            </Text>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={retryIncorrect}
            >
              <Text style={styles.primaryActionText}>Retry incorrect only</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
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
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <Ionicons name="sparkles-outline" size={14} color="#0B5FFF" />
            <Text style={styles.heroBadge}>Practice Hub</Text>
          </View>
          <Text style={styles.heroTitle}>Personalized Question Generation</Text>
        </View>

        <View style={styles.generatorCard}>
          <Text style={styles.sectionTitle}>Generate new set</Text>

          <Text style={styles.label}>Subject</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setSubjectDropdownOpen((prev) => !prev);
              setTypeDropdownOpen(false);
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.dropdownTriggerText}>{subject}</Text>
            <Ionicons
              name={subjectDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#35507E"
            />
          </TouchableOpacity>
          {subjectDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {SUBJECTS.map((item) => {
                const active = subject === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.dropdownItem,
                      active && styles.dropdownItemActive,
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
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item}
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

          <Text style={styles.label}>Question type</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => {
              setTypeDropdownOpen((prev) => !prev);
              setSubjectDropdownOpen(false);
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.dropdownTriggerText} numberOfLines={1}>
              {selectedTypeLabel || "Select question type"}
            </Text>
            <Ionicons
              name={typeDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="#35507E"
            />
          </TouchableOpacity>
          {typeDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {QUESTION_TYPES.map(([type, label]) => {
                const active = questionTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.dropdownItem,
                      active && styles.dropdownItemActive,
                    ]}
                    onPress={() => toggleQuestionType(type)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        active && styles.dropdownItemTextActive,
                      ]}
                    >
                      {label}
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

          <Text style={styles.label}>Topic or area</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="Optional topic, for example Mitosis"
            placeholderTextColor={COLORS.textLight}
            style={styles.practiceInput}
          />

          <Text style={styles.label}>Number of questions</Text>
          <TextInput
            value={questionCount}
            onChangeText={setQuestionCount}
            placeholder="5"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            style={styles.practiceInput}
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
                <Text style={styles.generateButtonText}>Start Practice</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {renderSession()}

        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>Teacher question bank</Text>
          {teacherPracticeSets.map(renderLibraryCard)}
        </View>

        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>Saved personalized sets</Text>
          {generatedPracticeSets.length > 0 ? (
            generatedPracticeSets.map(renderLibraryCard)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No personalized sets yet. Generate your first set above.
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
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  heroBadgeRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E7F0FF",
  },
  heroBadge: {
    color: "#0B5FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#1A202C",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
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
  libraryCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 20,
    padding: 16,
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
