import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase-client";
import { resolveCurrentUser } from "./auth-service";

export type CommunityClass = {
  id: string;
  name: string;
  subject_name?: string | null;
  teacher_id?: string | null;
  teacher_user_id?: string | null;
};

export type ChatGroup = {
  id: string;
  class_id: string;
  name: string | null;
  created_by: string | null;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  group_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
};

export type ChatMember = {
  user_id: string;
  role: string;
  name: string;
};

const isAmbiguousGroupIdError = (message: string) =>
  /group_id.*ambiguous|ambiguous.*group_id/i.test(String(message || ""));

const parseGradeSectionFromClassName = (name: string) => {
  const normalized = String(name || "").trim();
  const compactMatch = normalized.match(/^Grade\s+(\d+)\s+([A-Za-z0-9]+)$/i);
  if (compactMatch) {
    return {
      grade: Number.parseInt(compactMatch[1], 10),
      section: String(compactMatch[2] || "")
        .trim()
        .toUpperCase(),
    };
  }
  const legacyMatch = normalized.match(
    /Grade\s+(\d+)\s+Section\s+([A-Za-z0-9]+)/i,
  );
  if (legacyMatch) {
    return {
      grade: Number.parseInt(legacyMatch[1], 10),
      section: String(legacyMatch[2] || "")
        .trim()
        .toUpperCase(),
    };
  }
  return { grade: null as number | null, section: null as string | null };
};

/** Display name without subject suffix — e.g. "Grade 12 Section A". */
export const formatClassDisplayName = (
  name?: string | null,
  gradeLevel?: number | null,
  section?: string | null,
): string => {
  const parsed = parseGradeSectionFromClassName(String(name || ""));
  const grade =
    typeof gradeLevel === "number" && Number.isFinite(gradeLevel)
      ? gradeLevel
      : parsed.grade;
  const sectionValue = section
    ? String(section).trim().toUpperCase()
    : parsed.section;

  if (grade && sectionValue) {
    return `Grade ${grade} Section ${sectionValue}`;
  }
  if (grade) {
    return `Grade ${grade}`;
  }

  const raw = String(name || "").trim();
  const withoutSubject = raw.split(/\s*[-–—|:]\s*/)[0]?.trim();
  if (withoutSubject) {
    const fallbackParsed = parseGradeSectionFromClassName(withoutSubject);
    if (fallbackParsed.grade && fallbackParsed.section) {
      return `Grade ${fallbackParsed.grade} Section ${fallbackParsed.section}`;
    }
    return withoutSubject;
  }

  return "Class";
};

export const getChatGroupDisplayName = (
  classInfo: Pick<CommunityClass, "name">,
  group?: Pick<ChatGroup, "name"> | null,
): string => {
  const fromGroup = String(group?.name || "").trim();
  if (fromGroup) {
    return formatClassDisplayName(fromGroup);
  }
  return formatClassDisplayName(classInfo.name);
};

type StudentProfileRow = {
  id: string;
  school_id?: string | null;
  grade_level?: number | null;
  section?: string | null;
};

const getStudentProfile = async (userId: string): Promise<StudentProfileRow> => {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("id, school_id, grade_level, section")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(error?.message || "Student profile not found");
  }

  return data as StudentProfileRow;
};

const loadTeacherUserIds = async (teacherProfileIds: string[]) => {
  const teacherUserByProfileId = new Map<string, string>();
  if (!teacherProfileIds.length) {
    return teacherUserByProfileId;
  }

  const { data: teachers, error: teacherError } = await supabase
    .from("teacher_profiles")
    .select("id, user_id")
    .in("id", teacherProfileIds);

  if (!teacherError && teachers) {
    for (const teacher of teachers) {
      if (teacher.id && teacher.user_id) {
        teacherUserByProfileId.set(teacher.id, teacher.user_id);
      }
    }
  }

  return teacherUserByProfileId;
};

type ClassRow = {
  id: string;
  name?: string | null;
  teacher_id?: string | null;
  subjects?: { name?: string } | { name?: string }[] | null;
};

const mapClassRows = async (classRows: ClassRow[]): Promise<CommunityClass[]> => {
  const teacherProfileIds = [
    ...new Set(classRows.map((row) => row.teacher_id).filter(Boolean)),
  ] as string[];
  const teacherUserByProfileId = await loadTeacherUserIds(teacherProfileIds);

  return classRows.map((row) => {
    const subjectRow = Array.isArray(row.subjects)
      ? row.subjects[0]
      : row.subjects;
    return {
      id: row.id,
      name: formatClassDisplayName(row.name),
      teacher_id: row.teacher_id || null,
      teacher_user_id: row.teacher_id
        ? teacherUserByProfileId.get(row.teacher_id) || null
        : null,
      subject_name:
        (typeof subjectRow?.name === "string" && subjectRow.name) || null,
    };
  });
};

const fetchClassesByIds = async (classIds: string[]) => {
  if (!classIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("classes")
    .select("id, name, teacher_id, subjects ( name )")
    .in("id", classIds);

  if (error && !isAmbiguousGroupIdError(error.message)) {
    throw new Error(error.message);
  }

  return (data || []) as ClassRow[];
};

const loadClassesFromChatMembership = async (
  userId: string,
): Promise<CommunityClass[]> => {
  const { data: memberRows, error: memberError } = await supabase
    .from("community_chat_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("role", "student");

  if (memberError && !isAmbiguousGroupIdError(memberError.message)) {
    throw new Error(memberError.message);
  }

  const groupIds = (memberRows || []).map((row) => row.group_id).filter(Boolean);
  if (!groupIds.length) {
    return [];
  }

  const { data: groupRows, error: groupError } = await supabase
    .from("community_chat_groups")
    .select("class_id, name")
    .in("id", groupIds);

  if (groupError && !isAmbiguousGroupIdError(groupError.message)) {
    throw new Error(groupError.message);
  }

  const classIds = [
    ...new Set((groupRows || []).map((row) => row.class_id).filter(Boolean)),
  ] as string[];

  if (!classIds.length) {
    return (groupRows || [])
      .filter((row) => row.class_id)
      .map((row) => ({
        id: row.class_id as string,
        name: formatClassDisplayName(row.name),
        teacher_id: null,
        teacher_user_id: null,
        subject_name: null,
      }));
  }

  const classRows = await fetchClassesByIds(classIds);
  if (classRows.length) {
    return mapClassRows(classRows);
  }

  return (groupRows || [])
    .filter((row) => row.class_id)
    .map((row) => ({
      id: row.class_id as string,
      name: formatClassDisplayName(row.name),
      teacher_id: null,
      teacher_user_id: null,
      subject_name: null,
    }));
};

const loadClassesFromEnrollments = async (studentProfileId: string) => {
  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from("student_enrollments")
    .select("class_id")
    .eq("student_id", studentProfileId);

  if (enrollmentError && !isAmbiguousGroupIdError(enrollmentError.message)) {
    throw new Error(enrollmentError.message);
  }

  const classIds = [
    ...new Set(
      (enrollmentRows || []).map((row) => row.class_id).filter(Boolean),
    ),
  ] as string[];

  if (!classIds.length) {
    return [];
  }

  const classRows = await fetchClassesByIds(classIds);
  return mapClassRows(classRows);
};

const loadClassesFromProfileMatch = async (profile: StudentProfileRow) => {
  if (!profile?.school_id || profile.grade_level == null || !profile.section) {
    return [];
  }

  const { data: schoolClasses, error } = await supabase
    .from("classes")
    .select("id, name, teacher_id, subjects ( name )")
    .eq("school_id", profile.school_id);

  if (error && !isAmbiguousGroupIdError(error.message)) {
    return [];
  }

  const section = String(profile.section).trim().toUpperCase();
  const grade = Number(profile.grade_level);
  const matched = (schoolClasses || []).filter((row) => {
    const parsed = parseGradeSectionFromClassName(String(row.name || ""));
    return parsed.grade === grade && parsed.section === section;
  });

  return mapClassRows(matched as ClassRow[]);
};

export const getStudentClasses = async (): Promise<CommunityClass[]> => {
  const user = await resolveCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const profile = await getStudentProfile(user.id);
  const classById = new Map<string, CommunityClass>();

  const merge = (items: CommunityClass[]) => {
    for (const item of items) {
      if (item?.id) {
        classById.set(item.id, item);
      }
    }
  };

  merge(await loadClassesFromEnrollments(profile.id));
  merge(await loadClassesFromChatMembership(user.id));

  if (!classById.size) {
    merge(await loadClassesFromProfileMatch(profile));
  }

  return [...classById.values()];
};

export const getOrCreateChatGroup = async (
  classInfo: CommunityClass,
): Promise<ChatGroup> => {
  const user = await resolveCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const { data: existing, error: existingError } = await supabase
    .from("community_chat_groups")
    .select("*")
    .eq("class_id", classInfo.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const displayName = formatClassDisplayName(classInfo.name);

  if (existing) {
    if (existing.name !== displayName) {
      await supabase
        .from("community_chat_groups")
        .update({ name: displayName })
        .eq("id", existing.id);
      return { ...(existing as ChatGroup), name: displayName };
    }
    return existing as ChatGroup;
  }

  const { data: created, error } = await supabase
    .from("community_chat_groups")
    .insert({
      class_id: classInfo.id,
      name: displayName,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(error?.message || "Failed to create chat group");
  }

  return created as ChatGroup;
};

export const ensureTeacherMember = async (
  groupId: string,
  teacherUserId: string | null | undefined,
) => {
  if (!teacherUserId) return;
  await ensureGroupMember(groupId, teacherUserId, "teacher");
};

export const ensureGroupMember = async (
  groupId: string,
  userId: string,
  role: "student" | "teacher",
) => {
  const { error } = await supabase.from("community_chat_members").upsert(
    {
      group_id: groupId,
      user_id: userId,
      role,
    },
    { onConflict: "group_id,user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const fetchGroupMembers = async (groupId: string): Promise<ChatMember[]> => {
  if (!groupId) {
    return [];
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("community_chat_members")
    .select("user_id, role")
    .eq("group_id", groupId);

  if (memberError) {
    throw new Error(memberError.message);
  }

  const members = memberRows || [];
  const userIds = [
    ...new Set(members.map((row) => row.user_id).filter(Boolean)),
  ] as string[];

  if (!userIds.length) {
    return [];
  }

  const [studentsResult, teachersResult, usersResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("user_id, full_name")
      .in("user_id", userIds),
    supabase
      .from("teacher_profiles")
      .select("user_id, full_name")
      .in("user_id", userIds),
    supabase.from("user_profiles").select("id, email").in("id", userIds),
  ]);

  const nameByUserId = new Map<string, string>();
  for (const row of studentsResult.data || []) {
    if (row.user_id && row.full_name) {
      nameByUserId.set(row.user_id, String(row.full_name).trim());
    }
  }
  for (const row of teachersResult.data || []) {
    if (row.user_id && row.full_name) {
      nameByUserId.set(row.user_id, String(row.full_name).trim());
    }
  }
  for (const row of usersResult.data || []) {
    if (row.id && !nameByUserId.has(row.id)) {
      const email = String(row.email || "").trim();
      nameByUserId.set(row.id, email.split("@")[0] || "Member");
    }
  }

  return members.map((member) => ({
    user_id: member.user_id,
    role: member.role,
    name: nameByUserId.get(member.user_id) || "Member",
  }));
};

export const fetchGroupMessages = async (
  groupId: string,
  limit = 100,
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("community_chat_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as ChatMessage[];
};

export const sendGroupMessage = async (params: {
  groupId: string;
  senderId: string;
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}): Promise<ChatMessage> => {
  const { groupId, senderId, body, attachmentUrl, attachmentType } = params;

  const { data, error } = await supabase
    .from("community_chat_messages")
    .insert({
      group_id: groupId,
      sender_id: senderId,
      body: body ?? null,
      attachment_url: attachmentUrl ?? null,
      attachment_type: attachmentType ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to send message");
  }

  return data as ChatMessage;
};

export const uploadChatImage = async (): Promise<string | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const localUri = asset.uri;
  const fileName = localUri.split("/").pop() || "chat-image.jpg";
  const extension =
    fileName.includes(".") && fileName.split(".").pop()
      ? fileName.split(".").pop()
      : "jpg";
  const mimeType = `image/${String(extension).toLowerCase()}`;

  const cloudName = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  ).trim();
  const apiKey = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || "",
  ).trim();
  const uploadPreset = String(
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  ).trim();

  if (!cloudName || !apiKey || !uploadPreset) {
    throw new Error("Missing Cloudinary upload configuration");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append("api_key", apiKey);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "edutwin/chat-attachments");

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(message || "Cloudinary upload failed");
  }

  const payload = (await uploadResponse.json()) as { secure_url?: string };
  const secureUrl = String(payload?.secure_url || "").trim();
  if (!secureUrl) {
    throw new Error("Cloudinary did not return a secure URL");
  }

  return secureUrl;
};
