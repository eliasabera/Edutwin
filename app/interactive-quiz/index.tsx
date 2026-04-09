import InteractiveQuizScreen from "@/src/modules/practice/InteractiveQuizScreen";
import { useLocalSearchParams } from "expo-router";

type QuizQuestion = {
  id?: string;
  type: "mcq" | "true_false" | "short";
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
  explanation?: string;
};

export default function InteractiveQuizRoute() {
  const params = useLocalSearchParams<{ questions?: string; quizId?: string }>();

  let questions: QuizQuestion[] = [];
  const rawQuestions =
    typeof params.questions === "string" ? params.questions : "";
  if (rawQuestions) {
    try {
      const parsed = JSON.parse(rawQuestions);
      if (Array.isArray(parsed)) {
        questions = parsed as QuizQuestion[];
      }
    } catch {
      questions = [];
    }
  }

  const quizId = typeof params.quizId === "string" ? params.quizId : undefined;

  return <InteractiveQuizScreen route={{ params: { questions, quizId } }} />;
}
