import { getEffectiveThemeMode } from "@/shared/store/settings-store";

const LIGHT = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  text: "#102445",
  textLight: "#6D84AA",
};

const DARK = {
  background: "#08111F",
  surface: "#0E1A2C",
  text: "#F4F7FB",
  textLight: "#AAB7CF",
};

const getPalette = () =>
  getEffectiveThemeMode() === "dark" ? DARK : LIGHT;

export const COLORS = {
  get primary() {
    return "#0056D2";
  },
  get secondary() {
    return "#28A745";
  },
  get background() {
    return getPalette().background;
  },
  get white() {
    return getPalette().surface;
  },
  get text() {
    return getPalette().text;
  },
  get textLight() {
    return getPalette().textLight;
  },
  get error() {
    return "#DC3545";
  },
};
