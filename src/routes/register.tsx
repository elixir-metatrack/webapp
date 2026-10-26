import { AuthRedirect } from "#/components/auth-redirect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
	component: () => <AuthRedirect action="register" />,
});
