import { useSyncExternalStore } from "react";

let hideTabBar = false;
const listeners = new Set<() => void>();

const emitChange = () => {
	listeners.forEach((listener) => listener());
};

export const setHideTabBar = (value: boolean) => {
	if (hideTabBar === value) {
		return;
	}

	hideTabBar = value;
	emitChange();
};

export const getHideTabBar = () => hideTabBar;

export const useHideTabBar = () =>
	useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getHideTabBar,
		getHideTabBar,
	);
