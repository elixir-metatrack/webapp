"use client";

import { useEffect, useState } from "react";
import { IconBriefcase } from "@tabler/icons-react";
import { ChevronRight, Folder, FolderOpen, GitBranch } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import type { Project } from "@/lib/types";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";

interface NavProjectsProps {
	projects: Project[];
	isLoading: boolean;
}

export function NavProjects({ projects, isLoading }: NavProjectsProps) {
	const { pathname } = useLocation();
	const { isMobile, setOpenMobile } = useSidebar();
	const [open, setOpen] = useState(true);
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
		() => new Set()
	);
	const visibleProjects = projects
		.filter((project) => project.id != null)
		.map((project) => ({ ...project, id: String(project.id) }));
	const visibleIds = new Set(visibleProjects.map((project) => project.id));
	const rootProjects = visibleProjects.filter(
		(project) =>
			project.parentProjectId == null ||
			!visibleIds.has(String(project.parentProjectId))
	);
	const activeProject = visibleProjects.find(
		(project) => pathname === `/projects/${project.id}`
	);
	const activeProjectId = activeProject?.id;
	const activeParentId = activeProject?.parentProjectId;

	useEffect(() => {
		if (activeProjectId == null) return;
		setOpen(true);
		if (activeParentId != null) {
			setExpandedProjects((previous) =>
				new Set(previous).add(String(activeParentId))
			);
		}
	}, [activeProjectId, activeParentId]);

	const closeMobileSidebar = () => {
		if (isMobile) setOpenMobile(false);
	};

	const toggleProject = (projectId: string, expanded: boolean) => {
		setExpandedProjects((previous) => {
			const next = new Set(previous);
			if (expanded) next.add(projectId);
			else next.delete(projectId);
			return next;
		});
	};

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<Collapsible asChild open={open} onOpenChange={setOpen}>
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								tooltip="My Projects"
								isActive={pathname === "/projects"}
							>
								<Link to="/projects" onClick={closeMobileSidebar}>
									<IconBriefcase className="!size-6" />
									<span>My Projects</span>
								</Link>
							</SidebarMenuButton>
							<CollapsibleTrigger asChild>
								<SidebarMenuAction
									aria-label={open ? "Collapse projects" : "Expand projects"}
									className="[&[data-state=open]>svg]:rotate-90"
								>
									<ChevronRight className="transition-transform" />
								</SidebarMenuAction>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub className="mr-0">
									{isLoading ? (
										<SidebarMenuSubItem className="text-muted-foreground px-2 py-1 text-sm">
											Loading projects...
										</SidebarMenuSubItem>
									) : rootProjects.length === 0 ? (
										<SidebarMenuSubItem className="text-muted-foreground px-2 py-1 text-sm">
											No projects yet
										</SidebarMenuSubItem>
									) : (
										rootProjects.map((project) => {
											const children = visibleProjects.filter(
												(child) => String(child.parentProjectId) === project.id
											);
											const expanded = expandedProjects.has(project.id);
											const ProjectIcon =
												project.parentProjectId != null
													? GitBranch
													: expanded
														? FolderOpen
														: Folder;

											return (
												<Collapsible
													key={project.id}
													asChild
													open={expanded}
													onOpenChange={(value) =>
														toggleProject(project.id, value)
													}
												>
													<SidebarMenuSubItem>
														<SidebarMenuSubButton
															asChild
															isActive={activeProjectId === project.id}
															className={
																children.length > 0 ? "pr-8" : undefined
															}
														>
															<Link
																to="/projects/$projectId"
																params={{ projectId: project.id }}
																title={project.name}
																onClick={closeMobileSidebar}
															>
																<ProjectIcon />
																<span>{project.name}</span>
															</Link>
														</SidebarMenuSubButton>
														{children.length > 0 && (
															<>
																<CollapsibleTrigger asChild>
																	<SidebarMenuAction
																		aria-label={`${expanded ? "Collapse" : "Expand"} ${project.name}`}
																		className="top-1 [&[data-state=open]>svg]:rotate-90"
																	>
																		<ChevronRight className="transition-transform" />
																	</SidebarMenuAction>
																</CollapsibleTrigger>
																<CollapsibleContent>
																	<SidebarMenuSub className="mr-0 ml-3">
																		{children.map((child) => (
																			<SidebarMenuSubItem key={child.id}>
																				<SidebarMenuSubButton
																					asChild
																					isActive={
																						activeProjectId === child.id
																					}
																				>
																					<Link
																						to="/projects/$projectId"
																						params={{ projectId: child.id }}
																						title={child.name}
																						onClick={closeMobileSidebar}
																					>
																						<GitBranch />
																						<span>{child.name}</span>
																					</Link>
																				</SidebarMenuSubButton>
																			</SidebarMenuSubItem>
																		))}
																	</SidebarMenuSub>
																</CollapsibleContent>
															</>
														)}
													</SidebarMenuSubItem>
												</Collapsible>
											);
										})
									)}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
