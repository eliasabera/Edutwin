import { useSyncExternalStore } from "react";
import type { SubjectName } from "../types/domain.types";

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

export const getGamificationState = () => gamificationState;

export const recordPracticeCompletion = ({
  score,
  totalQuestions,
  subject,
  source,
}: CompletionPayload) => {
  const todayKey = toDateKey(new Date());
  const completionPercent =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

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
