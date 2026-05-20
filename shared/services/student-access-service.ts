import { fetchStudentProfile } from "./auth-service";
import { supabase } from "./supabase-client";
import {
  getUserSubscription,
  isSubscriptionActive,
} from "./subscription-service";

export const STUDENT_TRIAL_DAYS = 7;

const ACCESS_CACHE_MS = 45_000;

let cachedAccessStatus: StudentAccessStatus | null = null;
let cachedAccessStatusAt = 0;
let accessRequest: Promise<StudentAccessStatus> | null = null;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getTrialEndDate = (trialStartedAt?: string | null) => {
  if (!trialStartedAt) return null;
  const started = new Date(trialStartedAt);
  if (Number.isNaN(started.getTime())) return null;
  return addDays(started, STUDENT_TRIAL_DAYS);
};

export const getTrialDaysRemaining = (
  trialStartedAt?: string | null,
  now = new Date(),
) => {
  const trialEnd = getTrialEndDate(trialStartedAt);
  if (!trialEnd) return 0;
  const diffMs = startOfDay(trialEnd).getTime() - startOfDay(now).getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
};

export const isStudentTrialActive = (
  trialStartedAt?: string | null,
  now = new Date(),
) => {
  const trialEnd = getTrialEndDate(trialStartedAt);
  if (!trialEnd) return false;
  return now < trialEnd;
};

export type StudentAccessStatus = {
  isSubscribed: boolean;
  isOnTrial: boolean;
  hasLabAccess: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  trialExpired: boolean;
};

export const peekStudentAccessStatus = (): StudentAccessStatus | null => {
  if (!cachedAccessStatus) {
    return null;
  }
  if (Date.now() - cachedAccessStatusAt > ACCESS_CACHE_MS) {
    return null;
  }
  return cachedAccessStatus;
};

export const invalidateStudentAccessCache = () => {
  cachedAccessStatus = null;
  cachedAccessStatusAt = 0;
  accessRequest = null;
};

const computeStudentAccessStatus = async (): Promise<StudentAccessStatus> => {
  const [subscription, profile] = await Promise.all([
    getUserSubscription(),
    fetchStudentProfile().catch(() =>
      fetchStudentProfile({ forceRefresh: true }).catch(() => null),
    ),
  ]);

  let trialStartedAt = profile?.trial_started_at || null;

  if (!trialStartedAt && profile) {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (userId) {
      const now = new Date().toISOString();
      await supabase
        .from("student_profiles")
        .update({ trial_started_at: now })
        .eq("user_id", userId);
      trialStartedAt = now;
    }
  }

  const isSubscribed = isSubscriptionActive(subscription);
  const trialEndsAt = getTrialEndDate(trialStartedAt);
  const isOnTrial = !isSubscribed && isStudentTrialActive(trialStartedAt);
  const trialDaysLeft = isOnTrial ? getTrialDaysRemaining(trialStartedAt) : 0;
  const trialExpired =
    !isSubscribed &&
    Boolean(trialStartedAt) &&
    !isStudentTrialActive(trialStartedAt);
  const hasLabAccess = isSubscribed || isOnTrial;

  return {
    isSubscribed,
    isOnTrial,
    hasLabAccess,
    trialStartedAt,
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    trialDaysLeft,
    trialExpired,
  };
};

/**
 * Canvas / AR access: active paid subscription OR within 7-day trial.
 */
export const getStudentAccessStatus = async (options?: {
  forceRefresh?: boolean;
}): Promise<StudentAccessStatus> => {
  if (!options?.forceRefresh) {
    const cached = peekStudentAccessStatus();
    if (cached) {
      return cached;
    }
  }

  if (!options?.forceRefresh && accessRequest) {
    return accessRequest;
  }

  accessRequest = computeStudentAccessStatus()
    .then((status) => {
      cachedAccessStatus = status;
      cachedAccessStatusAt = Date.now();
      return status;
    })
    .finally(() => {
      accessRequest = null;
    });

  return accessRequest;
};

export const hasStudentLabAccess = async () => {
  const status = await getStudentAccessStatus();
  return status.hasLabAccess;
};
