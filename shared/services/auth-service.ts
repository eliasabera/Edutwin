import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { StudentProfile } from "../types/domain.types";

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
};

type AuthApiResponse<TData> = {
  success: boolean;
  message: string;
  data?: TData;
  error?: string;
};

type UnknownRecord = Record<string, unknown>;

export type LoginResponseData = {
  user: AuthUser;
  token: string;
};

export type RegisterResponseData = {
  user: AuthUser;
  profile: {
    full_name?: string;
    language?: string;
    grade_level?: number;
    school_id?: string | null;
    section?: string | null;
  } | null;
  token: string;
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

const resolveAuthHost = () => {
  const explicitHost = process.env.EXPO_PUBLIC_AUTH_HOST?.trim();
  if (explicitHost) return explicitHost;

  const expoHost = extractHostFromExpo();
  if (expoHost) return expoHost;

  // Keep emulator-friendly fallback when no LAN host can be detected.
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const AUTH_HOST = resolveAuthHost();
const DEFAULT_REGISTER_URL = `http://${AUTH_HOST}:5000/api/auth/register`;

const REGISTER_URL =
  process.env.EXPO_PUBLIC_AUTH_REGISTER_URL || DEFAULT_REGISTER_URL;

const LOGIN_URL =
  process.env.EXPO_PUBLIC_AUTH_LOGIN_URL ||
  (REGISTER_URL.match(/\/register\/?$/)
    ? REGISTER_URL.replace(/\/register\/?$/, "/login")
    : `http://${AUTH_HOST}:5000/api/auth/login`);

const DEFAULT_PROFILE_URL = `http://${AUTH_HOST}:5000/api/users/me`;
const DEFAULT_UPLOAD_STUDENT_PHOTO_URL =
  `http://${AUTH_HOST}:5000/api/uploads/student-photo`;

const PROFILE_URL =
  process.env.EXPO_PUBLIC_AUTH_PROFILE_URL || DEFAULT_PROFILE_URL;
const UPLOAD_STUDENT_PHOTO_URL =
  process.env.EXPO_PUBLIC_AUTH_UPLOAD_STUDENT_PHOTO_URL ||
  DEFAULT_UPLOAD_STUDENT_PHOTO_URL;
const DEFAULT_PROFILE_FALLBACK_URLS = [`http://${AUTH_HOST}:5000/api/users/me`];

const PROFILE_FALLBACK_URLS = (
  process.env.EXPO_PUBLIC_AUTH_PROFILE_FALLBACK_URLS ||
  DEFAULT_PROFILE_FALLBACK_URLS.join(",")
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

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

  return authToken;
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

const getProfileCandidateUrls = () => {
  const urls = [PROFILE_URL, ...PROFILE_FALLBACK_URLS];

  const seen = new Set<string>();
  return urls.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
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
  } else if (typeof updates.grade === "number" && Number.isFinite(updates.grade)) {
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

export const getCachedStudentProfile = () => cachedStudentProfile;

export const setCachedStudentProfile = (
  profile: BackendStudentProfile | null,
) => {
  cachedStudentProfile = profile;
};

export const mapBackendProfileToStudentProfile = (
  profile: BackendStudentProfile,
): Partial<StudentProfile> => ({
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
  supportSubjects:
    normalizeSubjectList(profile.support_subjects).length > 0
      ? (normalizeSubjectList(
          profile.support_subjects,
        ) as StudentProfile["supportSubjects"])
      : (deriveSubjectsFromScores(profile.subject_scores)
          .support as StudentProfile["supportSubjects"]),
  strongSubjects:
    normalizeSubjectList(profile.strong_subjects).length > 0
      ? (normalizeSubjectList(
          profile.strong_subjects,
        ) as StudentProfile["strongSubjects"])
      : (deriveSubjectsFromScores(profile.subject_scores)
          .strong as StudentProfile["strongSubjects"]),
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
});

export const loginUser = async (email: string, password: string) => {
  const data = await request<LoginResponseData>(LOGIN_URL, {
    email,
    password,
  });
  authToken = data.token;
  await persistAuthToken(data.token);
  currentUser = data.user;
  return data;
};

export const registerStudent = async (payload: StudentRegistrationPayload) => {
  const data = await request<RegisterResponseData>(REGISTER_URL, {
    ...payload,
    role: "STUDENT",
  });
  authToken = data.token;
  await persistAuthToken(data.token);
  currentUser = data.user;
  return data;
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

  const urls = getProfileCandidateUrls();
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const rawPayload = await getRequest<unknown>(url);
      const normalized = normalizeBackendProfile(rawPayload);
      if (normalized) {
        cachedStudentProfile = normalized;
        return normalized;
      }
      lastError = new Error("Profile payload shape is not recognized");
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error("Failed to fetch profile");
      }
    }
  }

  throw lastError || new Error("Failed to fetch profile");
};

export const saveStudentProfile = async (
  updates: Partial<StudentProfile>,
): Promise<BackendStudentProfile> => {
  const payload = buildStudentProfileUpdatePayload(updates);
  if (!Object.keys(payload).length) {
    return fetchStudentProfile();
  }

  const urls = getProfileCandidateUrls();
  let lastError: Error | null = null;

  for (const url of urls) {
    for (const method of ["PATCH", "PUT"] as const) {
      try {
        const rawPayload = await sendAuthorizedProfileUpdate(
          url,
          method,
          payload,
        );
        const normalized = normalizeBackendProfile(rawPayload);
        if (normalized) {
          cachedStudentProfile = normalized;
          return normalized;
        }

        const refreshedProfile = await fetchStudentProfile({
          forceRefresh: true,
        });
        cachedStudentProfile = refreshedProfile;
        return refreshedProfile;
      } catch (error) {
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error("Failed to update profile");
        }
      }
    }
  }

  throw lastError || new Error("Failed to update profile");
};

export const saveTermsPolicyAgreement = async (accepted: boolean) => {
  const urls = getProfileCandidateUrls();
  let lastError: Error | null = null;

  for (const url of urls) {
    for (const method of ["PATCH", "PUT"] as const) {
      try {
        const rawPayload = await sendAuthorizedProfileUpdate(url, method, {
          has_accepted_terms_policy: accepted,
        });
        const normalized = normalizeBackendProfile(rawPayload);
        if (normalized) {
          cachedStudentProfile = normalized;
          return normalized;
        }
        return fetchStudentProfile({ forceRefresh: true });
      } catch (error) {
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error("Failed to update terms agreement");
        }
      }
    }
  }

  throw lastError || new Error("Failed to update terms agreement");
};

export const redeemLabBonusUnlock = async () => {
  const token = await ensureAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

  let response: Response;
  try {
    response = await fetch(`${NODE_API_BASE_URL}/api/gamification/me/redeem-lab-bonus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${NODE_API_BASE_URL}`,
    );
  }

  const responseBody = await parseJson(response);
  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const payload = extractPayload<BackendStudentProfile>(responseBody);

  if (!response.ok || successFlag === false || !payload) {
    const message = extractErrorMessage(responseBody, "Failed to redeem lab bonus");
    throw new Error(message);
  }

  cachedStudentProfile = payload;
  return payload;
};

export const uploadStudentPhoto = async (
  localUri: string,
): Promise<{ student_photo_url: string; public_id?: string }> => {
  const token = await ensureAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

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

  const formData = new FormData();
  formData.append("photo", {
    uri: normalizedUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(UPLOAD_STUDENT_PHOTO_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${UPLOAD_STUDENT_PHOTO_URL}`,
    );
  }

  const responseBody = await parseJson(response);
  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const payload = extractPayload<
    { student_photo_url?: string; public_id?: string } | undefined
  >(responseBody);

  if (
    response.ok &&
    successFlag !== false &&
    payload &&
    typeof payload.student_photo_url === "string" &&
    payload.student_photo_url.trim()
  ) {
    return {
      student_photo_url: payload.student_photo_url.trim(),
      public_id:
        typeof payload.public_id === "string" ? payload.public_id : undefined,
    };
  }

  throw new Error(
    extractErrorMessage(responseBody, "Failed to upload student photo"),
  );
};

export const uploadStudentPhotoFromProfile = async (
  localUri: string,
): Promise<{ student_photo_url: string; public_id?: string }> => {
  const token = await ensureAuthToken();
  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

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

  const formData = new FormData();
  formData.append("student_photo", {
    uri: normalizedUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(PROFILE_URL, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    throw new Error(
      `Network request failed. Check backend reachability at ${PROFILE_URL}`,
    );
  }

  const responseBody = await parseJson(response);
  const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
  const payload = extractPayload<UnknownRecord | undefined>(responseBody);

  const topLevelUrl =
    isRecord(payload) && typeof payload.student_photo_url === "string"
      ? payload.student_photo_url.trim()
      : "";
  const nestedUrl =
    isRecord(payload) &&
    isRecord(payload.profile) &&
    typeof payload.profile.student_photo_url === "string"
      ? payload.profile.student_photo_url.trim()
      : "";
  const publicId =
    isRecord(payload) && typeof payload.public_id === "string"
      ? payload.public_id
      : undefined;

  if (
    response.ok &&
    successFlag !== false &&
    (topLevelUrl || nestedUrl)
  ) {
    return {
      student_photo_url: topLevelUrl || nestedUrl,
      public_id: publicId,
    };
  }

  throw new Error(
    extractErrorMessage(responseBody, "Failed to upload student photo"),
  );
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  currentUser = null;
  cachedStudentProfile = null;
  void deletePersistedAuthToken();
};
