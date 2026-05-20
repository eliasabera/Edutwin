import Constants from "expo-constants";

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const getSupabaseConfig = () => {
  const supabaseUrl = String(
    process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || "",
  ).trim();
  const supabaseAnonKey = String(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || "",
  ).trim();

  return { supabaseUrl, supabaseAnonKey };
};

export const getSupabaseUrl = () => getSupabaseConfig().supabaseUrl;

export const getSupabaseAnonKey = () => getSupabaseConfig().supabaseAnonKey;

export const isSupabaseConfigured = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const assertSupabaseConfig = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  if (supabaseUrl && supabaseAnonKey) {
    return { supabaseUrl, supabaseAnonKey };
  }

  throw new Error(
    "Supabase is not configured in this app build. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to Edutwin/.env, then restart with: npx expo start --clear",
  );
};

export const toAuthErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (
      message === "Network request failed" ||
      message.includes("Network request failed") ||
      message === "Failed to fetch"
    ) {
      const { supabaseUrl } = getSupabaseConfig();
      if (!supabaseUrl) {
        return "Supabase is not configured. Check Edutwin/.env and restart the app with a clean cache.";
      }
      return "Cannot reach EduTwin servers. Check your internet connection and try again.";
    }
    return message || fallback;
  }

  return fallback;
};
