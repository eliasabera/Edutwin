// services/subscription.service.ts
// Mobile app subscription service using Supabase

import { supabase } from "./supabase-client";
import { getCurrentUser } from "./auth-service";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  plan_type: string;
  status: "active" | "canceled" | "past_due";
  current_period_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  provider_reference: string;
  provider_data?: any;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic access to learning materials",
    price: 0,
    currency: "ETB",
    interval: "month",
    features: [
      "Access to basic textbook library",
      "Basic AI tutor (5 questions/day)",
      "Limited practice quizzes",
      "Standard support",
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: "premium_monthly",
    name: "Premium Monthly",
    description: "Full access to all features",
    price: 149,
    currency: "ETB",
    interval: "month",
    features: [
      "Full textbook library access",
      "Unlimited AI tutor questions",
      "Unlimited practice quizzes",
      "Virtual lab access",
      "Priority support",
      "Download PDFs",
      "Cancel anytime",
    ],
    isPopular: true,
    isActive: true,
  },
  {
    id: "premium_yearly",
    name: "Premium Yearly",
    description: "Best value - save 30%",
    price: 1490,
    currency: "ETB",
    interval: "year",
    features: [
      "Full textbook library access",
      "Unlimited AI tutor questions",
      "Unlimited practice quizzes",
      "Virtual lab access",
      "Priority support",
      "Download PDFs",
      "2 months free",
      "Best value",
    ],
    isPopular: false,
    isActive: true,
  },
];

// Chapa payment configuration
const CHAPA_API_BASE = "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = process.env.EXPO_PUBLIC_CHAPA_SECRET_KEY || "";
const CHAPA_RETURN_URL = process.env.EXPO_PUBLIC_CHAPA_RETURN_URL || "edutwin://payment/success";
const CHAPA_CALLBACK_URL = process.env.EXPO_PUBLIC_CHAPA_CALLBACK_URL || "https://yourdomain.com/api/payments/chapa/callback";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Storage keys
const PENDING_TX_REF_KEY = "pending_tx_ref";
const PENDING_PLAN_TYPE_KEY = "pending_plan_type";
const PENDING_AMOUNT_KEY = "pending_amount";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user ID
 */
const getCurrentUserId = async (): Promise<string> => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
};

/**
 * Generate unique transaction reference
 */
const generateTxRef = (userId: string, planType: string): string => {
  const normalizedPlan = String(planType || "monthly").toLowerCase();
  const planCode = normalizedPlan === "yearly" ? "y" : "m";
  const userCode = String(userId || "usr").replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "usr";
  const timeCode = Date.now().toString(36);
  const randomCode = Math.random().toString(36).slice(2, 8);
  return `et-${planCode}-${userCode}-${timeCode}${randomCode}`;
};

const resolveCheckoutUrl = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object")
    ? (root.data as Record<string, unknown>)
    : null;

  const direct = root.checkout_url;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const nested = data?.checkout_url;
  if (typeof nested === "string" && nested.trim()) return nested.trim();

  const altNested = data?.checkoutUrl;
  if (typeof altNested === "string" && altNested.trim()) return altNested.trim();

  if (nested && typeof nested === "object") {
    const url = (nested as Record<string, unknown>).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }

  return null;
};

const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message = record.message;
    if (typeof message === "string" && message.trim()) return message;
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

/**
 * Store data securely
 */
const storeData = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`Failed to store ${key}:`, error);
  }
};

/**
 * Retrieve stored data
 */
const getStoredData = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`Failed to get ${key}:`, error);
    return null;
  }
};

/**
 * Remove stored data
 */
const removeStoredData = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`Failed to remove ${key}:`, error);
  }
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (subscription: UserSubscription | null): boolean => {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  
  const periodEnd = new Date(subscription.current_period_end);
  return periodEnd > new Date();
};

// ============================================================================
// Public API - Subscription Management
// ============================================================================

/**
 * Get all available subscription plans
 */
export const getSubscriptionPlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.isActive);
};

/**
 * Get a specific subscription plan by ID
 */
export const getSubscriptionPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
};

/**
 * Get current user's subscription from Supabase
 */
export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    console.log("🔍 Fetching subscription for user:", user.id);

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching subscription:", error);
      return null;
    }

    console.log("📦 Subscription found:", data);
    return data as UserSubscription | null;
  } catch (error) {
    console.warn("Failed to get user subscription:", error);
    return null;
  }
};

/**
 * Get current user's payment transactions from Supabase
 */
export const getUserTransactions = async (): Promise<PaymentTransaction[]> => {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching transactions:", error);
      return [];
    }

    return data as PaymentTransaction[] || [];
  } catch (error) {
    console.warn("Failed to get user transactions:", error);
    return [];
  }
};

/**
 * Create or update one subscription row per user (no UNIQUE on user_id required).
 */
export const saveSubscriptionForUser = async (
  userId: string,
  {
    planType,
    status = "active",
    stripeCustomerId,
    periodEnd,
    client = supabase,
  }: {
    planType: string;
    status?: string;
    stripeCustomerId: string;
    periodEnd: Date | string;
    client?: typeof supabase;
  },
): Promise<UserSubscription> => {
  if (!userId) {
    throw new Error("userId is required");
  }
  if (!planType) {
    throw new Error("planType is required");
  }

  const db = client;
  const row = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    plan_type: planType,
    status,
    current_period_end:
      periodEnd instanceof Date ? periodEnd.toISOString() : periodEnd,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing?.id) {
    const { data, error } = await db
      .from("subscriptions")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data as UserSubscription;
  }

  const { data, error } = await db
    .from("subscriptions")
    .insert({
      ...row,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserSubscription;
};

/**
 * Create or update subscription in Supabase
 */
export const upsertSubscription = async ({
  userId,
  planType,
  txRef,
  status,
}: {
  userId: string;
  planType: string;
  txRef: string;
  status: string;
}): Promise<UserSubscription | null> => {
  const periodDays = planType === "premium_yearly" ? 365 : 30;
  const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

  try {
    return await saveSubscriptionForUser(userId, {
      planType,
      status,
      stripeCustomerId: `chapa-${txRef}`,
      periodEnd,
    });
  } catch (error) {
    console.warn("Error upserting subscription:", error);
    return null;
  }
};

/**
 * Create payment transaction record in Supabase
 */
export const createTransaction = async ({
  userId,
  amount,
  currency,
  txRef,
  status,
  providerData = null,
}: {
  userId: string;
  amount: number;
  currency: string;
  txRef: string;
  status: string;
  providerData?: any;
}): Promise<PaymentTransaction | null> => {
  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      user_id: userId,
      amount: amount,
      currency: currency || "ETB",
      status: status,
      provider_reference: txRef,
      provider_data: providerData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.warn("Error creating transaction:", error);
    return null;
  }

  return data as PaymentTransaction;
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (txRef: string, status: string): Promise<PaymentTransaction | null> => {
  const { data, error } = await supabase
    .from("payment_transactions")
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq("provider_reference", txRef)
    .select()
    .single();

  if (error) {
    console.warn("Error updating transaction:", error);
    return null;
  }

  return data as PaymentTransaction;
};

// ============================================================================
// Chapa Payment Integration
// ============================================================================

/**
 * Initialize Chapa payment for subscription
 */
export const initializeChapaPayment = async (planType: string): Promise<{
  success: boolean;
  checkout_url?: string;
  tx_ref?: string;
  plan_type?: string;
  amount?: number;
  currency?: string;
  message?: string;
}> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const plan = getSubscriptionPlanById(planType);
    if (!plan) throw new Error("Invalid plan type");

    // Get student profile
    const { data: studentProfile } = await supabase
      .from("student_profiles")
      .select("full_name, phone_number")
      .eq("user_id", user.id)
      .maybeSingle();

    const fullName = String(studentProfile?.full_name || "EduTwin Student").trim();
    const [firstNameRaw, ...rest] = fullName.split(" ").filter(Boolean);
    const firstName = firstNameRaw || "EduTwin";
    const lastName = rest.join(" ") || "Student";
    
    const txRef = generateTxRef(user.id, planType);
    
    // Store tx_ref securely before redirecting to Chapa
    await storeData(PENDING_TX_REF_KEY, txRef);
    await storeData(PENDING_PLAN_TYPE_KEY, planType);
    await storeData(PENDING_AMOUNT_KEY, String(plan.price));
    
    console.log("💾 Stored pending transaction:", txRef);

    const payload = {
      amount: String(plan.price),
      currency: plan.currency,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      phone_number: studentProfile?.phone_number || "",
      tx_ref: txRef,
      callback_url: CHAPA_CALLBACK_URL,
      return_url: CHAPA_RETURN_URL,
      customization: {
        title: "EduTwin Premium",
        description: `${plan.name}`.slice(0, 50),
      },
      meta: {
        user_id: String(user.id),
        plan_type: planType,
      },
    };

    console.log("🚀 Sending to Chapa:", payload);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/chapa-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "initialize", payload }),
      }
    );

    const data = await response.json();
    console.log("📦 Edge Function response:", data);

    if (!data.success) {
      // Clear stored data if initialization failed
      await removeStoredData(PENDING_TX_REF_KEY);
      await removeStoredData(PENDING_PLAN_TYPE_KEY);
      await removeStoredData(PENDING_AMOUNT_KEY);
      const rawError = data.error ?? data.message;
      throw new Error(normalizeErrorMessage(rawError, "Payment initialization failed"));
    }

    const checkoutUrl = resolveCheckoutUrl(data);
    if (!checkoutUrl) {
      throw new Error("Chapa did not return checkout URL");
    }

    // Create pending transaction record in Supabase
    await createTransaction({
      userId: user.id,
      amount: plan.price,
      currency: plan.currency,
      txRef,
      status: "pending",
      providerData: data?.data,
    });

    return {
      success: true,
      checkout_url: checkoutUrl,
      tx_ref: txRef,
      plan_type: planType,
      amount: plan.price,
      currency: plan.currency,
    };
  } catch (error: any) {
    console.error("❌ Failed to initialize Chapa payment:", error);
    return {
      success: false,
      message: normalizeErrorMessage(error, "Failed to initialize payment"),
    };
  }
};

/**
 * Verify Chapa payment status
 */
export const verifyChapaPayment = async (txRef: string): Promise<{
  verified: boolean;
  status?: string;
  tx_ref?: string;
  subscription?: UserSubscription | null;
  paymentData?: any;
  message?: string;
}> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    console.log("🔍 Verifying payment for txRef:", txRef);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/chapa-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "verify", payload: { txRef } }),
      }
    );

    const data = await response.json();
    console.log("📦 Verification response:", data);

    if (!data.success) {
      return {
        verified: false,
        status: data.status || "failed",
        message: data.message || "Verification request failed",
      };
    }

    const isSuccessful = data.verified === true;
    const chapaStatus = data.status || "unknown";
    const chapaData = data.data || {};

    console.log(`Verification result: ${isSuccessful ? "SUCCESS" : "FAILED"}`);

    // Update transaction status in Supabase
    await updateTransactionStatus(txRef, isSuccessful ? "success" : "failed");

    let subscription = null;
    if (isSuccessful) {
      const planType = String(chapaData?.meta?.plan_type || chapaData?.plan_type || "premium_monthly").toLowerCase();
      console.log("Plan type from Chapa:", planType);
      
      // Calculate period end date
      const periodDays = planType === "premium_yearly" ? 365 : 30;
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + periodDays);
      
      // First, check if subscription already exists
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingSub) {
        // Update existing subscription
        const { data: updatedSub, error: updateError } = await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: `chapa-${txRef}`,
            plan_type: planType === "premium_yearly" ? "premium_yearly" : "premium_monthly",
            status: "active",
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();
        
        if (!updateError) {
          subscription = updatedSub as UserSubscription;
          console.log("✅ Updated existing subscription:", subscription);
        }
      } else {
        // Create new subscription
        const { data: newSub, error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            stripe_customer_id: `chapa-${txRef}`,
            plan_type: planType === "premium_yearly" ? "premium_yearly" : "premium_monthly",
            status: "active",
            current_period_end: periodEnd.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (!insertError) {
          subscription = newSub as UserSubscription;
          console.log("✅ Created new subscription:", subscription);
        }
      }
      
      if (!subscription) {
        console.error("Failed to create/update subscription");
      }
    }

    return {
      verified: isSuccessful,
      status: chapaStatus,
      tx_ref: txRef,
      subscription,
      paymentData: chapaData,
      message: data.message,
    };
  } catch (error: any) {
    console.error("❌ Failed to verify Chapa payment:", error);
    return {
      verified: false,
      status: "error",
      message: error.message || "Failed to verify payment",
    };
  }
};

/**
 * Check if user has an active premium subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription) {
      console.log("No subscription found");
      return false;
    }
    
    if (subscription.status !== "active") {
      console.log("Subscription status not active:", subscription.status);
      return false;
    }
    
    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const isActive = periodEnd > now;
    
    console.log(`Subscription valid until: ${periodEnd}, Active: ${isActive}`);
    return isActive;
  } catch (error) {
    console.warn("Failed to check subscription status:", error);
    return false;
  }
};

/**
 * Get user's current plan details
 */
export const getCurrentPlan = async (): Promise<SubscriptionPlan | undefined> => {
  try {
    const subscription = await getUserSubscription();
    
    if (!subscription || subscription.status !== "active") {
      const freePlan = SUBSCRIPTION_PLANS.find((p) => p.id === "free");
      console.log("No active subscription, returning free plan");
      return freePlan;
    }
    
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd <= new Date()) {
      console.log("Subscription expired");
      return SUBSCRIPTION_PLANS.find((p) => p.id === "free");
    }
    
    if (subscription.plan_type === "public_benefit_2m") {
      return {
        id: "public_benefit_2m",
        name: "Public Benefit",
        description: "2-month complimentary access for public school students",
        price: 0,
        currency: "ETB",
        interval: "month",
        features: ["Full premium access for 2 months"],
        isPopular: false,
        isActive: true,
      };
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.plan_type);
    console.log("Current plan:", plan?.name);
    return plan || SUBSCRIPTION_PLANS.find((p) => p.id === "free");
  } catch (error) {
    console.warn("Failed to get current plan:", error);
    return SUBSCRIPTION_PLANS.find((p) => p.id === "free");
  }
};

/**
 * Get stored pending transaction reference
 */
export const getPendingTransactionRef = async (): Promise<string | null> => {
  return await getStoredData(PENDING_TX_REF_KEY);
};

/**
 * Clear pending transaction data
 */
export const clearPendingTransaction = async (): Promise<void> => {
  await removeStoredData(PENDING_TX_REF_KEY);
  await removeStoredData(PENDING_PLAN_TYPE_KEY);
  await removeStoredData(PENDING_AMOUNT_KEY);
};

/**
 * Cancel subscription (set status to canceled)
 */
export const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        status: "canceled",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, message: "Subscription canceled successfully" };
  } catch (error: any) {
    console.error("Failed to cancel subscription:", error);
    return { success: false, message: error.message };
  }
};