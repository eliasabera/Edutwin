import { Platform } from "react-native";
import { getStudentProfile } from "../store/user-store";
import type { SubjectName } from "../types/domain.types";
import { getAuthToken } from "./auth-service";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type PersistedChatMessage = {
  _id?: string;
  sender: "USER" | "AI";
  message_text: string;
  timestamp?: string;
};

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

// Node backend endpoints (protected by auth middleware)
const NODE_API_BASE_URL =
  process.env.EXPO_PUBLIC_NODE_API_BASE_URL || `http://${API_HOST}:5000`;
const CHAT_API_URL = `${NODE_API_BASE_URL}/api/ai/chat`;
const CHAT_STREAM_API_URL = `${NODE_API_BASE_URL}/api/ai/chat/stream`;
const CHAT_HISTORY_URL = (sessionId: string) =>
  `${NODE_API_BASE_URL}/api/ai/sessions/${sessionId}/messages`;

// Python service endpoints used by practice/grade flows
const PYTHON_API_BASE_URL =
  process.env.EXPO_PUBLIC_PYTHON_API_BASE_URL || `http://${API_HOST}:8000`;
const PRACTICE_URL = `${PYTHON_API_BASE_URL}/practice`;
const GRADE_URL = `${PYTHON_API_BASE_URL}/grade`;

const buildAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    return {
      "Content-Type": "application/json",
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-auth-token": token,
  };
};

const readErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore parsing errors and fall back to status text
  }

  return `Server Error: ${response.status}`;
};

const buildStudentProfilePayload = () => {
  const profile = getStudentProfile();
  return {
    full_name: profile.fullName,
    grade: profile.grade,
    mastery_score: profile.masteryScore,
    performance_band: profile.performanceBand,
    preferred_language: profile.preferredLanguage,
    twin_name: profile.twinName,
    support_subjects: profile.supportSubjects,
    strong_subjects: profile.strongSubjects,
  };
};

let currentChatSessionId: string | null = null;

export const getChatSessionId = () => currentChatSessionId;

export const clearChatSessionId = () => {
  currentChatSessionId = null;
};

const withSessionPayload = (payload: Record<string, unknown>) => {
  if (!currentChatSessionId) return payload;
  return {
    ...payload,
    session_id: currentChatSessionId,
  };
};

export const generateAIResponse = async (
  userPrompt: string,
  subject?: SubjectName,
  history: ChatHistoryItem[] = [],
): Promise<string> => {
  try {
    const studentProfile = buildStudentProfilePayload();
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify(
        withSessionPayload({
          question: userPrompt,
          grade: studentProfile.grade,
          subject,
          history,
          student_profile: studentProfile,
        }),
      ),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = await response.json();
    if (typeof data?.session_id === "string" && data.session_id.trim()) {
      currentChatSessionId = data.session_id.trim();
    }
    return data.response; // The text from Python
  } catch (error) {
    console.error("Connection Failed:", error);
    return "I cannot reach the EduTwin Server. Make sure python main.py is running.";
  }
};

export const generateAIResponseStream = async (
  userPrompt: string,
  onChunk: (chunk: string) => void,
  subject?: SubjectName,
  history: ChatHistoryItem[] = [],
): Promise<string> => {
  try {
    const studentProfile = buildStudentProfilePayload();
    const response = await fetch(CHAT_STREAM_API_URL, {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify(
        withSessionPayload({
          question: userPrompt,
          grade: studentProfile.grade,
          subject,
          history,
          student_profile: studentProfile,
        }),
      ),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const sessionIdFromHeader = response.headers.get("x-session-id");
    if (sessionIdFromHeader && sessionIdFromHeader.trim()) {
      currentChatSessionId = sessionIdFromHeader.trim();
    }

    if (!response.body) {
      const full = await response.text();
      if (full) onChunk(full);
      return full;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullText += chunk;
        onChunk(chunk);
      }
    }

    const flushed = decoder.decode();
    if (flushed) {
      fullText += flushed;
      onChunk(flushed);
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      return await generateAIResponse(userPrompt, subject, history);
    }

    return trimmed;
  } catch (error) {
    console.error("Streaming Failed:", error);
    const full = await generateAIResponse(userPrompt, subject, history);
    if (full) onChunk(full);
    return full;
  }
};

type PracticeQuestion = {
  type: "mcq" | "true_false" | "short";
  question: string;
  options?: string[];
  answer: string;
  hint: string;
  explanation: string;
};

export type PracticePayload = {
  subject?: "biology" | "chemistry" | "physics" | "math";
  topic: string;
  num_questions: number;
  types?: Array<"mcq" | "true_false" | "short">;
};

export type PracticeResponse = {
  questions: PracticeQuestion[];
  error?: string | null;
  subject?: string;
  grade?: string;
};

export type GradePayload = {
  question: string;
  question_type: "mcq" | "true_false" | "short";
  correct_answer: string;
  student_answer: string;
};

export type GradeResponse = {
  is_correct: boolean;
  feedback: string;
};

export const generatePracticeQuestions = async (
  payload: PracticePayload,
): Promise<PracticeResponse> => {
  try {
    const studentProfile = buildStudentProfilePayload();
    const response = await fetch(PRACTICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        grade: studentProfile.grade,
        student_profile: studentProfile,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      questions: data.questions || [],
      error: data.error,
      subject: data.subject,
      grade: data.grade,
    };
  } catch (error) {
    console.error("Practice Failed:", error);
    return {
      questions: [],
      error: "I could not generate textbook practice right now.",
    };
  }
};

export const gradePracticeAnswer = async (
  payload: GradePayload,
): Promise<GradeResponse> => {
  try {
    const response = await fetch(GRADE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      is_correct: Boolean(data?.is_correct),
      feedback:
        typeof data?.feedback === "string" && data.feedback.trim()
          ? data.feedback.trim()
          : "I checked your answer using the textbook rules.",
    };
  } catch (error) {
    console.error("Grade Failed:", error);
    return {
      is_correct: false,
      feedback: "I could not grade this answer right now.",
    };
  }
};

export const fetchChatHistory = async (sessionId?: string) => {
  const resolvedSessionId = sessionId || currentChatSessionId;
  if (!resolvedSessionId) {
    return [] as PersistedChatMessage[];
  }

  const response = await fetch(CHAT_HISTORY_URL(resolvedSessionId), {
    method: "GET",
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = await response.json();
  if (!Array.isArray(data?.data)) {
    return [] as PersistedChatMessage[];
  }

  return data.data as PersistedChatMessage[];
};
