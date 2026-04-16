import Constants from "expo-constants";
import { Platform } from "react-native";
import { getStudentProfile } from "../store/user-store";
import type { SubjectName } from "../types/domain.types";
import { getAuthToken } from "./auth-service";
import { classifyTutorPrompt, recordTutorInteraction, syncTwinProgress } from "./gamification";

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

const extractHostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.developer?.tool ||
    Constants.linkingUri;

  if (!hostUri) return null;

  const sanitized = String(hostUri)
    .replace(/^https?:\/\//, "")
    .replace(/^exp:\/\//, "")
    .split("/")[0]
    .trim();

  if (!sanitized) return null;

  const host = sanitized.includes(":")
    ? sanitized.slice(0, sanitized.lastIndexOf(":"))
    : sanitized;

  return host || null;
};

const resolveApiHost = () => {
  const explicitHost = process.env.EXPO_PUBLIC_AI_HOST?.trim();
  if (explicitHost) return explicitHost;

  const expoHost = extractHostFromExpo();
  if (expoHost) return expoHost;

  // Emulator fallback when no LAN host can be detected.
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const API_HOST = resolveApiHost();

// Node backend endpoints (protected by auth middleware)
const NODE_API_BASE_URL =
  process.env.EXPO_PUBLIC_NODE_API_BASE_URL || `http://${API_HOST}:5000`;

// Python service endpoints used by practice/grade flows
const PYTHON_API_BASE_URL =
  process.env.EXPO_PUBLIC_PYTHON_API_BASE_URL || `http://${API_HOST}:8000`;
const CHAT_API_URL = `${NODE_API_BASE_URL}/api/ai/chat`;
const CHAT_STREAM_API_URL = `${NODE_API_BASE_URL}/api/ai/chat/stream`;
const TEXTBOOK_ASSIST_URL = `${NODE_API_BASE_URL}/api/ai/textbook/assist`;
const CHAT_HISTORY_URL = (sessionId: string) =>
  `${NODE_API_BASE_URL}/api/ai/sessions/${sessionId}/messages`;
const CHAT_HISTORY_LIMIT = 80;
const CHAT_HISTORY_CANDIDATES = [
  `${NODE_API_BASE_URL}/api/ai/sessions/latest/messages`,
  `${NODE_API_BASE_URL}/api/ai/chat/history`,
  `${NODE_API_BASE_URL}/api/ai/chat/messages`,
  `${NODE_API_BASE_URL}/api/ai/sessions/latest`,
  `${NODE_API_BASE_URL}/api/ai/history`,
];
const GRADE_URL = `${PYTHON_API_BASE_URL}/grade`;
const QUIZ_GENERATE_URL = `${NODE_API_BASE_URL}/api/quizzes/generate/ai-practice`;
const QUIZ_SUBMIT_URL = `${NODE_API_BASE_URL}/api/quizzes/submit`;
const LIQUID_FALLBACK_BASE_URL = `http://${API_HOST}:8001`;
const PYTHON_TEXTBOOK_ASSIST_URL = `${PYTHON_API_BASE_URL}/textbook/assist`;
const PYTHON_TEXTBOOK_ASSIST_8001_URL = `http://${API_HOST}:8001/textbook/assist`;
const PYTHON_TEXTBOOK_ASSIST_8011_URL = `http://${API_HOST}:8011/textbook/assist`;
const TEXTBOOK_RESOURCES_URL = `${NODE_API_BASE_URL}/api/ai/textbook/resources`;
const PYTHON_TEXTBOOK_RESOURCES_URL = `${PYTHON_API_BASE_URL}/textbook/resources`;
const PYTHON_TEXTBOOK_RESOURCES_8001_URL = `http://${API_HOST}:8001/textbook/resources`;
const PYTHON_TEXTBOOK_RESOURCES_8011_URL = `http://${API_HOST}:8011/textbook/resources`;
const TEXTBOOK_SELECTION_ASK_URL = `${NODE_API_BASE_URL}/api/ai/textbook/selection-ask`;
const TEXTBOOK_RESOLVE_URL = `${NODE_API_BASE_URL}/api/textbooks/resolve`;
const PYTHON_TEXTBOOK_SELECTION_ASK_URL = `${PYTHON_API_BASE_URL}/textbook/selection-ask`;
const PYTHON_TEXTBOOK_SELECTION_ASK_8001_URL =
  `http://${API_HOST}:8001/textbook/selection-ask`;
const PYTHON_TEXTBOOK_SELECTION_ASK_8011_URL =
  `http://${API_HOST}:8011/textbook/selection-ask`;

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
const practiceGenerateTimeoutMs = 90000;
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

  // Always try the Node chat route first because it owns session/message persistence.
  // Python remains a fallback when Node is unavailable or fails.
  return unique([nodeEndpoint, pythonEndpoint, liquidEndpoint]);
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
    xp: profile.xp,
    streak: profile.streak,
    last_active: profile.lastActive,
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
    if (Array.isArray(nestedRecord.items)) {
      return nestedRecord.items as PersistedChatMessage[];
    }
    if (Array.isArray(nestedRecord.docs)) {
      return nestedRecord.docs as PersistedChatMessage[];
    }
  }

  if (Array.isArray(record.items)) {
    return record.items as PersistedChatMessage[];
  }

  if (Array.isArray(record.docs)) {
    return record.docs as PersistedChatMessage[];
  }

  return [];
};

const getHistoryEndpointCandidates = (sessionId?: string, preferLatest = false) => {
  const recentQuery = `page=1&limit=${CHAT_HISTORY_LIMIT}&sort=desc`;
  const endpoints = [...CHAT_HISTORY_CANDIDATES];

  if (preferLatest) {
    endpoints.unshift(`${NODE_API_BASE_URL}/api/ai/sessions/latest/messages?${recentQuery}`);
  }

  if (sessionId && sessionId.trim()) {
    endpoints.unshift(`${CHAT_HISTORY_URL(sessionId.trim())}?${recentQuery}`);
  }

  const candidatesWithQuery = endpoints.map((endpoint) =>
    endpoint.includes("?") ? `${endpoint}&${recentQuery}` : `${endpoint}?${recentQuery}`,
  );

  return unique(candidatesWithQuery);
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
  const tutorSignal = classifyTutorPrompt(userPrompt);
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
          recordTutorInteraction(subject, tutorSignal);
          return normalizeTutorResponse(data.response);
        }
        if (typeof data?.message === "string") {
          if (isIntegrationFallbackText(data.message)) {
            continue;
          }
          recordTutorInteraction(subject, tutorSignal);
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
  const tutorSignal = classifyTutorPrompt(userPrompt);
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

    recordTutorInteraction(subject, tutorSignal);

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

export type PracticeQuestion = {
  id?: string;
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
  quizId?: string | null;
  error?: string | null;
  subject?: string;
  grade?: string;
};

export type BackendPracticeQuizSummary = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  questionCount: number;
  createdAt: string;
  source: "teacher" | "ai";
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

export type TextbookAssistPayload = {
  subject: SubjectName;
  grade: string;
  chapter: string;
  current_topic?: string;
  current_passage?: string;
  current_page?: number;
};

export type TextbookAssistResponse = {
  show_canvas_suggestion: boolean;
  topic: string | null;
  canvas_link: string | null;
  suggestion_text: string | null;
  message?: string;
  current_page?: number | null;
};

export type TextbookSelectionAskPayload = {
  subject: SubjectName;
  grade: string;
  chapter: string;
  question: string;
  selected_text: string;
  history?: ChatHistoryItem[];
  full_name?: string;
  unit?: string;
  current_topic?: string;
  current_page?: number;
  support_subjects?: string[];
  strong_subjects?: string[];
  mastery_score?: number | null;
  performance_band?: string | null;
};

export type TextbookSelectionAskResponse = {
  response: string;
  selected_text: string;
  message?: string;
  current_page?: number | null;
};

export type TextbookResourcesPayload = {
  subject: SubjectName;
  grade: string;
  chapter?: string;
  unit?: string;
};

export type TextbookResourceItem = {
  id: string;
  chapter: string;
  topic: string;
  title: string;
  type: "canvas" | "ar";
  url: string;
  page?: number | null;
};

export type ResolvedTextbookData = {
  subject: SubjectName;
  grade_requested: number;
  grade_served: number;
  title: string;
  textbook_url: string;
  source: "database" | "catalog";
};

type SubmitPracticeAttemptPayload = {
  quizId: string;
  answers: Array<{
    questionId: string;
    providedAnswer: string;
  }>;
};

const mapPracticeQuestionType = (value: unknown): PracticeQuestion["type"] | null => {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "MCQ" || raw === "mcq") return "mcq";
  if (raw === "TRUE_FALSE" || raw === "TRUEFALSE" || raw === "true_false") {
    return "true_false";
  }
  if (raw === "SHORT" || raw === "SHORT_ANSWER" || raw === "short") {
    return "short";
  }
  return null;
};

const isAbortError = (error: unknown) => {
  if (!error) return false;
  if (typeof error === "object" && "name" in (error as Record<string, unknown>)) {
    return String((error as Record<string, unknown>).name) === "AbortError";
  }
  return String(error).includes("AbortError");
};

const normalizeComparableText = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizePracticeQuestion = (item: unknown): PracticeQuestion | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const type =
    mapPracticeQuestionType(record.type) || mapPracticeQuestionType(record.question_type);
  const question =
    (typeof record.question === "string" && record.question.trim()) ||
    (typeof record.question_text === "string" && record.question_text.trim()) ||
    "";
  const answer =
    (typeof record.answer === "string" && record.answer.trim()) ||
    (typeof record.correct_answer === "string" && record.correct_answer.trim()) ||
    "";
  const explanation =
    (typeof record.explanation === "string" && record.explanation.trim()) ||
    "Review the textbook concept and compare your reasoning to the model answer.";
  const rawHint =
    (typeof record.hint === "string" && record.hint.trim()) ||
    "Focus on the key concept from your textbook chapter.";
  const hint =
    normalizeComparableText(rawHint) === normalizeComparableText(explanation)
      ? "Focus on the key concept from your textbook chapter."
      : rawHint;

  if (!type || !question || !answer) {
    return null;
  }

  const options = Array.isArray(record.options)
    ? record.options
        .map((option) => String(option || "").trim())
        .filter((option) => option.length > 0)
    : undefined;

  return {
    id:
      (typeof record._id === "string" && record._id) ||
      (typeof record.id === "string" && record.id) ||
      undefined,
    type,
    question,
    options:
      type === "true_false" && (!options || options.length < 2)
        ? ["TRUE", "FALSE"]
        : options,
    answer,
    hint,
    explanation,
  };
};

const extractPracticeQuestions = (payload: unknown): PracticeQuestion[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  let items: unknown[] = [];

  if (Array.isArray(record.questions)) {
    items = record.questions;
  } else if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.questions)) {
      items = nested.questions;
    }
  }

  return items.map(normalizePracticeQuestion).filter(Boolean) as PracticeQuestion[];
};

export const generatePracticeQuestions = async (
  payload: PracticePayload,
): Promise<PracticeResponse> => {
  const studentProfile = buildStudentProfilePayload();
  const requestPayload = {
    ...payload,
    grade: studentProfile.grade,
    student_profile: studentProfile,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      practiceGenerateTimeoutMs,
    );
    const response = await fetch(QUIZ_GENERATE_URL, {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = await response.json();
    const questions = extractPracticeQuestions(data);
    const quizId =
      (typeof data?.data?.quiz?._id === "string" && data.data.quiz._id) ||
      (typeof data?.data?.quiz?.id === "string" && data.data.quiz.id) ||
      null;

    if (!quizId) {
      return {
        questions: [],
        quizId: null,
        error: "Backend did not return a persisted quiz id. Please retry.",
      };
    }

    if (!questions.length) {
      return {
        questions: [],
        quizId,
        error: "Backend returned no quiz questions. Please retry.",
      };
    }

    void syncTwinProgress({
		xp_delta: 1,
		subject: payload.subject,
	});

    return {
      questions,
      quizId,
      error: null,
      subject: String(payload.subject || ""),
      grade: String(studentProfile.grade || ""),
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        questions: [],
        quizId: null,
        error:
          "Quiz generation timed out on backend. Try a smaller question count or retry in a moment.",
      };
    }

    console.warn("Backend quiz generation failed:", error);
    return {
      questions: [],
      quizId: null,
      error: "Backend quiz generation failed. Please retry.",
    };
  }
};

export const submitPracticeAttempt = async (payload: SubmitPracticeAttemptPayload) => {
  if (!payload.quizId || !payload.answers.length) {
    return { success: false, message: "Missing quiz id or answers" };
  }

  try {
    const response = await fetch(QUIZ_SUBMIT_URL, {
      method: "POST",
      headers: buildAuthHeaders(),
      body: JSON.stringify({
        quiz_id: payload.quizId,
        answers: payload.answers.map((item) => ({
          question_id: item.questionId,
          provided_answer: item.providedAnswer,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save attempt",
    };
  }
};

export const fetchMyPracticeQuizzes = async (): Promise<BackendPracticeQuizSummary[]> => {
  try {
    const response = await fetch(`${NODE_API_BASE_URL}/api/quizzes/my-practice`, {
      method: "GET",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const body = await response.json();
    const items = Array.isArray(body?.data) ? body.data : [];

    const normalized = items
      .map((item: Record<string, unknown>) => ({
        id: String(item?._id || item?.id || ""),
        title: String(item?.title || "AI Practice"),
        topic: String(item?.topic || ""),
        subject: String(item?.subject || item?.subject_name || "subject"),
        questionCount: Number(item?.question_count || 0),
        createdAt: String(item?.created_at || item?.createdAt || ""),
        source: "ai" as const,
      }))
      .filter((item: BackendPracticeQuizSummary) => item.id.length > 0);

    const seen = new Set<string>();
    return normalized.filter((item: BackendPracticeQuizSummary) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  } catch (error) {
    console.warn("Failed to fetch practice quizzes:", error);
    return [];
  }
};

export const fetchPracticeLibraryQuizzes = async (): Promise<BackendPracticeQuizSummary[]> => {
  try {
    const response = await fetch(`${NODE_API_BASE_URL}/api/quizzes/library`, {
      method: "GET",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const body = await response.json();
    const items = Array.isArray(body?.data) ? body.data : [];

    const normalized = items
      .map((item: Record<string, unknown>) => ({
        id: String(item?._id || item?.id || ""),
        title: String(item?.title || "Teacher Practice"),
        topic: String(item?.topic || ""),
        subject: String(item?.subject || item?.subject_name || "subject"),
        questionCount: Number(item?.question_count || 0),
        createdAt: String(item?.created_at || item?.createdAt || ""),
        source: "teacher" as const,
      }))
      .filter((item: BackendPracticeQuizSummary) => item.id.length > 0);

    const seen = new Set<string>();
    return normalized.filter((item: BackendPracticeQuizSummary) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  } catch (error) {
    console.warn("Failed to fetch practice library quizzes:", error);
    return [];
  }
};

export const fetchPracticeQuizDetail = async (quizId: string) => {
  if (!quizId) {
    return { quizId: "", subject: "", questions: [] as PracticeQuestion[] };
  }

  const response = await fetch(`${NODE_API_BASE_URL}/api/quizzes/${quizId}`, {
    method: "GET",
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = await response.json();
  const data = body?.data || {};
  const questionItems = Array.isArray(data?.questions) ? data.questions : [];
  const subject = String(
    data?.subject || data?.quiz?.subject || data?.quiz?.subject_name || "",
  );

  return {
    quizId,
    subject,
    questions: questionItems
      .map(normalizePracticeQuestion)
      .filter(Boolean) as PracticeQuestion[],
  };
};

export const gradePracticeAnswer = async (
  payload: GradePayload,
): Promise<GradeResponse> => {
  const normalize = (value: string) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const localIsCorrect =
    normalize(payload.student_answer) === normalize(payload.correct_answer);

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
    // Grade endpoint may be unavailable in some environments; fallback to local answer check.
    console.warn("Grade endpoint unavailable, using local grading fallback.");

    const fallbackFeedback = localIsCorrect
      ? "Correct. Great job."
      : "Not correct. Review the hint and explanation, then compare with the expected answer.";

    return {
      is_correct: localIsCorrect,
      feedback: fallbackFeedback,
    };
  }
};

export const fetchChatHistory = async (sessionId?: string) => {
  const online = await isOnlineNow();
  if (!online) {
    return [] as PersistedChatMessage[];
  }

  const resolvedSessionId = sessionId || currentChatSessionId;
  const endpoints = getHistoryEndpointCandidates(resolvedSessionId || undefined);

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        lastError = new Error(await readErrorMessage(response));
        continue;
      }

      const data = await response.json();
      const extractedSessionId = extractSessionId(data);
      if (extractedSessionId) {
        setChatSessionId(extractedSessionId);
      }

      const messages = extractPersistedMessages(data);
      if (Array.isArray(messages) && messages.length > 0) {
        const normalized = messages
          .filter((item) => typeof item?.message_text === "string" && item.message_text.trim().length > 0)
          .sort((a, b) => {
            const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return ta - tb;
          });

        return normalized.slice(-CHAT_HISTORY_LIMIT);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [] as PersistedChatMessage[];
};

export const fetchLatestChatHistory = async () => {
  const online = await isOnlineNow();
  if (!online) {
    return {
      sessionId: null as string | null,
      messages: [] as PersistedChatMessage[],
    };
  }

  const endpoints = getHistoryEndpointCandidates(undefined, true);
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        lastError = new Error(await readErrorMessage(response));
        continue;
      }

      const data = await response.json();
      const extractedSessionId = extractSessionId(data);
      if (extractedSessionId) {
        setChatSessionId(extractedSessionId);
      }

      const messages = extractPersistedMessages(data);
      const normalized = Array.isArray(messages)
        ? messages
            .filter((item) => typeof item?.message_text === "string" && item.message_text.trim().length > 0)
            .sort((a, b) => {
              const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return ta - tb;
            })
            .slice(-CHAT_HISTORY_LIMIT)
        : [];

      return {
        sessionId: extractedSessionId || currentChatSessionId,
        messages: normalized,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    sessionId: null as string | null,
    messages: [] as PersistedChatMessage[],
  };
};

export const fetchTextbookAssist = async (
  payload: TextbookAssistPayload,
): Promise<TextbookAssistResponse> => {
  const endpointCandidates = unique([
    TEXTBOOK_ASSIST_URL,
    PYTHON_TEXTBOOK_ASSIST_URL,
    PYTHON_TEXTBOOK_ASSIST_8001_URL,
    PYTHON_TEXTBOOK_ASSIST_8011_URL,
  ]);

  let lastError: unknown = null;

  for (const endpoint of endpointCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const useNodeHeaders = endpoint === TEXTBOOK_ASSIST_URL;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: useNodeHeaders
          ? buildAuthHeaders()
          : {
              "Content-Type": "application/json",
            },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new Error(await readErrorMessage(response));
        continue;
      }

      const data = await response.json();
      return {
        show_canvas_suggestion: Boolean(data?.show_canvas_suggestion),
        topic: typeof data?.topic === "string" ? data.topic : null,
        canvas_link: typeof data?.canvas_link === "string" ? data.canvas_link : null,
        suggestion_text:
          typeof data?.suggestion_text === "string" ? data.suggestion_text : null,
        message: typeof data?.message === "string" ? data.message : undefined,
        current_page:
          typeof data?.current_page === "number" ? data.current_page : null,
      };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.warn("Textbook assist unavailable:", lastError);
  return {
    show_canvas_suggestion: false,
    topic: null,
    canvas_link: null,
    suggestion_text: null,
    message: "Interactive assist is temporarily unavailable.",
    current_page: typeof payload.current_page === "number" ? payload.current_page : null,
  };
};

export const fetchTextbookResources = async (
  payload: TextbookResourcesPayload,
): Promise<TextbookResourceItem[]> => {
  const endpointCandidates = unique([
    PYTHON_TEXTBOOK_RESOURCES_8011_URL,
    PYTHON_TEXTBOOK_RESOURCES_URL,
    PYTHON_TEXTBOOK_RESOURCES_8001_URL,
    TEXTBOOK_RESOURCES_URL,
  ]);

  let lastError: unknown = null;

  for (const endpoint of endpointCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const useNodeHeaders = endpoint === TEXTBOOK_RESOURCES_URL;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: useNodeHeaders
          ? buildAuthHeaders()
          : {
              "Content-Type": "application/json",
            },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new Error(await readErrorMessage(response));
        continue;
      }

      const data = await response.json();
      const rawItems = Array.isArray(data?.resources) ? data.resources : [];
      return rawItems
        .map((item: unknown, index: number) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const record = item as Record<string, unknown>;
          const type = String(record.type || "").toLowerCase();
          const url = typeof record.url === "string" ? record.url.trim() : "";
          if ((type !== "canvas" && type !== "ar") || !url) {
            return null;
          }
          return {
            id:
              (typeof record.id === "string" && record.id.trim()) ||
              `resource-${index + 1}`,
            chapter:
              (typeof record.chapter === "string" && record.chapter.trim()) ||
              "General",
            topic:
              (typeof record.topic === "string" && record.topic.trim()) ||
              "General",
            title:
              (typeof record.title === "string" && record.title.trim()) ||
              `${type.toUpperCase()} model`,
            type: type as "canvas" | "ar",
            url,
            page: typeof record.page === "number" ? record.page : null,
          };
        })
        .filter(Boolean) as TextbookResourceItem[];
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.warn("Textbook resources unavailable:", lastError);
  return [];
};

export const fetchTextbookSelectionAsk = async (
  payload: TextbookSelectionAskPayload,
): Promise<TextbookSelectionAskResponse> => {
  const endpointCandidates = unique([
    TEXTBOOK_SELECTION_ASK_URL,
    PYTHON_TEXTBOOK_SELECTION_ASK_8011_URL,
    PYTHON_TEXTBOOK_SELECTION_ASK_URL,
    PYTHON_TEXTBOOK_SELECTION_ASK_8001_URL,
  ]);

  let lastError: unknown = null;

  for (const endpoint of endpointCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const useNodeHeaders = endpoint === TEXTBOOK_SELECTION_ASK_URL;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: useNodeHeaders
          ? buildAuthHeaders()
          : {
              "Content-Type": "application/json",
            },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        lastError = new Error(await readErrorMessage(response));
        continue;
      }

      const data = await response.json();
      return {
        response:
          typeof data?.response === "string" && data.response.trim()
            ? normalizeTutorResponse(data.response)
            : "I could not generate an answer from that selection.",
        selected_text:
          typeof data?.selected_text === "string" && data.selected_text.trim()
            ? data.selected_text.trim()
            : payload.selected_text,
        message: typeof data?.message === "string" ? data.message : undefined,
        current_page:
          typeof data?.current_page === "number" ? data.current_page : null,
      };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  console.warn("Textbook selection ask unavailable:", lastError);
  return {
    response: "I cannot reach the textbook AI service right now. Please try again.",
    selected_text: payload.selected_text,
    message: "Selection ask is temporarily unavailable.",
    current_page: typeof payload.current_page === "number" ? payload.current_page : null,
  };
};

export const fetchResolvedTextbook = async (
  subject: SubjectName,
  grade: string | number,
): Promise<ResolvedTextbookData | null> => {
  const normalizedGrade = String(grade || "").trim();
  if (!subject || !normalizedGrade) {
    return null;
  }

  const query = `subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(
    normalizedGrade,
  )}`;

  try {
    const response = await fetch(`${TEXTBOOK_RESOLVE_URL}?${query}`, {
      method: "GET",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const record = data?.data;
    if (!record || typeof record !== "object") {
      return null;
    }

    const textbookUrl =
      typeof record.textbook_url === "string" ? record.textbook_url.trim() : "";

    if (!textbookUrl) {
      return null;
    }

    return {
      subject,
      grade_requested:
        typeof record.grade_requested === "number"
          ? record.grade_requested
          : Number(normalizedGrade),
      grade_served:
        typeof record.grade_served === "number"
          ? record.grade_served
          : Number(normalizedGrade),
      title: typeof record.title === "string" ? record.title : "Textbook",
      textbook_url: textbookUrl,
      source: record.source === "database" ? "database" : "catalog",
    };
  } catch {
    return null;
  }
};
