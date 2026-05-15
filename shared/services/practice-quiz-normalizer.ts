export type NormalizedPracticeQuestion = {
  id?: string;
  type: "mcq" | "true_false" | "short";
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
  explanation?: string;
};

type RawPracticeQuestion = {
  id?: string;
  type?: string;
  question?: string;
  answer?: string;
  options?: string[] | null;
  hint?: string | null;
  explanation?: string | null;
  question_type?: string | null;
  question_text?: string | null;
  correct_answer?: string | null;
  order_index?: number | null;
};

const normalizeQuestionType = (value: string | null | undefined) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "mcq" || normalized === "multiple_choice") return "mcq";
  if (normalized === "true_false" || normalized === "truefalse") {
    return "true_false";
  }
  if (normalized === "short" || normalized === "short_answer") return "short";
  if (normalized === "tf" || normalized === "boolean") return "true_false";
  return null;
};

const normalizeOptions = (
  type: NormalizedPracticeQuestion["type"],
  options?: string[] | null,
) => {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((option) => String(option || "").trim()).filter(Boolean);
  }
  if (type === "true_false") {
    return ["True", "False"];
  }
  return undefined;
};

const normalizeText = (value: string | null | undefined) =>
  String(value || "").trim();

export const normalizePracticeQuestions = (
  items: unknown,
): NormalizedPracticeQuestion[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((raw) => raw as RawPracticeQuestion)
    .map((raw) => {
      const type =
        normalizeQuestionType(raw.type) ||
        normalizeQuestionType(raw.question_type) ||
        "short";

      const question = normalizeText(raw.question || raw.question_text);
      const answer = normalizeText(raw.answer || raw.correct_answer);
      const options = normalizeOptions(type, raw.options);
      const hint = normalizeText(raw.hint || undefined);
      const explanation = normalizeText(raw.explanation || undefined);

      return {
        id: raw.id,
        type,
        question,
        answer,
        options,
        hint: hint || undefined,
        explanation: explanation || undefined,
      } as NormalizedPracticeQuestion;
    })
    .filter((item) => item.question && item.answer);
};
