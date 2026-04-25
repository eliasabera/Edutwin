import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";
import type { PreferredLanguage } from "../types/domain.types";

export type ThemeMode = "light" | "dark" | "system";

export type AppSettings = {
	themeMode: ThemeMode;
	preferredLanguage: PreferredLanguage;
	notificationsEnabled: boolean;
	dailyStreakReminders: boolean;
	autoSyncTwinProgress: boolean;
	hasAcceptedTermsPolicy: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
	themeMode: "system",
	preferredLanguage: "en",
	notificationsEnabled: true,
	dailyStreakReminders: true,
	autoSyncTwinProgress: true,
	hasAcceptedTermsPolicy: false,
};

const SETTINGS_STORAGE_KEY = "edutwin_app_settings_v1";

let settings: AppSettings = DEFAULT_SETTINGS;
let hasHydrated = false;
const listeners = new Set<() => void>();

const emitChange = () => {
	listeners.forEach((listener) => listener());
};

const persistSettings = async () => {
	try {
		await SecureStore.setItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Keep settings in memory even if secure persistence is unavailable.
	}
};

const mergeSettings = (updates: Partial<AppSettings>) => {
	settings = {
		...settings,
		...updates,
	};
	emitChange();
	void persistSettings();
};

export const getAppSettings = () => settings;

export const hydrateAppSettings = async () => {
	if (hasHydrated) {
		return settings;
	}

	try {
		const storedValue = await SecureStore.getItemAsync(SETTINGS_STORAGE_KEY);
		if (storedValue) {
			const parsed = JSON.parse(storedValue) as Partial<AppSettings>;
			settings = {
				...DEFAULT_SETTINGS,
				...parsed,
			};
		}
	} catch {
		settings = DEFAULT_SETTINGS;
	}

	hasHydrated = true;
	emitChange();
	return settings;
};

export const updateAppSettings = (updates: Partial<AppSettings>) => {
	mergeSettings(updates);
};

export const setThemeMode = (themeMode: ThemeMode) => {
	mergeSettings({ themeMode });
};

export const setPreferredLanguage = (preferredLanguage: PreferredLanguage) => {
	mergeSettings({ preferredLanguage });
};

export const setNotificationsEnabled = (notificationsEnabled: boolean) => {
	mergeSettings({ notificationsEnabled });
};

export const setDailyStreakReminders = (dailyStreakReminders: boolean) => {
	mergeSettings({ dailyStreakReminders });
};

export const setAutoSyncTwinProgress = (autoSyncTwinProgress: boolean) => {
	mergeSettings({ autoSyncTwinProgress });
};

export const setHasAcceptedTermsPolicy = (hasAcceptedTermsPolicy: boolean) => {
	mergeSettings({ hasAcceptedTermsPolicy });
};

export const resetAppSettings = () => {
	settings = DEFAULT_SETTINGS;
	emitChange();
	void persistSettings();
};

export const getEffectiveThemeMode = () => {
	if (settings.themeMode !== "system") {
		return settings.themeMode;
	}

	return Appearance.getColorScheme() === "dark"
		? "dark"
		: "light";
};

export const useAppSettings = () =>
	useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getAppSettings,
		getAppSettings,
	);