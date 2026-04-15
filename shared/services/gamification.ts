import Constants from "expo-constants";
import { Platform } from "react-native";
import { useSyncExternalStore } from "react";
import type { StudentProfile, SubjectName } from "../types/domain.types";
import { getAuthToken } from "./auth-service";
import { getStudentProfile, updateStudentProfile } from "../store/user-store";

export type AchievementId =
  | "first_step"
  | "perfect_score"
  | "teacher_trained"
  | "streak_3"
  | "twin_builder";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type GamificationState = {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  totalPracticeCompleted: number;
  teacherAssessmentsCompleted: number;
  aiPracticeCompleted: number;
  digitalTwinSignals: number;
  lastSubject: SubjectName | null;
  lastEventLabel: string;
  weeklyGoalTarget: number;
  achievements: Achievement[];
};

type CompletionPayload = {
  score: number;
  totalQuestions: number;
  subject: SubjectName;
  source: "teacher" | "ai";
};

type TwinProgressPayload = {
  xp_delta?: number;
  subject?: SubjectName;
  score?: number;
  totalQuestions?: number;
  mastery_percentage?: number;
  performance_band?: "support" | "medium" | "top" | "low";
  support_subjects?: SubjectName[];
  strong_subjects?: SubjectName[];
};

type SubjectPerformance = {
  attempts: number;
  average: number;
  lastScore: number;
};

const buildAchievement = (
  id: AchievementId,
  title: string,
  description: string,
  icon: string,
): Achievement => ({
  id,
  title,
  description,
  icon,
  unlocked: false,
  unlockedAt: null,
});

const defaultState: GamificationState = {
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  totalPracticeCompleted: 0,
  teacherAssessmentsCompleted: 0,
  aiPracticeCompleted: 0,
  digitalTwinSignals: 0,
  lastSubject: null,
  lastEventLabel: "No learning activity recorded yet.",
  weeklyGoalTarget: 5,
  achievements: [
    buildAchievement(
      "first_step",
      "First Step",
      "Complete your first learning session.",
      "footsteps-outline",
    ),
    buildAchievement(
      "perfect_score",
      "Perfect Score",
      "Finish a session with all answers correct.",
      "ribbon-outline",
    ),
    buildAchievement(
      "teacher_trained",
      "Teacher Trained",
      "Complete a teacher-provided quiz or assessment.",
      "school-outline",
    ),
    buildAchievement(
      "streak_3",
      "3-Day Streak",
      "Learn on three consecutive days.",
      "flame-outline",
    ),
    buildAchievement(
      "twin_builder",
      "Twin Builder",
      "Contribute enough evidence to strengthen your digital twin.",
      "sparkles-outline",
    ),
  ],
};

const listeners = new Set<() => void>();
let gamificationState = defaultState;
let localSubjectPerformance: Record<SubjectName, SubjectPerformance> = {
  biology: { attempts: 0, average: 0, lastScore: 0 },
  chemistry: { attempts: 0, average: 0, lastScore: 0 },
  physics: { attempts: 0, average: 0, lastScore: 0 },
  math: { attempts: 0, average: 0, lastScore: 0 },
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayKey = (todayKey: string) => {
  const date = new Date(`${todayKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
};

const unlockAchievement = (
  achievements: Achievement[],
  id: AchievementId,
  unlockedAt: string,
) =>
  achievements.map((achievement) =>
    achievement.id === id && !achievement.unlocked
      ? { ...achievement, unlocked: true, unlockedAt }
      : achievement,
  );

const updateState = (
  updater: (current: GamificationState) => GamificationState,
) => {
  gamificationState = updater(gamificationState);
  emitChange();
};

const normalizeScorePercent = (score: number, totalQuestions: number) => {
  if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((score / totalQuestions) * 100)));
};

const deriveSubjectsFromLocalPerformance = () => {
  const support: SubjectName[] = [];
  const strong: SubjectName[] = [];

  for (const [subject, details] of Object.entries(localSubjectPerformance) as Array<
    [SubjectName, SubjectPerformance]
  >) {
    if (details.attempts <= 0) continue;
    if (details.average >= 80) {
      strong.push(subject);
    } else if (details.average <= 55) {
      support.push(subject);
    }
  }

  return { support, strong };
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

  return sanitized.includes(":")
    ? sanitized.slice(0, sanitized.lastIndexOf(":"))
    : sanitized;
};

const resolveApiHost = () => {
  const explicitHost = process.env.EXPO_PUBLIC_AI_HOST?.trim();
  if (explicitHost) return explicitHost;

  const expoHost = extractHostFromExpo();
  if (expoHost) return expoHost;

  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const NODE_API_BASE_URL =
  process.env.EXPO_PUBLIC_NODE_API_BASE_URL || `http://${resolveApiHost()}:5000`;

export const syncTwinProgress = async (payload: TwinProgressPayload) => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${NODE_API_BASE_URL}/api/gamification/me/progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-auth-token": token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    const twinProfile = body?.data;
    if (twinProfile && typeof twinProfile === "object") {
      const updates: Partial<StudentProfile> = {};

      if (typeof twinProfile.mastery_percentage === "number") {
        updates.masteryScore = twinProfile.mastery_percentage;
      }
      if (twinProfile.performance_band === "top") {
        updates.performanceBand = "top";
      } else if (
        twinProfile.performance_band === "support" ||
        twinProfile.performance_band === "low"
      ) {
        updates.performanceBand = "support";
      } else if (twinProfile.performance_band === "medium") {
        updates.performanceBand = "medium";
      }
      if (Array.isArray(twinProfile.support_subjects)) {
        updates.supportSubjects = twinProfile.support_subjects;
      }
      if (Array.isArray(twinProfile.strong_subjects)) {
        updates.strongSubjects = twinProfile.strong_subjects;
      }
      if (typeof twinProfile.xp === "number") {
        updates.xp = twinProfile.xp;
      }
      if (typeof twinProfile.streak === "number") {
        updates.streak = twinProfile.streak;
      }
      if (typeof twinProfile.last_active === "string") {
        updates.lastActive = twinProfile.last_active;
      } else if (twinProfile.last_active === null) {
        updates.lastActive = null;
      }

      updateStudentProfile(updates);
    }

    return twinProfile || null;
  } catch {
    return null;
  }
};

export const getGamificationState = () => gamificationState;

export const recordPracticeCompletion = ({
  score,
  totalQuestions,
  subject,
  source,
}: CompletionPayload) => {
  const todayKey = toDateKey(new Date());
  const completionPercent = normalizeScorePercent(score, totalQuestions);

  if (subject) {
  const previous = localSubjectPerformance[subject] || { attempts: 0, average: 0, lastScore: 0 };
  const attempts = previous.attempts + 1;
  const average = Math.round((previous.average * previous.attempts + completionPercent) / attempts);
  localSubjectPerformance = {
    ...localSubjectPerformance,
    [subject]: { attempts, average, lastScore: completionPercent },
  };

  const derived = deriveSubjectsFromLocalPerformance();
  const currentProfile = getStudentProfile();
  updateStudentProfile({
    supportSubjects: derived.support.length > 0 ? derived.support : currentProfile.supportSubjects,
    strongSubjects: derived.strong.length > 0 ? derived.strong : currentProfile.strongSubjects,
    masteryScore: Math.max(currentProfile.masteryScore, completionPercent),
    performanceBand:
      completionPercent >= 80
        ? "top"
        : completionPercent <= 55
          ? "support"
          : currentProfile.performanceBand,
  });
  }

  updateState((current) => {
    let currentStreak = current.currentStreak;
    if (current.lastActiveDate !== todayKey) {
      currentStreak =
        current.lastActiveDate === getYesterdayKey(todayKey)
          ? current.currentStreak + 1
          : 1;
    }

    let achievements = current.achievements;
    achievements = unlockAchievement(achievements, "first_step", todayKey);

    if (completionPercent === 100) {
      achievements = unlockAchievement(achievements, "perfect_score", todayKey);
    }
    if (source === "teacher") {
      achievements = unlockAchievement(
        achievements,
        "teacher_trained",
        todayKey,
      );
    }
    if (currentStreak >= 3) {
      achievements = unlockAchievement(achievements, "streak_3", todayKey);
    }

    const digitalTwinSignals =
      current.digitalTwinSignals + (source === "teacher" ? 2 : 1);
    if (digitalTwinSignals >= 5) {
      achievements = unlockAchievement(achievements, "twin_builder", todayKey);
    }

    return {
      ...current,
      currentStreak,
      bestStreak: Math.max(current.bestStreak, currentStreak),
      lastActiveDate: todayKey,
      totalPracticeCompleted: current.totalPracticeCompleted + 1,
      teacherAssessmentsCompleted:
        current.teacherAssessmentsCompleted + (source === "teacher" ? 1 : 0),
      aiPracticeCompleted:
        current.aiPracticeCompleted + (source === "ai" ? 1 : 0),
      digitalTwinSignals,
      lastSubject: subject,
      lastEventLabel: `${subject} ${source === "teacher" ? "teacher quiz" : "AI practice"} completed with ${completionPercent}% accuracy`,
      achievements,
    };
  });

  void syncTwinProgress({
    xp_delta: Math.max(3, completionPercent >= 100 ? 10 : Math.round(completionPercent / 10) + 2),
    subject,
    score,
    totalQuestions,
  });
};

export const recordAssessmentCompletion = (
  subject: SubjectName,
  score: number,
  totalQuestions: number,
) => {
  recordPracticeCompletion({
    score,
    totalQuestions,
    subject,
    source: "teacher",
  });
};

export const resetGamificationState = () => {
  gamificationState = defaultState;
  localSubjectPerformance = {
    biology: { attempts: 0, average: 0, lastScore: 0 },
    chemistry: { attempts: 0, average: 0, lastScore: 0 },
    physics: { attempts: 0, average: 0, lastScore: 0 },
    math: { attempts: 0, average: 0, lastScore: 0 },
  };
  emitChange();
};

export const useGamification = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getGamificationState,
    getGamificationState,
  );
