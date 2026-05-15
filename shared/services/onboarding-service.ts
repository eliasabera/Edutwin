import type { SubjectName } from "../types/domain.types";
import { supabase } from "./supabase-client";

export type OnboardingQuestion = {
  id: string;
  subject: SubjectName;
  unit?: string | null;
  topic?: string | null;
  text: string;
  options: string[];
  correctIndex: number;
};

const normalizeSubjectName = (value: unknown): SubjectName | null => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "biology") return "biology";
  if (normalized === "chemistry") return "chemistry";
  if (normalized === "physics") return "physics";
  if (normalized === "math" || normalized === "mathematics" || normalized === "maths") {
    return "math";
  }
  return null;
};

const resolveCorrectIndex = (
  correctOption: unknown,
  options: string[],
): number | null => {
  const normalized = String(correctOption || "").trim().toUpperCase();
  const letterIndex = ["A", "B", "C", "D"].indexOf(normalized);
  if (letterIndex >= 0 && letterIndex < options.length) {
    return letterIndex;
  }

  const matchIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === normalized.toLowerCase(),
  );
  return matchIndex >= 0 ? matchIndex : null;
};

export const fetchOnboardingQuestions = async (
  gradeLevel: number,
): Promise<OnboardingQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from("onboarding_questions")
      .select(
        "question_code, subject, unit, topic, question_text, options, correct_option, order_index",
      )
      .eq("grade_level", gradeLevel)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || [])
      .map((row) => {
        const subject = normalizeSubjectName(row.subject);
        if (!subject) {
          return null;
        }

        const options = Array.isArray(row.options)
          ? row.options.map((option) => String(option || "").trim())
          : [];
        const correctIndex = resolveCorrectIndex(row.correct_option, options);

        if (!options.length || correctIndex === null) {
          return null;
        }

        return {
          id: String(row.question_code || ""),
          subject,
          unit: typeof row.unit === "string" ? row.unit : null,
          topic: typeof row.topic === "string" ? row.topic : null,
          text: String(row.question_text || "").trim(),
          options,
          correctIndex,
        } as OnboardingQuestion;
      })
      .filter(Boolean) as OnboardingQuestion[];
  } catch {
    return [];
  }
};
