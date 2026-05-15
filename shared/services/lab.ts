import { supabase } from "./supabase-client";
import type { SubjectName } from "../types/domain.types";

export type LabCanvasResource = {
  id: string;
  subject: SubjectName;
  chapter: string;
  title: string;
  topic: string;
  url: string;
  gradeLevel?: number;
};

export type LabArResource = {
  id: string;
  subject: SubjectName;
  chapter: string;
  title: string;
  topic: string;
  url: string;
  gradeLevel?: number;
};

const CANVAS_MODEL_HOST = "fyp3d-view.onrender.com";

const normalizeCanvasUrl = (url: string, type: "canvas" | "ar"): string => {
  const trimmed = String(url || "").trim();
  if (!trimmed || type !== "canvas") {
    return trimmed;
  }

  return trimmed.replace(
    /https?:\/\/threed-view-for-final-year-project\.onrender\.com/gi,
    `https://${CANVAS_MODEL_HOST}`,
  );
};

const extractSubjectFromUrl = (url: string): SubjectName | null => {
  const match = String(url || "").match(
    /\/grade\d+\/(maths|math|chemistry|physics|biology)\//i,
  );
  const raw = String(match?.[1] || "").toLowerCase();
  if (raw === "maths" || raw === "math") return "math";
  if (raw === "chemistry") return "chemistry";
  if (raw === "physics") return "physics";
  if (raw === "biology") return "biology";
  return null;
};

const normalizeSubjectName = (value: unknown): SubjectName | null => {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === "math" || raw === "mathematics" || raw === "maths") return "math";
  if (raw === "chemistry") return "chemistry";
  if (raw === "physics") return "physics";
  if (raw === "biology") return "biology";
  return null;
};

const resolveGrade = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mapLabResource = (
  record: Record<string, unknown>,
  fallbackIndex: number,
  type: "canvas" | "ar",
): LabCanvasResource | LabArResource | null => {
  const url =
    typeof record.resource_url === "string"
      ? record.resource_url.trim()
      : typeof record.url === "string"
        ? record.url.trim()
        : "";

  if (!url) {
    return null;
  }

  const subjectRow = record.subjects as Record<string, unknown> | null;
  const subject =
    normalizeSubjectName(subjectRow?.name) ||
    normalizeSubjectName(record.subject) ||
    extractSubjectFromUrl(url);

  if (!subject) {
    return null;
  }

  const gradeLevel = resolveGrade(record.grade_level) ?? resolveGrade(record.grade);

  return {
    id:
      (typeof record.id === "string" && record.id.trim()) ||
      `lab-${type}-${fallbackIndex + 1}`,
    subject,
    chapter:
      (typeof record.chapter === "string" && record.chapter.trim()) || "General",
    topic: (typeof record.topic === "string" && record.topic.trim()) || "General",
    title:
      (typeof record.title === "string" && record.title.trim()) ||
      (typeof record.topic === "string" && record.topic.trim()) ||
      (type === "canvas" ? "Canvas model" : "AR model"),
    url: type === "canvas" ? normalizeCanvasUrl(url, "canvas") : url,
    gradeLevel: gradeLevel ?? undefined,
  };
};

export const fetchAllCanvasLabResources = async (): Promise<
  LabCanvasResource[]
> => {
  try {
    const { data, error } = await supabase
      .from("virtual_lab_resources")
      .select(
        "id, chapter, topic, title, resource_url, grade_level, subjects ( name )",
      )
      .eq("interaction_type", "CANVAS")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || [])
      .map((item, index) => mapLabResource(item, index, "canvas"))
      .filter(Boolean) as LabCanvasResource[];
  } catch {
    return [];
  }
};

export const fetchAllArLabResources = async (): Promise<LabArResource[]> => {
  try {
    const { data, error } = await supabase
      .from("virtual_lab_resources")
      .select(
        "id, chapter, topic, title, resource_url, grade_level, subjects ( name )",
      )
      .eq("interaction_type", "AR")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || [])
      .map((item, index) => mapLabResource(item, index, "ar"))
      .filter(Boolean) as LabArResource[];
  } catch {
    return [];
  }
};
