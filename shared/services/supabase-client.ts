import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(
	process.env.EXPO_PUBLIC_SUPABASE_URL || "",
).trim();
const supabaseAnonKey = String(
	process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
).trim();

const MAX_SECURESTORE_BYTES = 1800;
const memoryStorage = new Map<string, string>();

const secureStorage = {
	getItem: async (key: string) => {
		try {
			if (memoryStorage.has(key)) {
				return memoryStorage.get(key) ?? null;
			}
			return await SecureStore.getItemAsync(key);
		} catch {
			return null;
		}
	},
	setItem: async (key: string, value: string) => {
		try {
			if (value.length > MAX_SECURESTORE_BYTES) {
				memoryStorage.set(key, value);
				return;
			}
			memoryStorage.delete(key);
			await SecureStore.setItemAsync(key, value);
		} catch {
			// Ignore storage errors to keep auth flows unblocked.
		}
	},
	removeItem: async (key: string) => {
		try {
			memoryStorage.delete(key);
			await SecureStore.deleteItemAsync(key);
		} catch {
			// Ignore storage errors on cleanup.
		}
	},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: secureStorage,
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: false,
	},
});

