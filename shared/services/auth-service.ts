import * as SecureStore from "expo-secure-store";
import type { StudentProfile } from "../types/domain.types";
import { supabase } from "./supabase-client";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  has_accepted_terms_policy?: boolean;
  terms_policy_accepted_at?: string | null;
};

export type StudentRegistrationPayload = {
  email: string;
  password: string;
  full_name: string;
  language: "en" | "om";
  grade_level: number;
  phone_number?: string;
  school_id?: string;
  section?: string;
  has_accepted_terms_policy?: boolean;
};

export type PublicSchoolOption = {
  _id: string;
  name: string;
};
export type BackendStudentProfile = {
  full_name?: string;
  language?: string;
  grade_level?: number;
  grade?: string | number;
  mastery_score?: number;
  performance_band?: "support" | "medium" | "top" | "low";
  twin_name?: string;
  support_subjects?: string[];
  strong_subjects?: string[];
  subject_scores?: Record<
    string,
    { average?: number; attempts?: number; last_score?: number }
  >;
  diagnostic_completed?: boolean;
  xp?: number;
  streak?: number;
  last_active?: string | null;
  student_photo_url?: string;
  twin_photo_url?: string;
  has_accepted_terms_policy?: boolean;
  terms_policy_accepted_at?: string | null;
  is_subscribed?: boolean;
  lab_bonus_unlock?: boolean;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_period_end?: string | null;
};

type StudentProfileUpdatePayload = Partial<{
  full_name: string;
  language: "en" | "om";
  preferred_language: "en" | "om";
  grade_level: number;
  grade: string;
  mastery_score: number;
  performance_band: "support" | "medium" | "top";
  twin_name: string;
  support_subjects: string[];
  strong_subjects: string[];
  diagnostic_completed: boolean;
  xp: number;
  streak: number;
  last_active: string | null;
  student_photo_url: string | null;
  twin_photo_url: string | null;
  has_accepted_terms_policy: boolean;
}>;


let authToken: string | null = null;
let currentUser: AuthUser | null = null;
let cachedStudentProfile: BackendStudentProfile | null = null;
const AUTH_TOKEN_STORAGE_KEY = "edutwin_auth_token";

const persistAuthToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Keep in-memory auth even if secure persistence is unavailable.
  }
};

const deletePersistedAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors on logout.
  }
};

const isInvalidRefreshTokenError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  return message.toLowerCase().includes("invalid refresh token");
};

const ensureAuthToken = async () => {
  if (authToken) return authToken;

  try {
    const restoredToken = await SecureStore.getItemAsync(
      AUTH_TOKEN_STORAGE_KEY,
    );
    if (restoredToken && restoredToken.trim()) {
      authToken = restoredToken.trim();
    }
  } catch {
    // Ignore storage read errors and keep normal missing-token behavior.
  }

  if (authToken) return authToken;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.access_token) {
      authToken = data.session.access_token;
      await persistAuthToken(authToken);
    }

    if (error && isInvalidRefreshTokenError(error)) {
      authToken = null;
      await deletePersistedAuthToken();
      await supabase.auth.signOut();
    }
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      authToken = null;
      await deletePersistedAuthToken();
      await supabase.auth.signOut();
    }
  }

  return authToken;
};

const ensureSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (isInvalidRefreshTokenError(error)) {
      authToken = null;
      await deletePersistedAuthToken();
      await supabase.auth.signOut();
      throw new Error("Session expired. Please login again.");
    }
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error("Missing auth session. Please login again.");
  }
  return data.session;
};

const parseJson = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

const extractErrorMessage = (body: unknown, fallback: string) => {
  if (!isRecord(body)) return fallback;
  if (typeof body.message === "string" && body.message.trim())
    return body.message;
  if (typeof body.error === "string" && body.error.trim()) return body.error;
  return fallback;
};

const extractPayload = <TData>(body: unknown): TData | null => {
  if (!isRecord(body)) return null;

  if ("data" in body) {
    return body.data as TData;
  }

  if ("profile" in body) {
    return body.profile as TData;
  }

  if ("user" in body) {
    return body.user as TData;
  }

  return body as TData;
};

const normalizeSubjectList = (items: unknown) => {
  if (!Array.isArray(items)) return [] as string[];
  return items
    .map((item) =>
      String(item || "")
        .trim()
        .toLowerCase(),
    )
    .filter((item) =>
      ["biology", "chemistry", "physics", "math"].includes(item),
    );
};

const deriveSubjectsFromScores = (
  scores?: BackendStudentProfile["subject_scores"],
) => {
  const support = new Set<string>();
  const strong = new Set<string>();

  if (!scores || typeof scores !== "object") {
    return { support: [], strong: [] };
  }

  for (const [subject, details] of Object.entries(scores)) {
    const normalizedSubject = String(subject || "")
      .trim()
      .toLowerCase();
    if (
      !["biology", "chemistry", "physics", "math"].includes(normalizedSubject)
    ) {
      continue;
    }
    const average =
      typeof details?.average === "number" ? details.average : null;
    const attempts =
      typeof details?.attempts === "number" ? details.attempts : 0;
    if (average === null || attempts < 1) {
      continue;
    }
    if (average >= 80) {
      strong.add(normalizedSubject);
      support.delete(normalizedSubject);
    } else if (average <= 55) {
      support.add(normalizedSubject);
      strong.delete(normalizedSubject);
    }
  }

  return { support: Array.from(support), strong: Array.from(strong) };
};

const buildDisjointSubjectLists = (profile: BackendStudentProfile) => {
  const derived = deriveSubjectsFromScores(profile.subject_scores);
  const supportSource = normalizeSubjectList(profile.support_subjects).length > 0
    ? normalizeSubjectList(profile.support_subjects)
    : derived.support;
  const strongSource = normalizeSubjectList(profile.strong_subjects).length > 0
    ? normalizeSubjectList(profile.strong_subjects)
    : derived.strong;

  const strongSet = new Set(strongSource);
  const supportSet = new Set(supportSource);
  for (const item of strongSet) {
    supportSet.delete(item);
  }

  return {
    supportSubjects: Array.from(supportSet) as StudentProfile["supportSubjects"],
    strongSubjects: Array.from(strongSet) as StudentProfile["strongSubjects"],
  };
};

const request = async <TData>(
  url: string,
  requestBody: Record<string, unknown>,
): Promise<TData> => {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${url}`,
    );
  }

  const responseBody = await parseJson(response);

  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const parsedPayload = extractPayload<TData>(responseBody);

  if (!response.ok || successFlag === false || !parsedPayload) {
    const message = extractErrorMessage(
      responseBody,
      "Authentication request failed",
    );
    throw new Error(message);
  }

  return parsedPayload;
};

const getRequest = async <TData>(url: string): Promise<TData> => {
  const token = await ensureAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let lastErrorMessage = "Failed to fetch profile";
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${url}`,
    );
  }

  const responseBody = await parseJson(response);
  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const payload = extractPayload<TData>(responseBody);

  if (response.ok && successFlag !== false && payload) {
    return payload;
  }

  lastErrorMessage = extractErrorMessage(responseBody, lastErrorMessage);

  throw new Error(lastErrorMessage);
};

const sendAuthorizedProfileUpdate = async (
  url: string,
  method: "PATCH" | "PUT",
  body: StudentProfileUpdatePayload,
) => {
  const token = await ensureAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let lastErrorMessage = "Failed to update profile";
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${url}`,
    );
  }

  const responseBody = await parseJson(response);
  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const payload = extractPayload<unknown>(responseBody);

  if (response.ok && successFlag !== false) {
    return payload;
  }

  lastErrorMessage = extractErrorMessage(responseBody, lastErrorMessage);

  throw new Error(lastErrorMessage);
};

const buildStudentProfileUpdatePayload = (
  updates: Partial<StudentProfile>,
): StudentProfileUpdatePayload => {
  const payload: StudentProfileUpdatePayload = {};

  if (typeof updates.fullName === "string") {
    payload.full_name = updates.fullName.trim();
  }
  if (
    updates.preferredLanguage === "en" ||
    updates.preferredLanguage === "om"
  ) {
    payload.language = updates.preferredLanguage;
    payload.preferred_language = updates.preferredLanguage;
  }
  if (typeof updates.grade === "string" && updates.grade.trim()) {
    payload.grade = updates.grade.trim();
    const parsedGrade = Number.parseInt(updates.grade, 10);
    if (Number.isFinite(parsedGrade)) {
      payload.grade_level = parsedGrade;
    }
  } else if (
    typeof updates.grade === "number" &&
    Number.isFinite(updates.grade)
  ) {
    payload.grade = String(updates.grade);
    payload.grade_level = updates.grade;
  }
  if (typeof updates.masteryScore === "number") {
    payload.mastery_score = updates.masteryScore;
  }
  if (
    updates.performanceBand === "support" ||
    updates.performanceBand === "medium" ||
    updates.performanceBand === "top"
  ) {
    payload.performance_band = updates.performanceBand;
  }
  if (typeof updates.twinName === "string") {
    payload.twin_name = updates.twinName.trim();
  }
  if (Array.isArray(updates.supportSubjects)) {
    payload.support_subjects = updates.supportSubjects;
  }
  if (Array.isArray(updates.strongSubjects)) {
    payload.strong_subjects = updates.strongSubjects;
  }
  if (typeof updates.diagnosticCompleted === "boolean") {
    payload.diagnostic_completed = updates.diagnosticCompleted;
  }
  if (typeof updates.xp === "number") {
    payload.xp = updates.xp;
  }
  if (typeof updates.streak === "number") {
    payload.streak = updates.streak;
  }
  if (typeof updates.lastActive === "string" || updates.lastActive === null) {
    payload.last_active = updates.lastActive;
  }
  if ("studentPhotoUri" in updates) {
    payload.student_photo_url = updates.studentPhotoUri?.trim() || null;
  }
  if ("twinPhotoUri" in updates) {
    payload.twin_photo_url = updates.twinPhotoUri?.trim() || null;
  }

  return payload;
};

const normalizeBackendProfile = (
  payload: unknown,
): BackendStudentProfile | null => {
  if (!isRecord(payload)) return null;

  // Direct profile object
  if (
    typeof payload.full_name === "string" ||
    typeof payload.grade_level === "number" ||
    typeof payload.grade === "number" ||
    typeof payload.grade === "string"
  ) {
    return payload as BackendStudentProfile;
  }

  // Common response shape: { user: {...}, profile: {...} }
  if ("profile" in payload && isRecord(payload.profile)) {
    const normalizedProfile = {
      ...payload.profile,
    } as BackendStudentProfile;

    if (
      isRecord(payload.user) &&
      typeof payload.user.has_accepted_terms_policy === "boolean"
    ) {
      normalizedProfile.has_accepted_terms_policy =
        payload.user.has_accepted_terms_policy;
      normalizedProfile.terms_policy_accepted_at =
        typeof payload.user.terms_policy_accepted_at === "string"
          ? payload.user.terms_policy_accepted_at
          : null;
    }

    return normalizedProfile;
  }

  return null;
};

const sha1 = (message: string) => {
  const toUtf8 = (input: string) =>
    unescape(encodeURIComponent(input));
  const msg = toUtf8(message);
  const msgLength = msg.length;
  const words: number[] = [];
  for (let i = 0; i < msgLength - 3; i += 4) {
    const j = msg.charCodeAt(i) << 24;
    const k = msg.charCodeAt(i + 1) << 16;
    const l = msg.charCodeAt(i + 2) << 8;
    const m = msg.charCodeAt(i + 3);
    words.push(j | k | l | m);
  }

  let i = 0;
  switch (msgLength % 4) {
    case 0:
      i = 0x080000000;
      break;
    case 1:
      i = (msg.charCodeAt(msgLength - 1) << 24) | 0x0800000;
      break;
    case 2:
      i =
        (msg.charCodeAt(msgLength - 2) << 24) |
        (msg.charCodeAt(msgLength - 1) << 16) |
        0x08000;
      break;
    case 3:
      i =
        (msg.charCodeAt(msgLength - 3) << 24) |
        (msg.charCodeAt(msgLength - 2) << 16) |
        (msg.charCodeAt(msgLength - 1) << 8) |
        0x80;
      break;
    default:
      i = 0x080000000;
  }
  words.push(i);

  while ((words.length % 16) !== 14) {
    words.push(0);
  }
  words.push(msgLength >>> 29);
  words.push((msgLength << 3) & 0x0ffffffff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const rotateLeft = (value: number, shift: number) =>
    (value << shift) | (value >>> (32 - shift));

  for (let blockStart = 0; blockStart < words.length; blockStart += 16) {
    const w: number[] = [];
    for (let t = 0; t < 16; t += 1) {
      w[t] = words[blockStart + t];
    }
    for (let t = 16; t < 80; t += 1) {
      w[t] = rotateLeft(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t += 1) {
      let f = 0;
      let k = 0;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + w[t]) & 0x0ffffffff;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) & 0x0ffffffff;
    h1 = (h1 + b) & 0x0ffffffff;
    h2 = (h2 + c) & 0x0ffffffff;
    h3 = (h3 + d) & 0x0ffffffff;
    h4 = (h4 + e) & 0x0ffffffff;
  }

  const toHex = (value: number) =>
    ("00000000" + value.toString(16)).slice(-8);

  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}`;
};

export const getCachedStudentProfile = () => cachedStudentProfile;

export const setCachedStudentProfile = (
  profile: BackendStudentProfile | null,
) => {
  cachedStudentProfile = profile;
};

export const mapBackendProfileToStudentProfile = (
  profile: BackendStudentProfile,
): Partial<StudentProfile> => {
  const { supportSubjects, strongSubjects } = buildDisjointSubjectLists(profile);

  return {
    fullName: profile.full_name?.trim() || "Student",
    grade: String(profile.grade_level ?? profile.grade ?? "9"),
    masteryScore:
      typeof profile.mastery_score === "number" ? profile.mastery_score : 55,
    performanceBand:
      profile.performance_band === "top"
        ? "top"
        : profile.performance_band === "support" ||
            profile.performance_band === "low"
          ? "support"
          : "medium",
    preferredLanguage: profile.language === "om" ? "om" : "en",
    twinName: profile.twin_name?.trim() || "EduTwin",
    supportSubjects,
    strongSubjects,
    diagnosticCompleted:
      typeof profile.diagnostic_completed === "boolean"
        ? profile.diagnostic_completed
        : false,
    xp: typeof profile.xp === "number" ? profile.xp : undefined,
    streak: typeof profile.streak === "number" ? profile.streak : undefined,
    lastActive: profile.last_active || null,
    studentPhotoUri:
      typeof profile.student_photo_url === "string"
        ? profile.student_photo_url.trim() || undefined
        : undefined,
    twinPhotoUri:
      typeof profile.twin_photo_url === "string"
        ? profile.twin_photo_url.trim() || undefined
        : undefined,
    isSubscribed: profile.is_subscribed === true,
    labBonusUnlock: profile.lab_bonus_unlock === true,
    subscriptionStatus: profile.subscription_status || null,
    subscriptionPeriodEnd: profile.subscription_period_end || null,
  };
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(error?.message || "Login failed");
  }

  const session = data.session;
  const userId = session.user.id;
  const { data: profileRow, error: profileError } = await supabase
    .from("user_profiles")
    .select("role, has_accepted_terms_policy, terms_policy_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const user: AuthUser = {
    id: userId,
    email: session.user.email || email,
    role: (profileRow?.role || "STUDENT") as UserRole,
    has_accepted_terms_policy: profileRow?.has_accepted_terms_policy || false,
    terms_policy_accepted_at: profileRow?.terms_policy_accepted_at || null,
  };

  authToken = session.access_token;
  await persistAuthToken(authToken);
  currentUser = user;

  return {
    user,
    token: authToken,
  };
};

export const registerStudent = async (payload: StudentRegistrationPayload) => {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const termsAccepted = payload.has_accepted_terms_policy === true;
  const termsAcceptedAt = termsAccepted ? new Date().toISOString() : null;

  const { data: signUpData, error: signUpError } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password: payload.password,
    });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  let session = signUpData.session;
  if (!session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: payload.password,
      });
    if (signInError || !signInData.session) {
      throw new Error(
        signInError?.message ||
          "Please confirm your email before logging in.",
      );
    }
    session = signInData.session;
  }

  const userId = session.user.id;

  const { error: userProfileError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        role: "STUDENT",
        has_accepted_terms_policy: termsAccepted,
        terms_policy_accepted_at: termsAcceptedAt,
      },
      { onConflict: "id" },
    );

  if (userProfileError) {
    throw new Error(userProfileError.message);
  }

  const { data: studentRow, error: studentError } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: userId,
        full_name: payload.full_name,
        phone_number: payload.phone_number || null,
        language: payload.language,
        grade_level: payload.grade_level,
        school_id: payload.school_id || null,
        section: payload.section || null,
      },
      { onConflict: "user_id" },
    )
    .select("full_name, language, grade_level, school_id, section")
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  const user: AuthUser = {
    id: userId,
    email: normalizedEmail,
    role: "STUDENT",
    has_accepted_terms_policy: termsAccepted,
    terms_policy_accepted_at: termsAcceptedAt,
  };

  authToken = session.access_token;
  await persistAuthToken(authToken);
  currentUser = user;

  return {
    user,
    profile: studentRow
      ? {
          full_name: studentRow.full_name,
          language: studentRow.language,
          grade_level: studentRow.grade_level,
          school_id: studentRow.school_id,
          section: studentRow.section,
        }
      : null,
    token: authToken,
  };
};

export const fetchPublicSchools = async (): Promise<PublicSchoolOption[]> => {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => ({
    _id: item.id,
    name: item.name || "School",
  }));
};

export const hydrateAuthToken = async () => {
  return ensureAuthToken();
};

export const fetchStudentProfile = async (options?: {
  forceRefresh?: boolean;
}): Promise<BackendStudentProfile> => {
  if (cachedStudentProfile && !options?.forceRefresh) {
    return cachedStudentProfile;
  }

  const session = await ensureSession();

  const { data, error } = await supabase
    .from("student_profiles")
    .select(
      "id, full_name, language, grade_level, school_id, section, student_photo_url, twin_profiles ( twin_name, twin_photo_url, xp, streak, last_active, lab_bonus_unlock, support_subjects, strong_subjects, subject_scores, mastery_percentage, performance_band )",
    )
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Failed to fetch profile");
  }

  const twinProfile = Array.isArray(data.twin_profiles)
    ? data.twin_profiles[0]
    : data.twin_profiles;

  const normalized: BackendStudentProfile = {
    full_name: data.full_name,
    language: data.language,
    grade_level: data.grade_level,
    school_id: data.school_id,
    section: data.section,
    student_photo_url: data.student_photo_url,
    twin_name: twinProfile?.twin_name,
    twin_photo_url: twinProfile?.twin_photo_url,
    xp: twinProfile?.xp,
    streak: twinProfile?.streak,
    last_active: twinProfile?.last_active,
    lab_bonus_unlock: twinProfile?.lab_bonus_unlock,
    support_subjects: twinProfile?.support_subjects,
    strong_subjects: twinProfile?.strong_subjects,
    subject_scores: twinProfile?.subject_scores,
    mastery_score: twinProfile?.mastery_percentage,
    performance_band: twinProfile?.performance_band,
  };

  cachedStudentProfile = normalized;
  return normalized;
};

export const saveStudentProfile = async (
  updates: Partial<StudentProfile>,
): Promise<BackendStudentProfile> => {
  const payload = buildStudentProfileUpdatePayload(updates);
  if (!Object.keys(payload).length) {
    return fetchStudentProfile();
  }

  const session = await ensureSession();

  let { data: studentRow, error: studentError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  if (!studentRow) {
    const fallbackGrade =
      typeof payload.grade_level === "number"
        ? payload.grade_level
        : typeof payload.grade === "string"
          ? Number.parseInt(payload.grade, 10)
          : 9;
    const resolvedGrade = Number.isFinite(fallbackGrade) ? fallbackGrade : 9;
    const insertPayload = {
      user_id: session.user.id,
      full_name: payload.full_name || "Student",
      language: payload.language || "en",
      grade_level: resolvedGrade,
      student_photo_url:
        "student_photo_url" in payload ? payload.student_photo_url : null,
      school_id: null,
      section: null,
    };

    const { data: created, error: createError } = await supabase
      .from("student_profiles")
      .insert(insertPayload)
      .select("id")
      .single();

    if (createError || !created) {
      throw new Error(createError?.message || "Failed to create student profile");
    }

    studentRow = created;
  }

  const studentUpdates: Record<string, unknown> = {};
  if (typeof payload.full_name === "string") {
    studentUpdates.full_name = payload.full_name;
  }
  if (payload.language) {
    studentUpdates.language = payload.language;
  }
  if (typeof payload.grade_level === "number") {
    studentUpdates.grade_level = payload.grade_level;
  }
  if ("student_photo_url" in payload) {
    studentUpdates.student_photo_url = payload.student_photo_url;
  }

  if (Object.keys(studentUpdates).length) {
    const { error: updateError } = await supabase
      .from("student_profiles")
      .update(studentUpdates)
      .eq("id", studentRow.id);
    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const twinUpdates: Record<string, unknown> = {};
  if (typeof payload.twin_name === "string") {
    twinUpdates.twin_name = payload.twin_name;
  }
  if ("twin_photo_url" in payload) {
    twinUpdates.twin_photo_url = payload.twin_photo_url;
  }
  if (Array.isArray(payload.support_subjects)) {
    twinUpdates.support_subjects = payload.support_subjects;
  }
  if (Array.isArray(payload.strong_subjects)) {
    twinUpdates.strong_subjects = payload.strong_subjects;
  }
  if (typeof payload.xp === "number") {
    twinUpdates.xp = payload.xp;
  }
  if (typeof payload.streak === "number") {
    twinUpdates.streak = payload.streak;
  }
  if (typeof payload.last_active === "string" || payload.last_active === null) {
    twinUpdates.last_active = payload.last_active;
  }

  if (Object.keys(twinUpdates).length) {
    const { data: existingTwin, error: existingTwinError } = await supabase
      .from("twin_profiles")
      .select("id")
      .eq("student_id", studentRow.id)
      .maybeSingle();

    if (existingTwinError) {
      throw new Error(existingTwinError.message);
    }

    if (existingTwin?.id) {
      const { error: twinError } = await supabase
        .from("twin_profiles")
        .update(twinUpdates)
        .eq("student_id", studentRow.id);
      if (twinError) {
        throw new Error(twinError.message);
      }
    } else {
      const { error: twinError } = await supabase
        .from("twin_profiles")
        .insert({
          student_id: studentRow.id,
          performance_band: "medium",
          mastery_percentage: 55,
          xp: 0,
          lab_bonus_unlock: false,
          streak: 0,
          last_active: new Date().toISOString(),
          ...twinUpdates,
        });
      if (twinError) {
        throw new Error(twinError.message);
      }
    }
  }

  const refreshedProfile = await fetchStudentProfile({
    forceRefresh: true,
  });
  cachedStudentProfile = refreshedProfile;
  return refreshedProfile;
};

export const saveTermsPolicyAgreement = async (accepted: boolean) => {
  const session = await ensureSession();
  const termsPolicyAcceptedAt = accepted ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      has_accepted_terms_policy: accepted,
      terms_policy_accepted_at: termsPolicyAcceptedAt,
    })
    .eq("id", session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return fetchStudentProfile({ forceRefresh: true });
};

export const redeemLabBonusUnlock = async () => {
  const session = await ensureSession();

  const { data: studentRow, error: studentError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (studentError || !studentRow?.id) {
    throw new Error(studentError?.message || "Student profile not found");
  }

  let { data: twinRow, error: twinError } = await supabase
    .from("twin_profiles")
    .select("id, xp, lab_bonus_unlock")
    .eq("student_id", studentRow.id)
    .maybeSingle();

  if (twinError) {
    throw new Error(twinError.message);
  }

  if (!twinRow) {
    const { data: created, error: createError } = await supabase
      .from("twin_profiles")
      .insert({
        student_id: studentRow.id,
        performance_band: "medium",
        mastery_percentage: 0,
        xp: 0,
        lab_bonus_unlock: false,
        streak: 0,
        last_active: new Date().toISOString(),
      })
      .select("id, xp, lab_bonus_unlock")
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    twinRow = created;
  }

  if (twinRow.lab_bonus_unlock) {
    return fetchStudentProfile({ forceRefresh: true });
  }

  if (Number(twinRow.xp || 0) < 2000) {
    throw new Error("At least 2000 XP is required to unlock the lab bonus");
  }

  const { error: updateError } = await supabase
    .from("twin_profiles")
    .update({
      lab_bonus_unlock: true,
      xp: 0,
      last_active: new Date().toISOString(),
    })
    .eq("student_id", studentRow.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const refreshedProfile = await fetchStudentProfile({
    forceRefresh: true,
  });
  cachedStudentProfile = refreshedProfile;
  return refreshedProfile;
};

export const uploadStudentPhoto = async (
  localUri: string,
): Promise<{ student_photo_url: string; public_id?: string }> => {
  const session = await ensureSession();
  const normalizedUri = String(localUri || "").trim();
  if (!normalizedUri) {
    throw new Error("Student photo URI is required");
  }
  const fileName = normalizedUri.split("/").pop() || "student-photo.jpg";
  const extension =
    fileName.includes(".") && fileName.split(".").pop()
      ? fileName.split(".").pop()
      : "jpg";
  const mimeType = `image/${String(extension).toLowerCase()}`;

  const cloudName = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "",
  ).trim();
  const apiKey = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY ||
      "",
  ).trim();
  const apiSecret = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET ||
      process.env.CLOUDINARY_API_SECRET ||
      "",
  ).trim();
  const uploadPreset = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  ).trim();
  if (!cloudName || !apiKey) {
    throw new Error("Missing Cloudinary credentials");
  }
  if (!uploadPreset && !apiSecret) {
    throw new Error(
      "Missing Cloudinary upload preset or API secret for signed upload",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "edutwin/student-photos";
  const publicId = `student_${session.user.id}_${Date.now()}`;
  const signature =
    uploadPreset || !apiSecret
      ? ""
      : sha1(
          `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`,
        );

  const formData = new FormData();
  formData.append("file", {
    uri: normalizedUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append("api_key", apiKey);
  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
  } else {
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);
  }

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(message || "Cloudinary upload failed");
  }

  const payload = (await uploadResponse.json()) as {
    secure_url?: string;
    public_id?: string;
  };
  const secureUrl = String(payload?.secure_url || "").trim();

  if (!secureUrl) {
    throw new Error("Cloudinary did not return a secure URL");
  }

  return {
    student_photo_url: secureUrl,
    public_id: payload?.public_id,
  };
};

export const uploadStudentPhotoFromProfile = async (
  localUri: string,
): Promise<{ student_photo_url: string; public_id?: string }> => {
  return uploadStudentPhoto(localUri);
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  currentUser = null;
  cachedStudentProfile = null;
  void deletePersistedAuthToken();
};
