import { AuthRedirect } from "#/components/auth-redirect";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: () => <AuthRedirect action="login" />,
});
