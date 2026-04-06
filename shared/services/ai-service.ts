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

// Python service endpoints used by practice/grade flows
const PYTHON_API_BASE_URL =
  process.env.EXPO_PUBLIC_PYTHON_API_BASE_URL || `http://${API_HOST}:8000`;
const CHAT_API_URL = `${NODE_API_BASE_URL}/api/ai/chat`;
const CHAT_STREAM_API_URL = `${NODE_API_BASE_URL}/api/ai/chat/stream`;
const CHAT_HISTORY_URL = (sessionId: string) =>
  `${NODE_API_BASE_URL}/api/ai/sessions/${sessionId}/messages`;
const PRACTICE_URL = `${PYTHON_API_BASE_URL}/practice`;
const GRADE_URL = `${PYTHON_API_BASE_URL}/grade`;
const LIQUID_FALLBACK_BASE_URL = `http://${API_HOST}:8001`;

const buildAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!token) {
    return headers;
  }

  headers.Authorization = `Bearer ${token}`;
  headers["x-auth-token"] = token;
  return headers;
};

const buildChatHeaders = (): Record<string, string> => {
  return buildAuthHeaders();
};

const unique = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || seen.has(item)) return false;
    seen.add(item);
    return true;
  });
};

const connectTimeoutMs = 2500;
let lastInternetCheckAt = 0;
let lastInternetCheckResult: boolean | null = null;

const isOnlineNow = async () => {
  const now = Date.now();
  if (lastInternetCheckResult !== null && now - lastInternetCheckAt < 30000) {
    return lastInternetCheckResult;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), connectTimeoutMs);

  try {
    const response = await fetch("https://clients3.google.com/generate_204", {
      method: "GET",
      signal: controller.signal,
    });
    const isOnline = response.ok || response.status === 204;
    lastInternetCheckAt = now;
    lastInternetCheckResult = isOnline;
    return isOnline;
  } catch {
    lastInternetCheckAt = now;
    lastInternetCheckResult = false;
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

const getChatEndpointCandidates = async (stream = false) => {
  const suffix = stream ? "/chat/stream" : "/chat";
  const nodeEndpoint = stream ? CHAT_STREAM_API_URL : CHAT_API_URL;
  const pythonEndpoint = `${PYTHON_API_BASE_URL}${suffix}`;
  const liquidEndpoint = `${LIQUID_FALLBACK_BASE_URL}${suffix}`;

  const online = await isOnlineNow();
  if (!online) {
    return unique([liquidEndpoint]);
  }

  return unique([nodeEndpoint, liquidEndpoint]);
};

const parseSessionIdFromHeaders = (response: Response) => {
  const sessionIdFromHeader = response.headers.get("x-session-id");
  if (sessionIdFromHeader && sessionIdFromHeader.trim()) {
    currentChatSessionId = sessionIdFromHeader.trim();
  }
};

const parseSessionIdFromBody = (data: unknown) => {
  if (!data || typeof data !== "object") return;
  const record = data as Record<string, unknown>;
  const sessionId = record.session_id;
  if (typeof sessionId === "string" && sessionId.trim()) {
    currentChatSessionId = sessionId.trim();
  }
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

const isIntegrationFallbackText = (text: string) => {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes("ai response pipeline is ready for integration") ||
    normalized.includes("pipeline is ready for integration")
  );
};

const normalizeTutorResponse = (text: string) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n");

  cleaned = cleaned.replace(/^\s*(Explanation|Example|Summary|Practice Question)\s*:\s*/gim, "");
  cleaned = cleaned.replace(/^\s*-\s+/gm, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, arr) => line.length > 0 || (index > 0 && arr[index - 1].length > 0));

  cleaned = lines.join("\n").trim();
  return cleaned || text.trim();
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

export const setChatSessionId = (sessionId: string | null) => {
  currentChatSessionId =
    typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : null;
};

export const clearChatSessionId = () => {
  currentChatSessionId = null;
};

const extractSessionId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const rootSessionId = record.session_id;
  if (typeof rootSessionId === "string" && rootSessionId.trim()) {
    return rootSessionId.trim();
  }

  const data = record.data;
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    const nestedSessionId = dataRecord.session_id;
    if (typeof nestedSessionId === "string" && nestedSessionId.trim()) {
      return nestedSessionId.trim();
    }
  }

  return null;
};

const extractPersistedMessages = (payload: unknown): PersistedChatMessage[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as PersistedChatMessage[];
  }

  if (Array.isArray(record.messages)) {
    return record.messages as PersistedChatMessage[];
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const nestedRecord = nested as Record<string, unknown>;
    if (Array.isArray(nestedRecord.messages)) {
      return nestedRecord.messages as PersistedChatMessage[];
    }
  }

  return [];
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
  const studentProfile = buildStudentProfilePayload();
  const payload = JSON.stringify(
    withSessionPayload({
      question: userPrompt,
      grade: studentProfile.grade,
      subject,
      history,
      student_profile: studentProfile,
    }),
  );

  const endpoints = await getChatEndpointCandidates(false);

  try {
    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: buildChatHeaders(),
          body: payload,
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const data = await response.json();
        parseSessionIdFromBody(data);
        if (typeof data?.response === "string") {
          if (isIntegrationFallbackText(data.response)) {
            continue;
          }
          return normalizeTutorResponse(data.response);
        }
        if (typeof data?.message === "string") {
          if (isIntegrationFallbackText(data.message)) {
            continue;
          }
          return normalizeTutorResponse(data.message);
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No chat endpoint is available.");
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
  const studentProfile = buildStudentProfilePayload();
  const payload = JSON.stringify(
    withSessionPayload({
      question: userPrompt,
      grade: studentProfile.grade,
      subject,
      history,
      student_profile: studentProfile,
    }),
  );

  const endpoints = await getChatEndpointCandidates(true);

  try {
    let lastError: unknown = null;
    for (const endpoint of endpoints) {
      try {
        const isNodeStreamEndpoint = endpoint === CHAT_STREAM_API_URL;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: buildChatHeaders(),
          body: payload,
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        parseSessionIdFromHeaders(response);

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
            if (!isNodeStreamEndpoint) {
              onChunk(chunk);
            }
          }
        }

        const flushed = decoder.decode();
        if (flushed) {
          fullText += flushed;
          if (!isNodeStreamEndpoint) {
            onChunk(flushed);
          }
        }

        const trimmed = fullText.trim();
        if (!trimmed) {
          return await generateAIResponse(userPrompt, subject, history);
        }

        if (isIntegrationFallbackText(trimmed)) {
          continue;
        }

        const normalized = normalizeTutorResponse(trimmed);

        if (isNodeStreamEndpoint) {
          onChunk(normalized);
        }

        return normalized;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No streaming endpoint is available.");
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
  const online = await isOnlineNow();
  if (!online) {
    return [] as PersistedChatMessage[];
  }

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
  const extractedSessionId = extractSessionId(data);
  if (extractedSessionId) {
    setChatSessionId(extractedSessionId);
  }

  const messages = extractPersistedMessages(data);
  return Array.isArray(messages)
    ? messages
    : ([] as PersistedChatMessage[]);
};
