import { useSyncExternalStore } from "react";
import type { StudentProfile } from "../types/domain.types";

const defaultStudentProfile: StudentProfile = {
  fullName: "Grade 9 Student",
  grade: "9",
  masteryScore: 55,
  performanceBand: "medium",
  preferredLanguage: "en",
  twinName: "EduTwin Grade 9",
  supportSubjects: ["physics"],
  strongSubjects: ["biology"],
  diagnosticCompleted: false,
};

let studentProfile = defaultStudentProfile;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const getStudentProfile = () => studentProfile;

export const updateStudentProfile = (updates: Partial<StudentProfile>) => {
  studentProfile = {
    ...studentProfile,
    ...updates,
    twinName: updates.twinName ?? "EduTwin Grade 9",
  };
  emitChange();
};

export const resetStudentProfile = () => {
  studentProfile = defaultStudentProfile;
  emitChange();
};

export const useStudentProfile = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getStudentProfile,
    getStudentProfile,
  );
