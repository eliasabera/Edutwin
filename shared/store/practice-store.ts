import { useSyncExternalStore } from "react";
import type { PerformanceBand, SubjectName } from "../types/domain.types";

export type PracticeQuestionType = "mcq" | "true_false" | "short";

export type PracticeQuestion = {
  type: PracticeQuestionType;
  question: string;
  options?: string[];
  answer: string;
  hint?: string;
  explanation: string;
};

export type PracticeSet = {
  id: string;
  title: string;
  source: "teacher" | "ai";
  subject: SubjectName;
  topic: string;
  questionTypes: PracticeQuestionType[];
  questionCount: number;
  createdAt: string;
  performanceBand?: PerformanceBand;
  questions: PracticeQuestion[];
};

const teacherPracticeSets: PracticeSet[] = [
  {
    id: "teacher-bio-unit-1-core",
    title: "Teacher Bank: Biology Unit 1 Essentials",
    source: "teacher",
    subject: "biology",
    topic: "Biology Unit 1",
    questionTypes: ["mcq", "true_false", "short"],
    questionCount: 3,
    createdAt: "Teacher upload",
    questions: [
      {
        type: "mcq",
        question: "Which organelle is known as the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Vacuole"],
        answer: "Mitochondria",
        explanation:
          "Mitochondria release energy from food, so they are called the powerhouse of the cell.",
      },
      {
        type: "true_false",
        question: "All living things are made of one or more cells.",
        options: ["True", "False"],
        answer: "True",
        explanation:
          "Cell theory states that all living organisms are made of one or more cells.",
      },
      {
        type: "short",
        question: "Write one reason why cells are important in biology.",
        options: [],
        answer: "Cells are the basic unit of life.",
        explanation:
          "Biology studies living things, and the cell is the basic structural and functional unit of life.",
      },
    ],
  },
];

let generatedPracticeSets: PracticeSet[] = [];
const listeners = new Set<() => void>();
let practiceLibrarySnapshot = {
  teacherPracticeSets,
  generatedPracticeSets,
};

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const saveGeneratedPracticeSet = (
  set: Omit<PracticeSet, "id" | "createdAt" | "source">,
) => {
  generatedPracticeSets = [
    {
      ...set,
      id: `ai-${Date.now()}`,
      source: "ai",
      createdAt: new Date().toLocaleString(),
    },
    ...generatedPracticeSets,
  ];
  practiceLibrarySnapshot = {
    teacherPracticeSets,
    generatedPracticeSets,
  };
  emitChange();
};

export const getPracticeLibrary = () => practiceLibrarySnapshot;

export const usePracticeLibrary = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPracticeLibrary,
    getPracticeLibrary,
  );
