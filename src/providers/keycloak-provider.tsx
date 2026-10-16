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
		let refreshInterval: ReturnType<typeof setInterval> | undefined;

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
					keycloak
						.updateToken(30)
						.then((refreshed) => {
							if (active && refreshed) {
								setToken(keycloak.token ?? null);
							}
						})
						.catch((error) => {
							console.error("Failed to refresh Keycloak token:", error);
						});
				}, 10000);
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
