import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
	undefined
);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

	// Load the saved theme preference.
	useEffect(() => {
		const stored = window.localStorage.getItem(storageKey);

		if (stored === "light" || stored === "dark" || stored === "system") {
			setThemeState(stored);
		}
	}, [storageKey]);

	// Detect the system theme and listen for changes.
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const updateSystemTheme = () => {
			setSystemTheme(mediaQuery.matches ? "dark" : "light");
		};

		updateSystemTheme();
		mediaQuery.addEventListener("change", updateSystemTheme);

		return () => {
			mediaQuery.removeEventListener("change", updateSystemTheme);
		};
	}, []);

	// Resolve the effective theme.
	const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

	// Apply the resolved theme to the document.
	useEffect(() => {
		const root = document.documentElement;

		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
	}, [resolvedTheme]);

	const setTheme = (value: Theme) => {
		window.localStorage.setItem(storageKey, value);
		setThemeState(value);
	};

	return (
		<ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}

	return context;
};
