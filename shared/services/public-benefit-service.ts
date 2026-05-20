import { getCurrentUser, resolveCurrentUser } from "./auth-service";
import { supabase } from "./supabase-client";
import {
  getUserSubscription,
  isSubscriptionActive,
  saveSubscriptionForUser,
} from "./subscription-service";

export const PUBLIC_BENEFIT_PLAN_TYPE = "public_benefit_2m";
export const PUBLIC_BENEFIT_PERIOD_DAYS = 60;

export type PublicBenefitStatus =
  | "pending_school"
  | "pending_super_admin"
  | "approved"
  | "rejected_school"
  | "rejected_super_admin";

export type PublicBenefitApplication = {
  id: string;
  student_profile_id: string;
  user_id: string;
  school_id: string;
  status: PublicBenefitStatus;
  applied_at: string;
  school_reviewed_at: string | null;
  school_notes: string | null;
  super_admin_reviewed_at: string | null;
  super_admin_notes: string | null;
  benefit_ends_at: string | null;
};

export type PublicBenefitEligibility = {
  canApply: boolean;
  reason?: string;
  schoolType?: string | null;
  isVerified?: boolean;
  hasActiveSubscription?: boolean;
  application?: PublicBenefitApplication | null;
};

const mapApplication = (row: Record<string, unknown>): PublicBenefitApplication => ({
  id: String(row.id),
  student_profile_id: String(row.student_profile_id),
  user_id: String(row.user_id),
  school_id: String(row.school_id),
  status: row.status as PublicBenefitStatus,
  applied_at: String(row.applied_at),
  school_reviewed_at: (row.school_reviewed_at as string) || null,
  school_notes: (row.school_notes as string) || null,
  super_admin_reviewed_at: (row.super_admin_reviewed_at as string) || null,
  super_admin_notes: (row.super_admin_notes as string) || null,
  benefit_ends_at: (row.benefit_ends_at as string) || null,
});

export const getMyPublicBenefitApplication =
  async (): Promise<PublicBenefitApplication | null> => {
    const user = getCurrentUser() || (await resolveCurrentUser());
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("public_benefit_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapApplication(data as Record<string, unknown>);
  };

export const getPublicBenefitEligibility =
  async (): Promise<PublicBenefitEligibility> => {
    const user = getCurrentUser() || (await resolveCurrentUser());
    if (!user) {
      return { canApply: false, reason: "Please sign in again." };
    }

    const [profileRes, subscription, application] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("id, school_id, verified, schools ( school_type, name )")
        .eq("user_id", user.id)
        .maybeSingle(),
      getUserSubscription(),
      getMyPublicBenefitApplication(),
    ]);

    if (profileRes.error || !profileRes.data) {
      return { canApply: false, reason: "Student profile not found." };
    }

    const profile = profileRes.data;
    const schoolRow = Array.isArray(profile.schools)
      ? profile.schools[0]
      : profile.schools;
    const schoolType = schoolRow?.school_type || null;

    if (!profile.school_id) {
      return {
        canApply: false,
        reason: "Join a public school on your profile to apply.",
        schoolType,
        isVerified: profile.verified === true,
        application,
      };
    }

    if (schoolType !== "public") {
      return {
        canApply: false,
        reason: "Public benefit is only for students at public schools.",
        schoolType,
        isVerified: profile.verified === true,
        application,
      };
    }

    if (profile.verified !== true) {
      return {
        canApply: false,
        reason:
          "Your school admin must verify your enrollment before you can apply.",
        schoolType,
        isVerified: false,
        application,
      };
    }

    const hasActiveSubscription = isSubscriptionActive(subscription);
    if (hasActiveSubscription) {
      return {
        canApply: false,
        reason: "You already have an active subscription.",
        schoolType,
        isVerified: true,
        hasActiveSubscription: true,
        application,
      };
    }

    if (
      application &&
      (application.status === "pending_school" ||
        application.status === "pending_super_admin")
    ) {
      return {
        canApply: false,
        reason: "Your application is already in review.",
        schoolType,
        isVerified: true,
        application,
      };
    }

    if (application?.status === "approved") {
      return {
        canApply: false,
        reason: "Your public benefit has already been approved.",
        schoolType,
        isVerified: true,
        application,
      };
    }

    return {
      canApply: true,
      schoolType,
      isVerified: true,
      application,
    };
  };

export const applyForPublicBenefit = async (): Promise<PublicBenefitApplication> => {
  const eligibility = await getPublicBenefitEligibility();
  if (!eligibility.canApply) {
    throw new Error(eligibility.reason || "You cannot apply for public benefit.");
  }

  const user = getCurrentUser() || (await resolveCurrentUser());
  if (!user) {
    throw new Error("Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("student_profiles")
    .select("id, school_id, verified, schools ( school_type )")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.id || !profile.school_id) {
    throw new Error("Student profile not found.");
  }

  const schoolRow = Array.isArray(profile.schools)
    ? profile.schools[0]
    : profile.schools;
  if (schoolRow?.school_type !== "public" || profile.verified !== true) {
    throw new Error("Only verified public school students can apply.");
  }

  const { data, error } = await supabase
    .from("public_benefit_applications")
    .insert({
      student_profile_id: profile.id,
      user_id: user.id,
      school_id: profile.school_id,
      status: "pending_school",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to submit application.");
  }

  return mapApplication(data as Record<string, unknown>);
};

export const provisionPublicBenefitSubscription = async ({
  userId,
  applicationId,
  grantedByUserId,
}: {
  userId: string;
  applicationId: string;
  grantedByUserId: string;
}) => {
  const periodEnd = new Date(
    Date.now() + PUBLIC_BENEFIT_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );

  await saveSubscriptionForUser(userId, {
    planType: PUBLIC_BENEFIT_PLAN_TYPE,
    status: "active",
    stripeCustomerId: `public-benefit-${applicationId}`,
    periodEnd,
  });

  const { error: appError } = await supabase
    .from("public_benefit_applications")
    .update({
      status: "approved",
      super_admin_reviewed_at: new Date().toISOString(),
      super_admin_reviewed_by: grantedByUserId,
      benefit_ends_at: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (appError) {
    throw new Error(appError.message);
  }

  return { periodEnd: periodEnd.toISOString() };
};
