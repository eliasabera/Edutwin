import { useColorScheme } from "react-native";
import {
  getEffectiveThemeMode,
  useAppSettings,
} from "../store/settings-store";

export type AuthScreenColors = {
  background: string;
  surface: string;
  text: string;
  textLight: string;
  primary: string;
  error: string;
  inputBg: string;
  inputBorder: string;
  placeholder: string;
  dropdownListBg: string;
  dropdownBorder: string;
  dropdownItemBorder: string;
  dropdownItemActiveBg: string;
  chipBg: string;
  chipActiveBg: string;
  chipBorder: string;
  photoPreviewBg: string;
  photoPickerBg: string;
};

export const getAuthScreenColors = (isDark: boolean): AuthScreenColors => ({
  background: isDark ? "#08111F" : "#FFFFFF",
  surface: isDark ? "#08111F" : "#FFFFFF",
  text: isDark ? "#F4F7FB" : "#102445",
  textLight: isDark ? "#9FB2D6" : "#6D84AA",
  primary: "#0056D2",
  error: isDark ? "#FC8181" : "#DC3545",
  inputBg: isDark ? "#0E1A2C" : "#FFFFFF",
  inputBorder: isDark ? "#22324E" : "#D6DDEA",
  placeholder: isDark ? "#8FA1BF" : "#9BAECC",
  dropdownListBg: isDark ? "#121C2E" : "#FFFFFF",
  dropdownBorder: isDark ? "#2E4368" : "#D9E0ED",
  dropdownItemBorder: isDark ? "#22324E" : "#EEF2F8",
  dropdownItemActiveBg: isDark ? "#17305A" : "#EAF2FF",
  chipBg: isDark ? "#0E1A2C" : "#FFFFFF",
  chipActiveBg: isDark ? "#17305A" : "#EAF2FF",
  chipBorder: isDark ? "#2E4368" : "#D6DDEA",
  photoPreviewBg: isDark ? "#121C2E" : "#F6F8FC",
  photoPickerBg: isDark ? "#17305A" : "#EAF2FF",
});

export const useAuthIsDark = (): boolean => {
  const appSettings = useAppSettings();
  const deviceTheme = useColorScheme();
  if (appSettings.themeMode === "system") {
    return (deviceTheme ?? getEffectiveThemeMode()) === "dark";
  }
  return appSettings.themeMode === "dark";
};

export const useAuthScreenColors = (): AuthScreenColors => {
  return getAuthScreenColors(useAuthIsDark());
};
