import { useSyncExternalStore } from "react";
import {
  getAppSettings,
  setPreferredLanguage as setAppPreferredLanguage,
} from "./settings-store";
import type { PreferredLanguage } from "../types/domain.types";

const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const getPreferredLanguage = (): PreferredLanguage => getAppSettings().preferredLanguage;

export const setPreferredLanguage = async (preferredLanguage: PreferredLanguage) => {
  setAppPreferredLanguage(preferredLanguage);
  emitChange();
  return preferredLanguage;
};

export const usePreferredLanguage = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPreferredLanguage,
    getPreferredLanguage,
  );
