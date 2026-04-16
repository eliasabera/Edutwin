export type SubjectName = "biology" | "chemistry" | "physics" | "math";

export type PerformanceBand = "support" | "medium" | "top";

export type PreferredLanguage = "en" | "om";

export interface StudentProfile {
  fullName: string;
  grade: string;
  masteryScore: number;
  performanceBand: PerformanceBand;
  preferredLanguage: PreferredLanguage;
  twinName: string;
  supportSubjects: SubjectName[];
  strongSubjects: SubjectName[];
  diagnosticCompleted: boolean;
  xp?: number;
  streak?: number;
  lastActive?: string | null;
  studentPhotoUri?: string;
  twinPhotoUri?: string;
}
