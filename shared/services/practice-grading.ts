import { gradePracticeAnswer, type GradePayload, type GradeResponse } from "./ai-service";

type GradeFallback = {
  isCorrect: boolean;
  feedback: string;
};

type GradeOptions = {
  timeoutMs?: number;
  fallback: GradeFallback;
};

export const gradePracticeAnswerWithTimeout = async (
  payload: GradePayload,
  options: GradeOptions,
): Promise<GradeResponse> => {
  const timeoutMs = options.timeoutMs ?? 4500;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<GradeResponse>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        is_correct: options.fallback.isCorrect,
        feedback: options.fallback.feedback,
      });
    }, timeoutMs);
  });

  try {
    return await Promise.race([gradePracticeAnswer(payload), timeoutPromise]);
  } catch {
    return {
      is_correct: options.fallback.isCorrect,
      feedback: options.fallback.feedback,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
