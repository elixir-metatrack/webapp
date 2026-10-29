import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarSkeleton } from "@/components/sidebar-skeleton";
import { useUser } from "@/hooks/use-user";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AuthContext } from "@/providers/auth-context";

import { useContext, useEffect } from "react";

export const Route = createFileRoute("/projects")({
	component: DashboardLayout,
});

function DashboardLayout() {
	const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
	const { data: user, isLoading: userLoading } = useUser(isAuthenticated);
	const navigate = useNavigate();

	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			navigate({ to: "/" });
		}
	}, [authLoading, isAuthenticated, navigate]);

	if (authLoading || (isAuthenticated && userLoading)) {
		return (
			<SidebarProvider>
				<SidebarSkeleton />
			</SidebarProvider>
		);
	}

	if (!user) return null;

	return (
		<SidebarProvider
			className="min-h-full"
			style={
				{
					"--sidebar-width": "14rem",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" user={user} />
			<SidebarInset className="min-w-0">
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
