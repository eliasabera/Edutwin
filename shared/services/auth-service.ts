import { Platform } from "react-native";
import Constants from "expo-constants";
import type { StudentProfile } from "../types/domain.types";

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type AuthUser = {
	id: string;
	email: string;
	role: UserRole;
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
	diagnostic_completed?: boolean;
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

const PROFILE_URL = process.env.EXPO_PUBLIC_AUTH_PROFILE_URL || DEFAULT_PROFILE_URL;
const DEFAULT_PROFILE_FALLBACK_URLS = [
	`http://${AUTH_HOST}:5000/api/auth/me`,
	`http://${AUTH_HOST}:5000/api/profile/me`,
	`http://${AUTH_HOST}:5000/api/students/me`,
];

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
	if (typeof body.message === "string" && body.message.trim()) return body.message;
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
		throw new Error(`Network request failed. Check backend reachability at ${url}`);
	}

	const responseBody = await parseJson(response);

	const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
	const parsedPayload = extractPayload<TData>(responseBody);

	if (!response.ok || successFlag === false || !parsedPayload) {
		const message = extractErrorMessage(responseBody, "Authentication request failed");
		throw new Error(message);
	}

	return parsedPayload;
};

const getRequest = async <TData>(url: string): Promise<TData> => {
	if (!authToken) {
		throw new Error("Missing auth token. Please login again.");
	}

	const headerVariants: Array<Record<string, string>> = [
		{
			Authorization: `Bearer ${authToken}`,
			"x-auth-token": authToken,
			"Content-Type": "application/json",
		},
		{
			Authorization: authToken,
			"x-auth-token": authToken,
			"Content-Type": "application/json",
		},
		{
			"x-access-token": authToken,
			token: authToken,
			"Content-Type": "application/json",
		},
	];

	let lastErrorMessage = "Failed to fetch profile";

	for (const headers of headerVariants) {
		let response: Response;
		try {
			response = await fetch(url, {
				method: "GET",
				headers,
			});
		} catch {
			lastErrorMessage = `Network request failed. Check backend reachability at ${url}`;
			break;
		}

		const responseBody = await parseJson(response);
		const successFlag = isRecord(responseBody) ? responseBody.success : undefined;
		const payload = extractPayload<TData>(responseBody);

		if (response.ok && successFlag !== false && payload) {
			return payload;
		}

		lastErrorMessage = extractErrorMessage(responseBody, lastErrorMessage);

		if (response.status !== 401 && response.status !== 403) {
			break;
		}
	}

	throw new Error(lastErrorMessage);
};

const getProfileCandidateUrls = () => {
	const urls = [PROFILE_URL, ...PROFILE_FALLBACK_URLS];
	if (currentUser?.id) {
		urls.push(`http://${AUTH_HOST}:5000/api/users/${currentUser.id}`);
	}

	const seen = new Set<string>();
	return urls.filter((url) => {
		if (seen.has(url)) return false;
		seen.add(url);
		return true;
	});
};

const normalizeBackendProfile = (payload: unknown): BackendStudentProfile | null => {
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
		return payload.profile as BackendStudentProfile;
	}

	return null;
};

export const getCachedStudentProfile = () => cachedStudentProfile;

export const setCachedStudentProfile = (profile: BackendStudentProfile | null) => {
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
			: profile.performance_band === "support" || profile.performance_band === "low"
				? "support"
				: "medium",
	preferredLanguage: profile.language === "om" ? "om" : "en",
	twinName: profile.twin_name?.trim() || "EduTwin",
	supportSubjects: (profile.support_subjects || []).filter((item) =>
		["biology", "chemistry", "physics", "math"].includes(item),
	) as StudentProfile["supportSubjects"],
	strongSubjects: (profile.strong_subjects || []).filter((item) =>
		["biology", "chemistry", "physics", "math"].includes(item),
	) as StudentProfile["strongSubjects"],
	diagnosticCompleted:
		typeof profile.diagnostic_completed === "boolean"
			? profile.diagnostic_completed
			: false,
});

export const loginUser = async (email: string, password: string) => {
	const data = await request<LoginResponseData>(LOGIN_URL, {
		email,
		password,
	});
	authToken = data.token;
	currentUser = data.user;
	return data;
};

export const registerStudent = async (payload: StudentRegistrationPayload) => {
	const data = await request<RegisterResponseData>(REGISTER_URL, {
		...payload,
		role: "STUDENT",
	});
	authToken = data.token;
	currentUser = data.user;
	return data;
};

export const fetchStudentProfile = async (): Promise<BackendStudentProfile> => {
	if (cachedStudentProfile) {
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

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
	authToken = null;
	currentUser = null;
	cachedStudentProfile = null;
};
