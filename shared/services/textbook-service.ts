import type { SubjectName } from "../types/domain.types";
import type { ResolvedTextbookData } from "./ai-service";
import { supabase } from "./supabase-client";

export type { ResolvedTextbookData };

const subjectNameVariants = (subject: SubjectName): string[] => {
  if (subject === "math") return ["Mathematics", "Math", "Maths"];
  if (subject === "biology") return ["Biology"];
  if (subject === "chemistry") return ["Chemistry"];
  if (subject === "physics") return ["Physics"];
  return [subject];
};

const parseGradeLevel = (value: string | number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const fetchResolvedTextbook = async (
  subject: SubjectName,
  grade: string | number,
): Promise<ResolvedTextbookData | null> => {
  try {
    const gradeLevel = parseGradeLevel(grade);
    if (!gradeLevel) {
      return null;
    }

    const subjectNames = subjectNameVariants(subject);
    const { data: joinedTextbook, error: joinedError } = await supabase
      .from("textbooks")
      .select(
        "id, title, pdf_url, subjects!inner ( id, name, grade_level, cover_image_url )",
      )
      .in("subjects.name", subjectNames)
      .eq("subjects.grade_level", gradeLevel)
      .order("title", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!joinedError && joinedTextbook?.pdf_url) {
      const textbookUrl = String(joinedTextbook.pdf_url || "").trim();
      if (textbookUrl) {
        const subjectRow = joinedTextbook.subjects as
          | { cover_image_url?: string | null }
          | undefined;
        return {
          subject,
          grade_requested: gradeLevel,
          grade_served: gradeLevel,
          title:
            String(joinedTextbook.title || "Textbook").trim() || "Textbook",
          textbook_url: textbookUrl,
          cover_image_url:
            typeof subjectRow?.cover_image_url === "string"
              ? subjectRow.cover_image_url.trim() || null
              : null,
          source: "database",
        };
      }
    }

    const { data: titleMatches, error: titleError } = await supabase
      .from("textbooks")
      .select("id, title, pdf_url")
      .or(
        subjectNames.map((name) => `title.ilike.%${name}%`).join(","),
      )
      .order("title", { ascending: true })
      .limit(12);

    if (titleError || !Array.isArray(titleMatches) || !titleMatches.length) {
      return null;
    }

    const gradePattern = new RegExp(
      `\\bgrade\\s*${gradeLevel}\\b|\\bg${gradeLevel}\\b`,
      "i",
    );
    const matchedRow = titleMatches.find((row) =>
      gradePattern.test(String(row?.title || "")),
    );

    if (!matchedRow?.pdf_url) {
      return null;
    }

    const textbookUrl = String(matchedRow.pdf_url || "").trim();
    if (!textbookUrl) {
      return null;
    }

    return {
      subject,
      grade_requested: gradeLevel,
      grade_served: gradeLevel,
      title: String(matchedRow.title || "Textbook").trim() || "Textbook",
      textbook_url: textbookUrl,
      cover_image_url: null,
      source: "database",
    };
  } catch {
    return null;
  }
};
