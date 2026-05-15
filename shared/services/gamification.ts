import { useSyncExternalStore } from "react";
import type { StudentProfile, SubjectName } from "../types/domain.types";
import { supabase } from "./supabase-client";
import { getAppSettings } from "../store/settings-store";
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
  supportSignals: number;
  strongSignals: number;
};

type TutorSignalKind = "support" | "strong" | "neutral";

type TutorInteractionSignal = {
  kind: TutorSignalKind;
  scoreHint?: number;
};

type SubjectHistoryEntry = {
  average?: number;
  attempts?: number;
  last_score?: number;
  updated_at?: string;
};

type TwinProfileRow = {
  id: string;
  student_id: string;
  performance_band: string;
  mastery_percentage: number;
  twin_name?: string;
  twin_photo_url?: string | null;
  strong_subjects: SubjectName[];
  support_subjects: SubjectName[];
  subject_scores: Record<string, SubjectHistoryEntry>;
  xp: number;
  lab_bonus_unlock: boolean;
  streak: number;
  last_active: string | null;
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
  biology: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
  chemistry: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
  physics: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
  math: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
};

const SUBJECTS = new Set<SubjectName>([
  "biology",
  "chemistry",
  "physics",
  "math",
]);

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

const normalizeSubject = (subject: unknown) => {
  const value = String(subject || "").trim().toLowerCase() as SubjectName;
  return SUBJECTS.has(value) ? value : null;
};

const normalizeSubjectList = (items: unknown) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeSubject(item)).filter(Boolean) as SubjectName[];
};

const sanitizeTwinSubjects = ({ strong = [], support = [] }: {
  strong?: SubjectName[];
  support?: SubjectName[];
}) => {
  const strongSet = new Set(normalizeSubjectList(strong));
  const supportSet = new Set(normalizeSubjectList(support));

  for (const item of strongSet) {
    supportSet.delete(item);
  }

  return {
    strong_subjects: Array.from(strongSet),
    support_subjects: Array.from(supportSet),
  };
};

const normalizeSubjectHistory = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, SubjectHistoryEntry>;
};

const updateSubjectHistory = (
  currentHistory: unknown,
  subject: SubjectName | null,
  completionPercent: number | null,
) => {
  const history = { ...normalizeSubjectHistory(currentHistory) };
  if (!subject || completionPercent === null || completionPercent === undefined) {
    return history;
  }

  const previous =
    history[subject] && typeof history[subject] === "object" ? history[subject] : {};
  const attempts = Number(previous.attempts || 0) + 1;
  const lastScore = Number(completionPercent);
  const previousAverage =
    typeof previous.average === "number" ? previous.average : lastScore;
  const average = Math.round(
    (previousAverage * Math.max(0, attempts - 1) + lastScore) / attempts,
  );

  history[subject] = {
    average,
    attempts,
    last_score: lastScore,
    updated_at: new Date().toISOString(),
  };

  return history;
};

const deriveSubjectsFromHistory = (subjectHistory: unknown) => {
  const entries = Object.entries(normalizeSubjectHistory(subjectHistory))
    .map(([subject, details]) => ({
      subject,
      average: typeof details?.average === "number" ? details.average : null,
      attempts: Number(details?.attempts || 0),
    }))
    .filter((item) => item.average !== null);

  const strong: SubjectName[] = [];
  const support: SubjectName[] = [];

  for (const item of entries) {
    if (item.average !== null && item.average >= 80 && item.attempts >= 1) {
      strong.push(item.subject as SubjectName);
    } else if (item.average !== null && item.average <= 55 && item.attempts >= 1) {
      support.push(item.subject as SubjectName);
    }
  }

  return {
    strong_subjects: strong,
    support_subjects: support,
  };
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
    if (details.average >= 80 || details.strongSignals >= 2) {
      strong.push(subject);
    } else if (details.average <= 55 || details.supportSignals >= 2) {
      support.push(subject);
    }
  }

  return { support, strong };
};

const applySoftSubjectSignal = (
  subject: SubjectName | undefined,
  signal: TutorInteractionSignal,
) => {
  if (!subject || signal.kind === "neutral") {
    return;
  }

  const previous = localSubjectPerformance[subject] || {
    attempts: 0,
    average: 0,
    lastScore: 0,
    supportSignals: 0,
    strongSignals: 0,
  };

  const softScore =
    typeof signal.scoreHint === "number"
      ? signal.scoreHint
      : signal.kind === "strong"
        ? 85
        : 45;

  const attempts = previous.attempts + 1;
  const average = Math.round(
    (previous.average * previous.attempts + softScore) / attempts,
  );

  const supportSignals = previous.supportSignals + (signal.kind === "support" ? 1 : 0);
  const strongSignals = previous.strongSignals + (signal.kind === "strong" ? 1 : 0);

  localSubjectPerformance = {
    ...localSubjectPerformance,
    [subject]: { attempts, average, lastScore: softScore, supportSignals, strongSignals },
  };
};

const resolveStudentId = async () => {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { data: studentRow, error: studentError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", sessionData.session.user.id)
    .maybeSingle();

  if (studentError || !studentRow?.id) {
    throw new Error("Student profile not found");
  }

  return studentRow.id as string;
};

const fetchTwinProfile = async (studentId: string) => {
  const { data, error } = await supabase
    .from("twin_profiles")
    .select(
      "id, student_id, performance_band, mastery_percentage, twin_name, twin_photo_url, strong_subjects, support_subjects, subject_scores, xp, lab_bonus_unlock, streak, last_active",
    )
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TwinProfileRow | null;
};

const ensureTwinProfile = async (
  studentId: string,
  updates: TwinProgressPayload = {},
) => {
  const existing = await fetchTwinProfile(studentId);
  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from("twin_profiles")
    .insert({
      student_id: studentId,
      performance_band: updates.performance_band || "medium",
      mastery_percentage:
        typeof updates.mastery_percentage === "number"
          ? updates.mastery_percentage
          : 0,
      strong_subjects: Array.isArray(updates.strong_subjects)
        ? updates.strong_subjects
        : [],
      support_subjects: Array.isArray(updates.support_subjects)
        ? updates.support_subjects
        : [],
      subject_scores: {},
      xp: 0,
      streak: 0,
      lab_bonus_unlock: false,
      last_active: new Date().toISOString(),
    })
    .select(
      "id, student_id, performance_band, mastery_percentage, twin_name, twin_photo_url, strong_subjects, support_subjects, subject_scores, xp, lab_bonus_unlock, streak, last_active",
    )
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created as TwinProfileRow;
};

const applyTwinUpdate = (
  twinProfile: TwinProfileRow,
  payload: TwinProgressPayload,
) => {
  const todayKey = toDateKey(new Date());
  const lastActiveKey = twinProfile.last_active
    ? toDateKey(new Date(twinProfile.last_active))
    : null;

  const xpDelta = Number(payload.xp_delta || 0);
  twinProfile.xp = Math.max(0, Number(twinProfile.xp || 0) + xpDelta);

  if (todayKey && lastActiveKey !== todayKey) {
    twinProfile.streak =
      lastActiveKey === getYesterdayKey(todayKey)
        ? Number(twinProfile.streak || 0) + 1
        : 1;
  } else if (Number(twinProfile.streak || 0) <= 0) {
    twinProfile.streak = 1;
  }

  const subject = normalizeSubject(payload.subject);
  const score = payload.score !== undefined ? Number(payload.score) : null;
  const totalQuestions =
    payload.totalQuestions !== undefined
      ? Number(payload.totalQuestions)
      : null;
  const completionPercent =
    score !== null && totalQuestions && totalQuestions > 0
      ? Math.round((score / totalQuestions) * 100)
      : null;

  if (typeof payload.mastery_percentage === "number") {
    twinProfile.mastery_percentage = payload.mastery_percentage;
  } else if (completionPercent !== null) {
    twinProfile.mastery_percentage = Math.max(
      Number(twinProfile.mastery_percentage || 0),
      completionPercent,
    );
  }

  if (payload.performance_band) {
    twinProfile.performance_band = payload.performance_band;
  } else if (completionPercent !== null) {
    twinProfile.performance_band =
      completionPercent >= 80
        ? "top"
        : completionPercent <= 55
          ? "support"
          : "medium";
  }

  const strongSubjects = new Set(
    Array.isArray(twinProfile.strong_subjects) ? twinProfile.strong_subjects : [],
  );
  const supportSubjects = new Set(
    Array.isArray(twinProfile.support_subjects)
      ? twinProfile.support_subjects
      : [],
  );

  const payloadStrong = normalizeSubjectList(payload.strong_subjects);
  const payloadSupport = normalizeSubjectList(payload.support_subjects);
  for (const item of payloadStrong) {
    strongSubjects.add(item);
    supportSubjects.delete(item);
  }
  for (const item of payloadSupport) {
    supportSubjects.add(item);
    strongSubjects.delete(item);
  }

  if (subject && completionPercent !== null) {
    twinProfile.subject_scores = updateSubjectHistory(
      twinProfile.subject_scores,
      subject,
      completionPercent,
    );
    if (completionPercent >= 80) {
      strongSubjects.add(subject);
      supportSubjects.delete(subject);
    } else if (completionPercent <= 55) {
      supportSubjects.add(subject);
      strongSubjects.delete(subject);
    }
  }

  const derived = deriveSubjectsFromHistory(twinProfile.subject_scores);
  for (const item of derived.strong_subjects) {
    strongSubjects.add(item);
    supportSubjects.delete(item);
  }
  for (const item of derived.support_subjects) {
    supportSubjects.add(item);
    strongSubjects.delete(item);
  }

  const sanitized = sanitizeTwinSubjects({
    strong: Array.from(strongSubjects),
    support: Array.from(supportSubjects),
  });

  twinProfile.strong_subjects = sanitized.strong_subjects;
  twinProfile.support_subjects = sanitized.support_subjects;
  twinProfile.last_active = new Date().toISOString();

  return twinProfile;
};

const persistTwinProfile = async (twinProfile: TwinProfileRow) => {
  const payload = {
    student_id: twinProfile.student_id,
    performance_band: twinProfile.performance_band,
    mastery_percentage: twinProfile.mastery_percentage,
    twin_name: twinProfile.twin_name,
    twin_photo_url: twinProfile.twin_photo_url || null,
    strong_subjects: twinProfile.strong_subjects || [],
    support_subjects: twinProfile.support_subjects || [],
    subject_scores: twinProfile.subject_scores || {},
    xp: twinProfile.xp || 0,
    lab_bonus_unlock: !!twinProfile.lab_bonus_unlock,
    streak: twinProfile.streak || 0,
    last_active: twinProfile.last_active || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("twin_profiles")
    .upsert(payload, { onConflict: "student_id" })
    .select(
      "id, student_id, performance_band, mastery_percentage, twin_name, twin_photo_url, strong_subjects, support_subjects, subject_scores, xp, lab_bonus_unlock, streak, last_active",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TwinProfileRow;
};

export const syncTwinProgress = async (payload: TwinProgressPayload) => {
  if (!getAppSettings().autoSyncTwinProgress) {
    return null;
  }

  try {
    const studentId = await resolveStudentId();
    const twinProfile = await ensureTwinProfile(studentId, payload);
    const updated = applyTwinUpdate(twinProfile, payload);
    const persisted = await persistTwinProfile(updated);

    if (persisted && typeof persisted === "object") {
      const updates: Partial<StudentProfile> = {};

      if (typeof persisted.mastery_percentage === "number") {
        updates.masteryScore = persisted.mastery_percentage;
      }
      if (persisted.performance_band === "top") {
        updates.performanceBand = "top";
      } else if (
        persisted.performance_band === "support" ||
        persisted.performance_band === "low"
      ) {
        updates.performanceBand = "support";
      } else if (persisted.performance_band === "medium") {
        updates.performanceBand = "medium";
      }
      if (Array.isArray(persisted.support_subjects)) {
        updates.supportSubjects = persisted.support_subjects;
      }
      if (Array.isArray(persisted.strong_subjects)) {
        updates.strongSubjects = persisted.strong_subjects;
      }
      if (typeof persisted.xp === "number") {
        updates.xp = persisted.xp;
      }
      if (typeof persisted.streak === "number") {
        updates.streak = persisted.streak;
      }
      if (typeof persisted.last_active === "string") {
        updates.lastActive = persisted.last_active;
      } else if (persisted.last_active === null) {
        updates.lastActive = null;
      }

      updateStudentProfile(updates);
    }

    return persisted || null;
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
  const currentProfile = getStudentProfile();

  if (subject) {
  const previous = localSubjectPerformance[subject] || { attempts: 0, average: 0, lastScore: 0 };
  const attempts = previous.attempts + 1;
  const average = Math.round((previous.average * previous.attempts + completionPercent) / attempts);
  localSubjectPerformance = {
    ...localSubjectPerformance,
    [subject]: { attempts, average, lastScore: completionPercent },
  };

  const derived = deriveSubjectsFromLocalPerformance();
  updateStudentProfile({
    supportSubjects: derived.support,
    strongSubjects: derived.strong,
    masteryScore: Math.max(currentProfile.masteryScore, completionPercent),
    performanceBand:
      completionPercent >= 80
        ? "top"
        : completionPercent <= 55
          ? "support"
          : "medium",
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

  if ((currentProfile.streak ?? 0) < gamificationState.currentStreak) {
    updateStudentProfile({
      streak: gamificationState.currentStreak,
      lastActive: todayKey,
    });
  }

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

export const recordTutorInteraction = (
  subject?: SubjectName,
  signal: TutorInteractionSignal = { kind: "neutral" },
) => {
  const todayKey = toDateKey(new Date());

  applySoftSubjectSignal(subject, signal);

  const derived = deriveSubjectsFromLocalPerformance();
  const currentProfile = getStudentProfile();
  updateStudentProfile({
    supportSubjects: derived.support,
    strongSubjects: derived.strong,
  });

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
    if (currentStreak >= 3) {
      achievements = unlockAchievement(achievements, "streak_3", todayKey);
    }

    const digitalTwinSignals = current.digitalTwinSignals + 1;
    if (digitalTwinSignals >= 5) {
      achievements = unlockAchievement(achievements, "twin_builder", todayKey);
    }

    return {
      ...current,
      currentStreak,
      bestStreak: Math.max(current.bestStreak, currentStreak),
      lastActiveDate: todayKey,
      aiPracticeCompleted: current.aiPracticeCompleted + 1,
      digitalTwinSignals,
      lastSubject: subject || current.lastSubject,
      lastEventLabel: `${subject || "general"} AI tutor interaction recorded`,
      achievements,
    };
  });

  if ((currentProfile.streak ?? 0) < gamificationState.currentStreak) {
    updateStudentProfile({
      streak: gamificationState.currentStreak,
      lastActive: todayKey,
    });
  }

  void syncTwinProgress({
    xp_delta: 2,
    subject,
    support_subjects: derived.support,
    strong_subjects: derived.strong,
  });
};

export const classifyTutorPrompt = (prompt: string): TutorInteractionSignal => {
  const normalized = prompt.trim().toLowerCase();

  if (!normalized) {
    return { kind: "neutral" };
  }

  const supportPatterns = [
    /\bsimple\b/,
    /\bmore detail\b/,
    /\bmore details\b/,
    /\bstep by step\b/,
    /\bexplain\b/,
    /\beasy\b/,
    /\brepeat\b/,
    /\bagain\b/,
    /\bi don't understand\b/,
    /\bi do not understand\b/,
    /\bconfused\b/,
  ];

  const strongPatterns = [
    /\badvanced\b/,
    /\bdeeper\b/,
    /\bmore challenging\b/,
    /\bchallenge\b/,
    /\bquiz me\b/,
    /\btest me\b/,
    /\bapply\b/,
    /\bbeyond\b/,
  ];

  if (supportPatterns.some((pattern) => pattern.test(normalized))) {
    return { kind: "support", scoreHint: 40 };
  }

  if (strongPatterns.some((pattern) => pattern.test(normalized))) {
    return { kind: "strong", scoreHint: 88 };
  }

  return { kind: "neutral" };
};

export const resetGamificationState = () => {
  gamificationState = defaultState;
  localSubjectPerformance = {
    biology: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
    chemistry: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
    physics: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
    math: { attempts: 0, average: 0, lastScore: 0, supportSignals: 0, strongSignals: 0 },
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
