"use client";

import * as React from "react";
import {
	IconBook,
	IconBriefcase,
	IconDatabase,
	IconFileInfo,
	IconMessageDots,
	IconMessageQuestion,
	IconRocket,
	IconBell,
} from "@tabler/icons-react";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "@/components/ui/sidebar";

import { useQuery } from "@tanstack/react-query";
import { getProjectsByUser } from "@/lib/api-keycloak";
import type { MeResponse, Project } from "@/lib/types";
import { NavUser } from "./nav-user";
import { Link } from "@tanstack/react-router";
import { NotificationPopover } from "../notification-popover";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	user: MeResponse;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
	const { data: projects = [], isLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjectsByUser,
		enabled: !!user,
	});

	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	const data = {
		navPlatform: [
			{
				title: "About",
				url: "/about",
				icon: IconMessageQuestion,
			},
			{
				title: "Public Data",
				url: "/public-data",
				icon: IconDatabase,
			},
			{
				title: "Get Started",
				url: "/get-started",
				icon: IconRocket,
			},
			{
				title: "Resources",
				url: "/resources",
				icon: IconBook,
			},
		],

		navMain: [
			{
				title: "My Projects",
				url: "/projects",
				icon: IconBriefcase,
				items: isLoading
					? [
							{
								title: "Loading...",
								url: "#",
							},
						]
					: projects.map((project: Project) => ({
							title: project.name,
							url: `/projects/${project.id}`,
						})),
			},
		],

		navSecondary: [
			{
				title: "Help and Support",
				url: "/help-and-support",
				icon: IconMessageDots,
			},
			{
				title: "Terms of Use",
				url: "/terms-of-use",
				icon: IconFileInfo,
			},
		],
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							tooltip="MetaTrack Home"
							className="group-data-[collapsible=icon]:!size-12 data-[slot=sidebar-menu-button]:!p-2"
							size={null}
						>
							<Link to="/">
								<img
									src={
										isCollapsed
											? "/Metatrack-logo.svg"
											: "/Metatrack_logo_advanced.svg"
									}
									alt="MetaTrack Logo"
									className={isCollapsed ? "w-auto" : "h-16 w-auto"}
								/>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarMenu className="px-2">
					<SidebarMenuItem>
						<SidebarMenuItem>
							<NotificationPopover />
						</SidebarMenuItem>
					</SidebarMenuItem>
				</SidebarMenu>
				<NavMain items={data.navMain} />
				<SidebarSeparator className="mx-0" />
				<NavMain items={data.navPlatform} />

				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
