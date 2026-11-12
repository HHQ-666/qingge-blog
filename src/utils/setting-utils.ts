import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export type ReadingSize = "sm" | "md" | "lg";

const READING_SIZES: Record<ReadingSize, { fontSize: string; lineHeight: string }> = {
	sm: { fontSize: "15px", lineHeight: "1.85" },
	md: { fontSize: "16px", lineHeight: "1.9" },
	lg: { fontSize: "18px", lineHeight: "1.95" },
};

export function getReadingSize(): ReadingSize {
	const stored = localStorage.getItem("reading-size");
	return stored === "sm" || stored === "lg" ? stored : "md";
}

export function setReadingSize(size: ReadingSize): void {
	localStorage.setItem("reading-size", size);
	const root = document.documentElement;
	root.style.setProperty("--reading-font-size", READING_SIZES[size].fontSize);
	root.style.setProperty("--reading-line-height", READING_SIZES[size].lineHeight);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}
