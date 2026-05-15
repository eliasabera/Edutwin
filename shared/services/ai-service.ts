import Constants from "expo-constants";
import { Platform } from "react-native";
import { getStudentProfile } from "../store/user-store";
import type { SubjectName } from "../types/domain.types";
import { getAuthToken } from "./auth-service";
import { supabase } from "./supabase-client";
import {
  classifyTutorPrompt,
  recordTutorInteraction,
  syncTwinProgress,
} from "./gamification";

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
const TEXTBOOK_ASSIST_URL = `${NODE_API_BASE_URL}/api/ai/textbook/assist`;
const CHAT_HISTORY_LIMIT = 80;
const GRADE_URL = `${PYTHON_API_BASE_URL}/grade`;
const QUIZ_GENERATE_URL = `${NODE_API_BASE_URL}/api/quizzes/generate/ai-practice`;
const QUIZ_SUBMIT_URL = `${NODE_API_BASE_URL}/api/quizzes/submit`;
const PYTHON_TEXTBOOK_ASSIST_URL = `${PYTHON_API_BASE_URL}/textbook/assist`;
const PYTHON_TEXTBOOK_ASSIST_8001_URL = `http://${API_HOST}:8001/textbook/assist`;
const PYTHON_TEXTBOOK_ASSIST_8011_URL = `http://${API_HOST}:8011/textbook/assist`;
const TEXTBOOK_RESOURCES_URL = `${NODE_API_BASE_URL}/api/ai/textbook/resources`;
const VIRTUAL_LAB_RESOURCES_URL = `${NODE_API_BASE_URL}/api/virtual-lab-resources`;
const CANVAS_MODEL_HOST = "fyp3d-view.onrender.com";
const PYTHON_TEXTBOOK_RESOURCES_URL = `${PYTHON_API_BASE_URL}/textbook/resources`;
const PYTHON_TEXTBOOK_RESOURCES_8001_URL = `http://${API_HOST}:8001/textbook/resources`;
const PYTHON_TEXTBOOK_RESOURCES_8011_URL = `http://${API_HOST}:8011/textbook/resources`;
const HAS_TEXTBOOK_RESOURCES_BACKEND = Boolean(
  process.env.EXPO_PUBLIC_NODE_API_BASE_URL ||
    process.env.EXPO_PUBLIC_PYTHON_API_BASE_URL,
);
const TEXTBOOK_SELECTION_ASK_URL = `${NODE_API_BASE_URL}/api/ai/textbook/selection-ask`;
const TEXTBOOK_RESOLVE_URL = `${NODE_API_BASE_URL}/api/textbooks/resolve`;
const TEXTBOOK_PRELOAD_URL = `${NODE_API_BASE_URL}/api/ai/textbook/preload`;
const PYTHON_TEXTBOOK_SELECTION_ASK_URL = `${PYTHON_API_BASE_URL}/textbook/selection-ask`;
const PYTHON_TEXTBOOK_SELECTION_ASK_8001_URL = `http://${API_HOST}:8001/textbook/selection-ask`;
const PYTHON_TEXTBOOK_SELECTION_ASK_8011_URL = `http://${API_HOST}:8011/textbook/selection-ask`;
const PYTHON_TEXTBOOK_PRELOAD_URL = `${PYTHON_API_BASE_URL}/textbook/preload`;
const PYTHON_TEXTBOOK_PRELOAD_8001_URL = `http://${API_HOST}:8001/textbook/preload`;
const PYTHON_TEXTBOOK_PRELOAD_8011_URL = `http://${API_HOST}:8011/textbook/preload`;
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
const HF_API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY?.trim();
const HF_EMBED_MODEL =
  process.env.EXPO_PUBLIC_HF_EMBED_MODEL?.trim() ||
  "sentence-transformers/all-MiniLM-L6-v2";
const HF_EMBED_BASE_URL = process.env.EXPO_PUBLIC_HF_EMBED_BASE_URL?.trim();
const RAG_MATCH_RPC = process.env.EXPO_PUBLIC_RAG_MATCH_RPC?.trim() || "match_chunks";
const RAG_MATCH_COUNT = Number.parseInt(
  process.env.EXPO_PUBLIC_RAG_MATCH_COUNT || "5",
  10,
);
const RAG_MIN_SIMILARITY = Number.parseFloat(
  process.env.EXPO_PUBLIC_RAG_MIN_SIMILARITY || "0.05",
);
const RAG_TEXTBOOK_TOP_K = 4;
const RAG_TEACHER_GUIDE_TOP_K = 3;
const TEACHER_GUIDE_MARKERS = [
  "teacher guide",
  "teachers guide",
  "teacher's guide",
  "teacher manual",
  "instructor guide",
  "facilitator guide",
];

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

const unique = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || seen.has(item)) return false;
    seen.add(item);
    return true;
  });
};

const normalizeCanvasUrl = (url: string, type: "canvas" | "ar"): string => {
  const trimmed = String(url || "").trim();
  if (!trimmed || type !== "canvas") {
    return trimmed;
  }

  return trimmed.replace(
    /https?:\/\/threed-view-for-final-year-project\.onrender\.com/gi,
    `https://${CANVAS_MODEL_HOST}`,
  );
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


const averageEmbedding = (matrix: number[][]) => {
  if (!matrix.length) return [] as number[];
  const length = matrix[0]?.length || 0;
  if (!length) return [] as number[];
  const sum = new Array<number>(length).fill(0);
  for (const row of matrix) {
    for (let i = 0; i < length; i += 1) {
      sum[i] += row[i] ?? 0;
    }
  }
  return sum.map((value) => value / matrix.length);
};

const normalizeMatchText = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractKeywords = (value: string) => {
  const tokens = normalizeMatchText(value)
    .split(" ")
    .filter((token) => token.length >= 3);
  return new Set(tokens);
};

const isRagContextRelevant = (
  question: string,
  chunks: string[],
  subject?: SubjectName,
) => {
  const required = new Set([
    ...extractKeywords(question),
    ...extractKeywords(subject || ""),
  ]);

  if (required.size === 0) return true;
  const normalized = normalizeMatchText(chunks.join(" "));
  for (const keyword of required) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }
  return false;
};

const classifyChunkSource = (document: string, metadata?: Record<string, unknown>) => {
  const metaBlob = normalizeMatchText(
    Object.values(metadata || {}).join(" "),
  );
  if (TEACHER_GUIDE_MARKERS.some((marker) => metaBlob.includes(marker))) {
    return "teacher_guide";
  }

  const docBlob = normalizeMatchText(document);
  if (TEACHER_GUIDE_MARKERS.some((marker) => docBlob.includes(marker))) {
    return "teacher_guide";
  }

  return "textbook";
};

const buildSubjectVariants = (subject?: SubjectName) => {
  if (!subject) return [] as string[];
  if (subject === "math") {
    return ["math", "maths", "mathematics"];
  }
  return [subject];
};

const getHuggingFaceEmbedding = async (text: string) => {
  if (!HF_API_KEY) {
    throw new Error("Missing Hugging Face API key.");
  }

  const baseCandidates = unique(
    [
      HF_EMBED_BASE_URL,
      "https://api-inference.huggingface.co/models",
      "https://router.huggingface.co/hf-inference/models",
    ].filter(Boolean) as string[],
  );

  let lastError: Error | null = null;

  for (const baseUrl of baseCandidates) {
    const response = await fetch(`${baseUrl}/${HF_EMBED_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: [text] }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      lastError = new Error(message);
      if (response.status === 404) {
        continue;
      }
      if (response.status === 403) {
        throw new Error(
          "Hugging Face token lacks inference permissions. Create a new token with inference access.",
        );
      }
      throw lastError;
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error("Unexpected embedding response.");
    }

    if (Array.isArray(data[0])) {
      return averageEmbedding(data as number[][]);
    }

    return data as number[];
  }

  throw lastError || new Error("Hugging Face embedding failed.");
};

const fetchRagContext = async (
  question: string,
  subject?: SubjectName,
  grade?: string,
) => {
  const embedding = await getHuggingFaceEmbedding(question);
  if (!embedding.length) {
    return {
      textbookChunks: [] as string[],
      teacherGuideChunks: [] as string[],
    };
  }

  const callRagRpc = async (params: {
    subject?: string | null;
    grade?: string | null;
  }) => {
    const { data, error } = await supabase.rpc(RAG_MATCH_RPC, {
      query_embedding: embedding,
      match_count: Number.isFinite(RAG_MATCH_COUNT) ? RAG_MATCH_COUNT : 5,
      subject: params.subject ?? null,
      grade: params.grade ?? null,
      min_similarity: Number.isFinite(RAG_MIN_SIMILARITY)
        ? RAG_MIN_SIMILARITY
        : 0.1,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!Array.isArray(data)) return [] as Array<Record<string, unknown>>;
    return data as Array<Record<string, unknown>>;
  };

  const subjectVariants = buildSubjectVariants(subject);
  const gradeValue = grade ? String(grade) : "";

  const candidateResults: Array<Record<string, unknown>> = [];

  if (subjectVariants.length && gradeValue) {
    for (const subjectVariant of subjectVariants) {
      const rows = await callRagRpc({
        subject: subjectVariant,
        grade: gradeValue,
      });
      if (rows.length) {
        candidateResults.push(...rows);
        break;
      }
    }
  }

  if (!candidateResults.length && gradeValue) {
    const rows = await callRagRpc({ subject: null, grade: gradeValue });
    candidateResults.push(...rows);
  }

  if (!candidateResults.length && subjectVariants.length) {
    const rows = await callRagRpc({ subject: subjectVariants[0], grade: null });
    candidateResults.push(...rows);
  }

  if (!candidateResults.length) {
    const rows = await callRagRpc({ subject: null, grade: null });
    candidateResults.push(...rows);
  }

  const rows = candidateResults
    .map((row) => ({
      content:
        typeof row?.content === "string" ? row.content.trim() : "",
      similarity:
        typeof row?.similarity === "number" ? row.similarity : null,
      metadata: row?.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    }))
    .filter((row) => row.content.length > 0);

  const questionKeywords = extractKeywords(question);
  const subjectKeywords = extractKeywords(subject || "");
  const requiredKeywords = new Set([...questionKeywords, ...subjectKeywords]);

  const filteredRows = rows.filter((row) => {
    if (requiredKeywords.size === 0) return true;
    const normalized = normalizeMatchText(row.content);
    for (const keyword of requiredKeywords) {
      if (normalized.includes(keyword)) {
        return true;
      }
    }
    return false;
  });

  const effectiveRows = filteredRows.length > 0 ? filteredRows : rows;

  const textbookChunks: string[] = [];
  const guideChunks: string[] = [];

  for (const row of effectiveRows) {
    if (
      row.similarity !== null &&
      Number.isFinite(RAG_MIN_SIMILARITY) &&
      row.similarity < RAG_MIN_SIMILARITY
    ) {
      continue;
    }
    const source = classifyChunkSource(row.content, row.metadata);
    if (source === "teacher_guide") {
      if (guideChunks.length < RAG_TEACHER_GUIDE_TOP_K) {
        guideChunks.push(row.content);
      }
    } else if (textbookChunks.length < RAG_TEXTBOOK_TOP_K) {
      textbookChunks.push(row.content);
    }

    if (
      textbookChunks.length >= RAG_TEXTBOOK_TOP_K &&
      guideChunks.length >= RAG_TEACHER_GUIDE_TOP_K
    ) {
      break;
    }
  }

  return { textbookChunks, teacherGuideChunks: guideChunks };
};

const callGroq = async (messages: GroqMessage[]) => {
  if (!GROQ_API_KEY) {
    throw new Error("Missing Groq API key.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 700,
      messages,
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("No response from Groq.");
  }

  return content.trim();
};

const POLITE_INSUFFICIENT_INFO_MESSAGE =
  "I want to help, but I could not find enough textbook information for that question at your grade level. Please rephrase it or ask a more specific textbook question.";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const normalizeChatHistory = (history: ChatHistoryItem[]) => {
  const normalized: GroqMessage[] = [];
  for (const item of history.slice(-6)) {
    if (!item || typeof item !== "object") continue;
    const role = item.role;
    const content = String(item.content || "").trim();
    if (!content) continue;
    if (role === "user" || role === "assistant") {
      normalized.push({ role, content });
    }
  }
  return normalized;
};

const buildGroqTutorMessages = (params: {
  question: string;
  textbookChunks: string[];
  teacherGuideChunks: string[];
  subject?: SubjectName;
  grade?: string;
  history?: ChatHistoryItem[];
  studentProfile: ReturnType<typeof buildStudentProfilePayload>;
}): GroqMessage[] => {
  const {
    question,
    textbookChunks,
    teacherGuideChunks,
    subject,
    grade,
    history = [],
    studentProfile,
  } = params;

  const firstName = String(studentProfile.full_name || "student")
    .trim()
    .split(" ")[0];
  const safeGrade = String(grade || studentProfile.grade || "").trim();
  const safeSubject = String(subject || "").trim();
  const textbookContext = textbookChunks.join("\n\n").trim();
  const teacherGuideContext = teacherGuideChunks.join("\n\n").trim();

  const systemPrompt = [
    `You are EduTwin, a friendly and clear tutor for Ethiopian Grade ${safeGrade || ""} students.`,
    `Always start with a warm greeting like: "Hey ${firstName}, let me explain."`,
    "Use simple, short sentences suitable for a high school student.",
    "Use ONLY the TEXTBOOK CONTEXT for facts. You may use TEACHER GUIDE CONTEXT only to simplify or explain.",
    `If the answer is not supported by the textbook context, reply exactly: ${POLITE_INSUFFICIENT_INFO_MESSAGE}`,
    "Do not invent facts or add outside knowledge.",
    "English only.",
    safeSubject ? `Subject: ${safeSubject}.` : "",
    "TEXTBOOK CONTEXT:",
    textbookContext || "(no textbook context)",
    "TEACHER GUIDE CONTEXT:",
    teacherGuideContext || "(no teacher guide context)",
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = [
    `Student question: ${question}`,
    "",
    "[SYSTEM REMINDER: Be warm and simple. Use only the provided context. Do not invent facts.]",
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    ...normalizeChatHistory(history),
    { role: "user", content: userPrompt },
  ];
};

const normalizeTutorResponse = (text: string) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n");

  cleaned = cleaned.replace(
    /^\s*(Explanation|Example|Summary|Practice Question)\s*:\s*/gim,
    "",
  );
  cleaned = cleaned.replace(/^\s*-\s+/gm, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line, index, arr) =>
        line.length > 0 || (index > 0 && arr[index - 1].length > 0),
    );

  cleaned = lines.join("\n").trim();
  return cleaned || text.trim();
};

const normalizeGroqTutorResponse = (text: string) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned;
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

const normalizeGradeLevel = (grade: string | number | undefined) => {
  if (typeof grade === "number" && Number.isFinite(grade)) {
    return Math.trunc(grade);
  }
  if (typeof grade === "string") {
    const match = grade.match(/\d+/);
    if (match) {
      const parsed = Number.parseInt(match[0], 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
};

let cachedStudentId: string | null = null;
let cachedStudentUserId: string | null = null;
const cachedSubjectIds = new Map<string, string>();

const resolveStudentId = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
      return null;
    }
    const userId = data.user.id;
    if (cachedStudentId && cachedStudentUserId === userId) {
      return cachedStudentId;
    }

    const { data: rows, error: queryError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (queryError) {
      return null;
    }
    const studentId = rows?.[0]?.id ? String(rows[0].id) : null;
    cachedStudentId = studentId;
    cachedStudentUserId = userId;
    return studentId;
  } catch {
    return null;
  }
};

const resolveSubjectId = async (
  subject: SubjectName | undefined,
  grade: string | number | undefined,
) => {
  if (!subject) {
    return null;
  }
  const gradeLevel = normalizeGradeLevel(grade);
  const cacheKey = `${subject}:${gradeLevel ?? "any"}`;
  if (cachedSubjectIds.has(cacheKey)) {
    return cachedSubjectIds.get(cacheKey) || null;
  }

  try {
    let query = supabase
      .from("subjects")
      .select("id")
      .ilike("name", subject);
    if (gradeLevel !== null) {
      query = query.eq("grade_level", gradeLevel);
    }

    const { data, error } = await query.limit(1);
    if (error) {
      return null;
    }
    const subjectId = data?.[0]?.id ? String(data[0].id) : null;
    if (subjectId) {
      cachedSubjectIds.set(cacheKey, subjectId);
    }
    return subjectId;
  } catch {
    return null;
  }
};

const resolveChatSessionId = async (
  subject: SubjectName | undefined,
  grade: string | number | undefined,
) => {
  if (currentChatSessionId) return currentChatSessionId;

  const studentId = await resolveStudentId();
  if (!studentId) return null;

  const subjectId = await resolveSubjectId(subject, grade);
  if (!subjectId) return null;

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("student_id", studentId)
    .eq("subject_id", subjectId)
    .order("started_at", { ascending: false })
    .limit(1);

  if (!error && data?.length) {
    currentChatSessionId = String(data[0].id);
    return currentChatSessionId;
  }

  const { data: created, error: createError } = await supabase
    .from("chat_sessions")
    .insert({
      student_id: studentId,
      subject_id: subjectId,
    })
    .select("id")
    .limit(1);

  if (createError || !created?.length) {
    return null;
  }
  currentChatSessionId = String(created[0].id);
  return currentChatSessionId;
};

const persistChatMessages = async (
  question: string,
  answer: string,
  subject: SubjectName | undefined,
  grade: string | number | undefined,
) => {
  if (!question || !answer) return;
  const sessionId = await resolveChatSessionId(subject, grade);
  if (!sessionId) {
    return;
  }

  const { error } = await supabase.from("chat_messages").insert([
    {
      session_id: sessionId,
      sender: "USER",
      message_text: question,
    },
    {
      session_id: sessionId,
      sender: "AI",
      message_text: answer,
    },
  ]);
  if (error) {
    return;
  }
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


export const generateAIResponse = async (
  userPrompt: string,
  subject?: SubjectName,
  history: ChatHistoryItem[] = [],
): Promise<string> => {
  const studentProfile = buildStudentProfilePayload();
  const tutorSignal = classifyTutorPrompt(userPrompt);
  let ragError: Error | null = null;
  if (GROQ_API_KEY && HF_API_KEY) {
    try {
      const { textbookChunks, teacherGuideChunks } = await fetchRagContext(
        userPrompt,
        subject,
        studentProfile.grade,
      );
      const allChunks = [...textbookChunks, ...teacherGuideChunks];
      if (!allChunks.length) {
        return POLITE_INSUFFICIENT_INFO_MESSAGE;
      }
      if (!isRagContextRelevant(userPrompt, allChunks, subject)) {
        return POLITE_INSUFFICIENT_INFO_MESSAGE;
      }

      const messages = buildGroqTutorMessages({
        question: userPrompt,
        textbookChunks,
        teacherGuideChunks,
        subject,
        grade: studentProfile.grade,
        history,
        studentProfile,
      });
      const response = await callGroq(messages);
      const normalized = normalizeGroqTutorResponse(response);
      void persistChatMessages(
        userPrompt,
        normalized,
        subject,
        studentProfile.grade,
      );
      recordTutorInteraction(subject, tutorSignal);
      return normalized;
    } catch (error) {
      ragError = error instanceof Error ? error : new Error("RAG failed");
      console.warn("Groq RAG failed:", ragError);
    }
  }

  if (GROQ_API_KEY && HF_API_KEY) {
    const detail = ragError?.message
      ? `RAG error: ${ragError.message}`
      : "I could not reach the AI service. Check Groq/Hugging Face keys and Supabase RAG setup.";
    return detail;
  }

  return "Missing Groq or Hugging Face API keys.";
};

export const generateAIResponseStream = async (
  userPrompt: string,
  onChunk: (chunk: string) => void,
  subject?: SubjectName,
  history: ChatHistoryItem[] = [],
): Promise<string> => {
  const studentProfile = buildStudentProfilePayload();
  const tutorSignal = classifyTutorPrompt(userPrompt);
  let ragError: Error | null = null;
  if (GROQ_API_KEY && HF_API_KEY) {
    try {
      const { textbookChunks, teacherGuideChunks } = await fetchRagContext(
        userPrompt,
        subject,
        studentProfile.grade,
      );
      const allChunks = [...textbookChunks, ...teacherGuideChunks];
      if (!allChunks.length) {
        onChunk(POLITE_INSUFFICIENT_INFO_MESSAGE);
        return POLITE_INSUFFICIENT_INFO_MESSAGE;
      }
      if (!isRagContextRelevant(userPrompt, allChunks, subject)) {
        onChunk(POLITE_INSUFFICIENT_INFO_MESSAGE);
        return POLITE_INSUFFICIENT_INFO_MESSAGE;
      }

      const messages = buildGroqTutorMessages({
        question: userPrompt,
        textbookChunks,
        teacherGuideChunks,
        subject,
        grade: studentProfile.grade,
        history,
        studentProfile,
      });
      const response = await callGroq(messages);
      const normalized = normalizeGroqTutorResponse(response);
      void persistChatMessages(
        userPrompt,
        normalized,
        subject,
        studentProfile.grade,
      );
      onChunk(normalized);
      recordTutorInteraction(subject, tutorSignal);
      return normalized;
    } catch (error) {
      ragError = error instanceof Error ? error : new Error("RAG failed");
      console.warn("Groq RAG stream failed:", ragError);
    }
  }

  if (ragError) {
    const message = `RAG error: ${ragError.message}`;
    onChunk(message);
    return message;
  }

  const missingKeys = "Missing Groq or Hugging Face API keys.";
  onChunk(missingKeys);
  return missingKeys;
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

export type TextbookPreloadPayload = {
  subject: SubjectName;
  grade: string;
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
  cover_image_url?: string | null;
  source: "database" | "catalog";
};

export type LabCanvasResource = {
  id: string;
  subject: SubjectName;
  chapter: string;
  title: string;
  topic: string;
  url: string;
  gradeLevel?: number;
};

export type LabArResource = {
  id: string;
  subject: SubjectName;
  chapter: string;
  title: string;
  topic: string;
  url: string;
  gradeLevel?: number;
};

type SubmitPracticeAttemptPayload = {
  quizId: string;
  answers: Array<{
    questionId: string;
    providedAnswer: string;
  }>;
};

const mapPracticeQuestionType = (
  value: unknown,
): PracticeQuestion["type"] | null => {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
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
  if (
    typeof error === "object" &&
    "name" in (error as Record<string, unknown>)
  ) {
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

const resolveMcqPracticeAnswer = (rawAnswer: string, options: string[]) => {
  const answer = String(rawAnswer || "").trim();
  if (!answer || !Array.isArray(options) || options.length === 0) {
    return answer;
  }

  const directNumber = answer.match(/^\s*(\d+)\s*$/);
  if (directNumber) {
    const parsed = Number(directNumber[1]);
    const oneBased = parsed - 1;
    if (oneBased >= 0 && oneBased < options.length) {
      return options[oneBased];
    }
    if (parsed >= 0 && parsed < options.length) {
      return options[parsed];
    }
  }

  const letterOnly = answer.match(/^\s*\(?([a-zA-Z])\)?[\].:\-]?\s*$/);
  if (letterOnly) {
    const idx = letterOnly[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) {
      return options[idx];
    }
  }

  const optionWord = answer
    .toLowerCase()
    .match(/\b(option|choice)\s+([a-z]|\d+)\b/);
  if (optionWord) {
    const marker = optionWord[2];
    if (/^\d+$/.test(marker)) {
      const idx = Number(marker) - 1;
      if (idx >= 0 && idx < options.length) {
        return options[idx];
      }
    } else {
      const idx = marker.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        return options[idx];
      }
    }
  }

  return answer;
};

const normalizePracticeQuestion = (item: unknown): PracticeQuestion | null => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const type =
    mapPracticeQuestionType(record.type) ||
    mapPracticeQuestionType(record.question_type);
  const question =
    (typeof record.question === "string" && record.question.trim()) ||
    (typeof record.question_text === "string" && record.question_text.trim()) ||
    "";
  const answer =
    (typeof record.answer === "string" && record.answer.trim()) ||
    (typeof record.correct_answer === "string" &&
      record.correct_answer.trim()) ||
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

  const resolvedAnswer =
    type === "mcq" && Array.isArray(options)
      ? resolveMcqPracticeAnswer(answer, options)
      : answer;

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
    answer: resolvedAnswer,
    hint,
    explanation,
  };
};

const extractJsonCandidate = (value: string) => {
  const text = value.trim();
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

const buildGroqPracticeMessages = (params: {
  subject?: SubjectName;
  topic: string;
  grade?: string | number;
  numQuestions: number;
  types?: Array<"mcq" | "true_false" | "short">;
}) => {
  const { subject, topic, grade, numQuestions, types } = params;
  const safeSubject = String(subject || "").trim();
  const safeTopic = String(topic || "").trim();
  const safeGrade = String(grade || "").trim();
  const typeList = Array.isArray(types) && types.length
    ? types.join(", ")
    : "mcq, true_false, short";

  const systemPrompt = [
    "You are an assistant that creates practice quiz questions for students.",
    "Return ONLY valid JSON with this shape:",
    '{"questions": [{"type": "mcq|true_false|short", "question": "...", "options": ["..."], "answer": "...", "hint": "...", "explanation": "..."}]}',
    "For mcq include 4 options. For true_false include 2 options: TRUE, FALSE. For short omit options or leave it empty array.",
    "Use simple, grade-appropriate language. Keep each question concise.",
    "Do not include markdown or extra text outside JSON.",
  ].join("\n");

  const userPrompt = [
    safeSubject ? `Subject: ${safeSubject}` : "Subject: General",
    safeGrade ? `Grade: ${safeGrade}` : "",
    safeTopic ? `Topic: ${safeTopic}` : "Topic: General practice",
    `Number of questions: ${numQuestions}`,
    `Allowed question types: ${typeList}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ] as GroqMessage[];
};

const mapQuestionTypeToDb = (type: PracticeQuestion["type"]) => {
  if (type === "mcq") return "MCQ";
  if (type === "true_false") return "TRUE_FALSE";
  return "SHORT_ANSWER";
};

const persistPracticeQuiz = async (params: {
  questions: PracticeQuestion[];
  subject?: SubjectName;
  topic: string;
  grade?: string | number;
  source: "AI" | "TEACHER";
}) => {
  const { questions, subject, topic, grade, source } = params;
  const studentId = await resolveStudentId();
  if (!studentId) {
    throw new Error("Student profile not found.");
  }

  const subjectId = await resolveSubjectId(subject, grade);
  if (!subjectId) {
    throw new Error("Subject not found.");
  }

  const titleBase = subject ? `${subject} practice` : "Practice";
  const title = topic ? `${titleBase}: ${topic}` : titleBase;
  const totalScorePossible = questions.length;

  const { data: quizRow, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      subject_id: subjectId,
      creator_type: source,
      student_id: source === "AI" ? studentId : null,
      topic: topic || null,
      title,
      status: "PUBLISHED",
      total_score_possible: totalScorePossible,
    })
    .select("id")
    .single();

  if (quizError || !quizRow?.id) {
    throw new Error(quizError?.message || "Failed to create quiz.");
  }

  const questionRows = questions.map((question, index) => ({
    quiz_id: quizRow.id,
    question_type: mapQuestionTypeToDb(question.type),
    question_text: question.question,
    options:
      question.type === "short"
        ? []
        : question.options && question.options.length
          ? question.options
          : question.type === "true_false"
            ? ["TRUE", "FALSE"]
            : undefined,
    correct_answer: question.answer,
    points: 1,
    order_index: index + 1,
    hint: question.hint,
    explanation: question.explanation,
  }));

  const { error: questionError } = await supabase
    .from("questions")
    .insert(questionRows);

  if (questionError) {
    throw new Error(questionError.message);
  }

  return String(quizRow.id);
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

  return items
    .map(normalizePracticeQuestion)
    .filter(Boolean) as PracticeQuestion[];
};

export const generatePracticeQuestions = async (
  payload: PracticePayload,
): Promise<PracticeResponse> => {
  const studentProfile = buildStudentProfilePayload();
  try {
    const messages = buildGroqPracticeMessages({
      subject: payload.subject,
      topic: payload.topic,
      grade: studentProfile.grade,
      numQuestions: payload.num_questions,
      types: payload.types,
    });

    const response = await Promise.race([
      callGroq(messages),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), practiceGenerateTimeoutMs),
      ),
    ]);

    const jsonCandidate = extractJsonCandidate(response);
    const parsed = jsonCandidate ? JSON.parse(jsonCandidate) : JSON.parse(response);
    const questions = extractPracticeQuestions(parsed);

    if (!questions.length) {
      return {
        questions: [],
        quizId: null,
        error: "Groq returned no quiz questions. Please retry.",
      };
    }

    const quizId = await persistPracticeQuiz({
      questions,
      subject: payload.subject,
      topic: payload.topic,
      grade: studentProfile.grade,
      source: "AI",
    });

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
    if (isAbortError(error) || String(error).includes("Timeout")) {
      return {
        questions: [],
        quizId: null,
        error:
          "Quiz generation timed out. Try a smaller question count or retry in a moment.",
      };
    }

    console.warn("Groq quiz generation failed:", error);
    return {
      questions: [],
      quizId: null,
      error: "Quiz generation failed. Please retry.",
    };
  }
};

export const submitPracticeAttempt = async (
  payload: SubmitPracticeAttemptPayload,
) => {
  if (!payload.quizId || !payload.answers.length) {
    return { success: false, message: "Missing quiz id or answers" };
  }

  try {
    const studentId = await resolveStudentId();
    if (!studentId) {
      throw new Error("Student profile not found");
    }

    const questionIds = payload.answers
      .map((item) => item.questionId)
      .filter((id) => id && typeof id === "string");
    const { data: questionRows, error: questionError } = await supabase
      .from("questions")
      .select("id, correct_answer")
      .in("id", questionIds);

    if (questionError) {
      throw new Error(questionError.message);
    }

    const correctMap = new Map(
      (questionRows || []).map((row) => [
        String(row.id),
        String(row.correct_answer || ""),
      ]),
    );

    const { data: attemptRow, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        student_id: studentId,
        quiz_id: payload.quizId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (attemptError || !attemptRow?.id) {
      throw new Error(attemptError?.message || "Failed to save attempt");
    }

    const answerRows = payload.answers.map((item) => ({
      attempt_id: attemptRow.id,
      question_id: item.questionId,
      provided_answer: item.providedAnswer,
      is_correct:
        normalizeComparableText(item.providedAnswer) ===
        normalizeComparableText(correctMap.get(item.questionId) || ""),
      ai_feedback: null,
    }));

    const { error: answerError } = await supabase
      .from("student_answers")
      .insert(answerRows);

    if (answerError) {
      throw new Error(answerError.message);
    }

    return { success: true, data: { attemptId: attemptRow.id } };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to save attempt",
    };
  }
};

export const fetchMyPracticeQuizzes = async (): Promise<
  BackendPracticeQuizSummary[]
> => {
  try {
    const studentId = await resolveStudentId();
    if (!studentId) return [];

    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, topic, created_at, subjects ( name ), questions ( count )",
      )
      .eq("creator_type", "AI")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const normalized = (data || [])
      .map((item: Record<string, unknown>) => {
        const questions = Array.isArray(item.questions)
          ? item.questions
          : [];
        const questionCount =
          typeof questions[0]?.count === "number"
            ? questions[0].count
            : 0;
        const subjectRow = item.subjects as Record<string, unknown> | null;
        return {
          id: String(item.id || ""),
          title: String(item.title || "AI Practice"),
          topic: String(item.topic || ""),
          subject: String(subjectRow?.name || "subject"),
          questionCount,
          createdAt: String(item.created_at || ""),
          source: "ai" as const,
        };
      })
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

export const fetchPracticeLibraryQuizzes = async (): Promise<
  BackendPracticeQuizSummary[]
> => {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, topic, created_at, subjects ( name ), questions ( count )",
      )
      .eq("creator_type", "TEACHER")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const normalized = (data || [])
      .map((item: Record<string, unknown>) => {
        const questions = Array.isArray(item.questions)
          ? item.questions
          : [];
        const questionCount =
          typeof questions[0]?.count === "number"
            ? questions[0].count
            : 0;
        const subjectRow = item.subjects as Record<string, unknown> | null;
        return {
          id: String(item.id || ""),
          title: String(item.title || "Teacher Practice"),
          topic: String(item.topic || ""),
          subject: String(subjectRow?.name || "subject"),
          questionCount,
          createdAt: String(item.created_at || ""),
          source: "teacher" as const,
        };
      })
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

  const { data, error } = await supabase
    .from("quizzes")
    .select(
      "id, subjects ( name ), questions ( id, question_text, question_type, options, correct_answer, hint, explanation, order_index )",
    )
    .eq("id", quizId)
    .order("order_index", { foreignTable: "questions", ascending: true })
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Quiz not found");
  }

  const questionItems = Array.isArray(data.questions) ? data.questions : [];
  const subjectRow = data.subjects as Record<string, unknown> | null;
  const subject = String(subjectRow?.name || "");

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

  try {
    const resolvedSessionId = sessionId || currentChatSessionId;
    let targetSessionId = resolvedSessionId;

    if (!targetSessionId) {
      const studentId = await resolveStudentId();
      if (studentId) {
        const { data } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("student_id", studentId)
          .order("started_at", { ascending: false })
          .limit(1);
        if (data?.length) {
          targetSessionId = String(data[0].id);
          setChatSessionId(targetSessionId);
        }
      }
    }

    if (targetSessionId) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender, message_text, timestamp")
        .eq("session_id", targetSessionId)
        .order("timestamp", { ascending: true })
        .limit(CHAT_HISTORY_LIMIT);

      if (!error && Array.isArray(data)) {
        return data.map((item) => ({
          _id: item.id,
          sender: item.sender,
          message_text: item.message_text,
          timestamp: item.timestamp,
        }));
      }
    }
  } catch {
    return [] as PersistedChatMessage[];
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

  try {
    const studentId = await resolveStudentId();
    if (studentId) {
      const { data: sessions } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("student_id", studentId)
        .order("started_at", { ascending: false })
        .limit(1);

      const latestSessionId = sessions?.[0]?.id
        ? String(sessions[0].id)
        : null;

      if (latestSessionId) {
        setChatSessionId(latestSessionId);
        const { data: messages, error } = await supabase
          .from("chat_messages")
          .select("id, sender, message_text, timestamp")
          .eq("session_id", latestSessionId)
          .order("timestamp", { ascending: true })
          .limit(CHAT_HISTORY_LIMIT);

        if (!error && Array.isArray(messages)) {
          return {
            sessionId: latestSessionId,
            messages: messages.map((item) => ({
              _id: item.id,
              sender: item.sender,
              message_text: item.message_text,
              timestamp: item.timestamp,
            })),
          };
        }
      }
    }
  } catch {
    return {
      sessionId: null as string | null,
      messages: [] as PersistedChatMessage[],
    };
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
        canvas_link:
          typeof data?.canvas_link === "string" ? data.canvas_link : null,
        suggestion_text:
          typeof data?.suggestion_text === "string"
            ? data.suggestion_text
            : null,
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
    current_page:
      typeof payload.current_page === "number" ? payload.current_page : null,
  };
};

export const fetchTextbookResources = async (
  payload: TextbookResourcesPayload,
): Promise<TextbookResourceItem[]> => {
  if (!HAS_TEXTBOOK_RESOURCES_BACKEND) {
    return [];
  }
  const backendQuery = new URLSearchParams({
    subject: payload.subject,
    grade: payload.grade,
  });

  if (payload.chapter?.trim()) {
    backendQuery.set("chapter", payload.chapter.trim());
  }

  try {
    const response = await fetch(
      `${VIRTUAL_LAB_RESOURCES_URL}?${backendQuery.toString()}`,
      {
        method: "GET",
      },
    );

    if (response.ok) {
      const data = await response.json();
      const rawItems = Array.isArray(data?.resources)
        ? data.resources
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const mappedItems = rawItems
        .map((item: unknown, index: number) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const record = item as Record<string, unknown>;
          const type = String(
            record.type || record.interaction_type || "",
          ).toLowerCase();
          const url =
            typeof record.url === "string"
              ? record.url.trim()
              : typeof record.resource_url === "string"
                ? record.resource_url.trim()
                : "";

          if ((type !== "canvas" && type !== "ar") || !url) {
            return null;
          }

          return {
            id:
              (typeof record.id === "string" && record.id.trim()) ||
              (typeof record._id === "string" && record._id.trim()) ||
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
            url: normalizeCanvasUrl(url, type as "canvas" | "ar"),
            page: typeof record.page === "number" ? record.page : null,
          };
        })
        .filter(Boolean) as TextbookResourceItem[];

      if (mappedItems.length > 0) {
        return mappedItems;
      }
    }
  } catch {
    // Fall back to the legacy AI/Python endpoints below.
  }

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
      const rawItems = Array.isArray(data?.resources)
        ? data.resources
        : Array.isArray(data?.data)
          ? data.data
          : [];
      return rawItems
        .map((item: unknown, index: number) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const record = item as Record<string, unknown>;
          const type = String(
            record.type || record.interaction_type || "",
          ).toLowerCase();
          const url =
            typeof record.url === "string"
              ? record.url.trim()
              : typeof record.resource_url === "string"
                ? record.resource_url.trim()
                : "";
          if ((type !== "canvas" && type !== "ar") || !url) {
            return null;
          }
          return {
            id:
              (typeof record.id === "string" && record.id.trim()) ||
              (typeof record._id === "string" && record._id.trim()) ||
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
            url: normalizeCanvasUrl(url, type as "canvas" | "ar"),
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

  const isAbortError =
    !!lastError &&
    typeof lastError === "object" &&
    "name" in lastError &&
    (lastError as { name?: string }).name === "AbortError";

  if (!isAbortError) {
    console.warn("Textbook resources unavailable:", lastError);
  }
  return [];
};

export const preloadTextbookContext = async (
  payload: TextbookPreloadPayload,
): Promise<void> => {
  if (!HAS_TEXTBOOK_RESOURCES_BACKEND) {
    return;
  }
  const endpointCandidates = unique([
    PYTHON_TEXTBOOK_PRELOAD_8011_URL,
    PYTHON_TEXTBOOK_PRELOAD_URL,
    PYTHON_TEXTBOOK_PRELOAD_8001_URL,
    TEXTBOOK_PRELOAD_URL,
  ]);

  for (const endpoint of endpointCandidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const useNodeHeaders = endpoint === TEXTBOOK_PRELOAD_URL;
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

      if (response.ok) {
        return;
      }
    } catch {
      // Best effort warm-up only.
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

export const fetchTextbookSelectionAsk = async (
  payload: TextbookSelectionAskPayload,
): Promise<TextbookSelectionAskResponse> => {
  const endpointCandidates = unique([
    PYTHON_TEXTBOOK_SELECTION_ASK_8011_URL,
    PYTHON_TEXTBOOK_SELECTION_ASK_URL,
    PYTHON_TEXTBOOK_SELECTION_ASK_8001_URL,
    TEXTBOOK_SELECTION_ASK_URL,
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
    response:
      "I cannot reach the textbook AI service right now. Please try again.",
    selected_text: payload.selected_text,
    message: "Selection ask is temporarily unavailable.",
    current_page:
      typeof payload.current_page === "number" ? payload.current_page : null,
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
      cover_image_url:
        typeof record.cover_image_url === "string"
          ? record.cover_image_url.trim() || null
          : null,
      source: record.source === "database" ? "database" : "catalog",
    };
  } catch {
    return null;
  }
};

const extractSubjectFromUrl = (url: string): SubjectName | null => {
  const match = String(url || "").match(
    /\/grade\d+\/(maths|math|chemistry|physics|biology)\//i,
  );
  const raw = String(match?.[1] || "").toLowerCase();
  if (raw === "maths" || raw === "math") return "math";
  if (raw === "chemistry") return "chemistry";
  if (raw === "physics") return "physics";
  if (raw === "biology") return "biology";
  return null;
};

const extractGradeFromUrl = (url: string): number | null => {
  const match = String(url || "").match(/\/grade(\d+)\//i);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const fetchAllCanvasLabResources = async (): Promise<
  LabCanvasResource[]
> => {
  try {
    const query = new URLSearchParams({
      interaction_type: "CANVAS",
      refresh: "1",
    });
    const response = await fetch(
      `${VIRTUAL_LAB_RESOURCES_URL}?${query.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawItems = Array.isArray(data?.resources)
      ? data.resources
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return rawItems
      .map((item: unknown, index: number) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as Record<string, unknown>;
        const type = String(
          record.type || record.interaction_type || "",
        ).toLowerCase();
        const url =
          typeof record.url === "string"
            ? record.url.trim()
            : typeof record.resource_url === "string"
              ? record.resource_url.trim()
              : "";

        if (type !== "canvas" || !url) {
          return null;
        }

        const gradeFromField =
          typeof record.grade_level === "number"
            ? record.grade_level
            : typeof record.grade_level === "string"
              ? Number.parseInt(record.grade_level, 10)
              : typeof record.grade === "number"
                ? record.grade
                : typeof record.grade === "string"
                  ? Number.parseInt(record.grade, 10)
                  : null;

        const resolvedGrade = Number.isFinite(Number(gradeFromField))
          ? Number(gradeFromField)
          : extractGradeFromUrl(url);

        const explicitSubject =
          typeof record.subject === "string"
            ? String(record.subject).toLowerCase().trim()
            : "";

        const subject =
          (explicitSubject === "biology" ||
          explicitSubject === "chemistry" ||
          explicitSubject === "physics" ||
          explicitSubject === "math"
            ? (explicitSubject as SubjectName)
            : extractSubjectFromUrl(url)) || null;

        if (!subject) {
          return null;
        }

        return {
          id:
            (typeof record.id === "string" && record.id.trim()) ||
            (typeof record._id === "string" && record._id.trim()) ||
            `canvas-${index + 1}`,
          subject,
          chapter:
            (typeof record.chapter === "string" && record.chapter.trim()) ||
            "General",
          topic:
            (typeof record.topic === "string" && record.topic.trim()) ||
            "General",
          title:
            (typeof record.title === "string" && record.title.trim()) ||
            (typeof record.topic === "string" && record.topic.trim()) ||
            "Canvas model",
          url: normalizeCanvasUrl(url, "canvas"),
          gradeLevel: resolvedGrade ?? undefined,
        };
      })
      .filter(Boolean) as LabCanvasResource[];
  } catch {
    return [];
  }
};

export const fetchAllArLabResources = async (): Promise<LabArResource[]> => {
  try {
    const query = new URLSearchParams({
      interaction_type: "AR",
      refresh: "1",
    });
    const response = await fetch(
      `${VIRTUAL_LAB_RESOURCES_URL}?${query.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rawItems = Array.isArray(data?.resources)
      ? data.resources
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return rawItems
      .map((item: unknown, index: number) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const type = String(
          record.type || record.interaction_type || "",
        ).toLowerCase();
        const url =
          typeof record.url === "string"
            ? record.url.trim()
            : typeof record.resource_url === "string"
              ? record.resource_url.trim()
              : "";

        if (type !== "ar" || !url) {
          return null;
        }

        const gradeFromField =
          typeof record.grade_level === "number"
            ? record.grade_level
            : typeof record.grade_level === "string"
              ? Number.parseInt(record.grade_level, 10)
              : typeof record.grade === "number"
                ? record.grade
                : typeof record.grade === "string"
                  ? Number.parseInt(record.grade, 10)
                  : null;

        const resolvedGrade = Number.isFinite(Number(gradeFromField))
          ? Number(gradeFromField)
          : extractGradeFromUrl(url);

        const explicitSubject =
          typeof record.subject === "string"
            ? String(record.subject).toLowerCase().trim()
            : "";

        const subject =
          (explicitSubject === "biology" ||
          explicitSubject === "chemistry" ||
          explicitSubject === "physics" ||
          explicitSubject === "math"
            ? (explicitSubject as SubjectName)
            : extractSubjectFromUrl(url)) || null;

        if (!subject) {
          return null;
        }

        return {
          id:
            (typeof record.id === "string" && record.id.trim()) ||
            (typeof record._id === "string" && record._id.trim()) ||
            `ar-${index + 1}`,
          subject,
          chapter:
            (typeof record.chapter === "string" && record.chapter.trim()) ||
            "General",
          topic:
            (typeof record.topic === "string" && record.topic.trim()) ||
            "General",
          title:
            (typeof record.title === "string" && record.title.trim()) ||
            (typeof record.topic === "string" && record.topic.trim()) ||
            "AR model",
          url,
          gradeLevel: resolvedGrade ?? undefined,
        };
      })
      .filter(Boolean) as LabArResource[];
  } catch {
    return [];
  }
};
