import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AuthContext } from "#/providers/auth-context";
import { keycloak } from "#/lib/keycloak";

interface AuthRedirectProps {
	action: "login" | "register";
}

export function AuthRedirect({ action }: AuthRedirectProps) {
	const { isAuthenticated, loading, login } = useContext(AuthContext);
	const navigate = useNavigate();
	const started = useRef(false);

	useEffect(() => {
		if (loading || started.current) return;

		started.current = true;

		if (isAuthenticated || keycloak.authenticated) {
			void navigate({ to: "/projects", replace: true });
			return;
		}

		if (action === "login") {
			void login();
		} else {
			void keycloak.register();
		}
	}, [loading, isAuthenticated, login, navigate, action]);

	const message =
		action === "login"
			? "Redirecting to MetaTrack login..."
			: "Redirecting to MetaTrack registration...";

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}
