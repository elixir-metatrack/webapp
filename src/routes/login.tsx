import { useContext, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthContext } from "#/providers/auth-context";
import { keycloak } from "#/lib/keycloak";

export const Route = createFileRoute("/login")({
	component: LoginRedirect,
});

function LoginRedirect() {
	const { isAuthenticated, loading, login } = useContext(AuthContext);
	const navigate = useNavigate();
	const started = useRef(false);

	useEffect(() => {
		if (loading || started.current) return;

		started.current = true;

		console.log("isAuthenticated:", isAuthenticated);
		if (isAuthenticated || keycloak.authenticated) {
			void navigate({ to: "/projects", replace: true });
			return;
		}

		void login();
	}, [loading, isAuthenticated, login, navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">Redirecting to MetaTrack login...</p>
		</div>
	);
}
