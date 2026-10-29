import { useEffect, useState } from "react";
import { keycloak } from "../lib/keycloak";
import { AuthContext } from "./auth-context";
import { syncNotifications } from "@/lib/api-keycloak";

export function KeycloakProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		let redirectingToLogin = false;
		let refreshInterval: ReturnType<typeof setInterval> | undefined;
		let refreshPromise: Promise<void> | null = null;

		const redirectToLogin = async () => {
			if (!active || redirectingToLogin) return;

			redirectingToLogin = true;
			setIsAuthenticated(false);
			setToken(null);

			window.location.href = "/";
		};

		const refreshToken = async () => {
			if (!active || redirectingToLogin || !keycloak.authenticated) {
				return;
			}

			if (refreshPromise) {
				return refreshPromise;
			}

			refreshPromise = (async () => {
				try {
					await keycloak.updateToken(30);

					if (!active) return;

					setToken(keycloak.token ?? null);
					setIsAuthenticated(Boolean(keycloak.authenticated));
				} catch (error) {
					console.error("Keycloak session refresh failed:", error);
					await redirectToLogin();
				} finally {
					refreshPromise = null;
				}
			})();

			return refreshPromise;
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshToken();
			}
		};

		async function initializeKeycloak() {
			try {
				const authenticated = await keycloak.init({
					onLoad: "check-sso",
					pkceMethod: "S256",
					checkLoginIframe: false,
					silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso`,
				});

				if (!active) return;

				setIsAuthenticated(authenticated);
				setToken(keycloak.token ?? null);

				if (authenticated) {
					try {
						await syncNotifications();
					} catch (error) {
						console.error("Failed to sync notifications:", error);
					}
				}

				if (!active) return;

				refreshInterval = setInterval(() => {
					void refreshToken();
				}, 10000);

				document.addEventListener("visibilitychange", handleVisibilityChange);

				if (authenticated) {
					void refreshToken();
				}
			} catch (error) {
				console.error("Keycloak initialization failed:", error);
			} finally {
				if (active) setLoading(false);
			}
		}

		void initializeKeycloak();

		return () => {
			active = false;

			if (refreshInterval !== undefined) {
				clearInterval(refreshInterval);
			}

			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	const login = () =>
		keycloak.login({
			redirectUri: `${window.location.origin}/projects`,
		});

	const logout = () =>
		keycloak.logout({
			redirectUri: window.location.origin,
		});

	return (
		<AuthContext.Provider
			value={{ isAuthenticated, token, loading, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}
