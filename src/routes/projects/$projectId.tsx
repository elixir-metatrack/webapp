"use client";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/dashboard/site-header";

import {
	getAssays,
	getProjectsByUser,
	getSamples as getSamplesNew,
	getSubProjects,
} from "@/lib/api-keycloak";
import { DataTable } from "@/components/dashboard/dataTable";
import { AddSampleDialog } from "@/components/dashboard/add-sample";
import type { Assay, Project, Sample } from "@/lib/types";
import { UploadSampleDialog } from "@/components/dashboard/upload-sample";
import type { ColumnDef } from "@tanstack/react-table";
import { cn, formatDateToYMD, NON_VIEWED_COLUMNS } from "@/lib/utils";
import { DownloadTemplateButton } from "@/components/dashboard/download-template-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { AssayTable } from "@/components/dashboard/assayTable";
import { AddAssayDialog } from "@/components/dashboard/add-assay";
import { Button } from "@/components/ui/button";
import { EditProjectDialog } from "@/components/dashboard/edit-project-dialog";
import { AddSubProjectDialog } from "@/components/dashboard/add-subproject";
import { SubProjectsTable } from "@/components/dashboard/subproject-table";
import { Badge } from "@/components/ui/badge";
import { SquarePen, UserRoundCog } from "lucide-react";
import { IconMicroscope, IconTestPipe, IconSitemap } from "@tabler/icons-react";
import { useUser } from "#/hooks/use-user";
import { useSidebar } from "#/components/ui/sidebar";
import { VocabulariesDialog } from "#/components/vocabulariesDialog";
import { UploadExperimentDialog } from "#/components/dashboard/upload-experiment";
import { CalendarDays, Database, FileText, UserRound } from "lucide-react";

export const Route = createFileRoute("/projects/$projectId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId } = Route.useParams();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("samples");
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editDialogInitialTab, setEditDialogInitialTab] = useState<
		"general" | "members"
	>("general");

	useEffect(() => {
		setActiveTab("samples");
	}, [projectId]);

	const { data: user } = useUser();

	const isSystemAdmin = user?.roles?.includes("system-admin");

	const openEditProjectDialog = (tab: "general" | "members") => {
		setEditDialogInitialTab(tab);
		setEditDialogOpen(true);
	};

	const {
		data: projects,
		isLoading: projectLoading,
		error: projectError,
	} = useQuery<Project[]>({
		queryKey: ["projects"],
		queryFn: () => getProjectsByUser(),
	});

	const project = projects?.find((p) => String(p.id) === projectId);

	const { data: samples = [] } = useQuery<Sample[]>({
		queryKey: ["samples", projectId],
		queryFn: () => getSamplesNew(projectId),
		enabled: !!projectId,
	});

	const { data: assays = [] } = useQuery<Assay[]>({
		queryKey: ["assays", projectId],
		queryFn: () => getAssays(projectId),
		enabled: !!projectId,
	});

	const { data: subProjects = [] } = useQuery<Project[]>({
		queryKey: ["subprojects", projectId],
		queryFn: () => getSubProjects(projectId),
		enabled: !!projectId,
	});

	const parentProject = project?.parentProjectId
		? projects?.find((p) => String(p.id) === String(project.parentProjectId))
		: undefined;

	const [activeAssayTab, setActiveAssayTab] = useState<string | undefined>(
		undefined
	);

	if (projectLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
			</div>
		);
	}

	if (projectError) {
		return <div>Failed to load sample.</div>;
	}

	if (!project) {
		return <div>Sample not found</div>;
	}

	const dynamicColumns: ColumnDef<Sample>[] =
		samples.length > 0 && samples[0]
			? Object.keys(samples[0])
					.filter((key) => !NON_VIEWED_COLUMNS.includes(String(key)))
					.map((key) => ({
						accessorKey: key,
						header: key.charAt(0).toUpperCase() + key.slice(1),
					}))
			: [];

	const { state } = useSidebar();

	return (
		<div className={cn(state === "collapsed" ? "w-19/20" : "w-7/8")}>
			<SiteHeader
				items={[
					{ label: "My Projects", href: "/projects" },
					...(parentProject
						? [
								{
									label: parentProject.name,
									href: `/projects/${parentProject.id}`,
								},
							]
						: []),
					{
						label: project.name,
						href: `/projects/${project.id}`,
					},
				]}
			/>
			<div className="space-y-6 p-4">
				<Card className="grid grid-cols-1 gap-2 rounded-2xl border shadow-sm lg:grid-cols-[minmax(0,1fr)_220px]">
					<CardHeader className="pb-2">
						<div className="flex flex-wrap items-center gap-3">
							<CardTitle className="text-2xl font-bold tracking-tight break-words">
								{project.name}
							</CardTitle>

							{project.parentProjectId && (
								<Badge
									variant="secondary"
									className="rounded-full px-3 py-1 text-xs font-medium"
								>
									Sub-project
									{parentProject && (
										<>
											{" of "}
											<Link
												to="/projects/$projectId"
												params={{ projectId: String(parentProject.id) }}
												className="underline underline-offset-4"
											>
												{parentProject.name}
											</Link>
										</>
									)}
								</Badge>
							)}
						</div>
					</CardHeader>

					<CardContent className="space-y-5 lg:col-start-1 lg:row-start-2">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium">
								<FileText className="text-muted-foreground size-4" />
								Description
							</div>
							<p className="text-muted-foreground text-sm leading-6 break-words whitespace-pre-wrap">
								{project.description || "No description provided."}
							</p>
						</div>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="bg-muted/30 rounded-2xl border p-4">
								<div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
									<Database className="size-4" />
									<span>Samples</span>
								</div>
								<p className="text-2xl font-semibold tracking-tight">
									{samples.length}
								</p>
								<p className="text-muted-foreground mt-1 text-xs">
									Total samples
								</p>
							</div>

							<div className="bg-muted/30 rounded-2xl border p-4">
								<div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
									<CalendarDays className="size-4" />
									<span>Created on</span>
								</div>
								<p className="text-lg font-semibold tracking-tight">
									{formatDateToYMD(project.createdOn)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3 border-t pt-4">
							<div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
								<UserRound className="text-muted-foreground size-5" />
							</div>

							<div className="min-w-0 flex-1 space-y-1">
								<p className="text-muted-foreground text-xs">Project owner</p>
								<p className="truncate text-sm font-medium">
									{project.ownerUsername}
								</p>
							</div>
						</div>
					</CardContent>

					<div className="flex flex-col gap-3 px-6 pb-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-center lg:border-l lg:py-6">
						<Button
							size="lg"
							className="w-full justify-start rounded-xl"
							onClick={() => openEditProjectDialog("general")}
						>
							<SquarePen className="mr-1 size-4" />
							Edit Project
						</Button>

						<Button
							size="lg"
							variant="outline"
							className="w-full justify-start rounded-xl"
							onClick={() => openEditProjectDialog("members")}
						>
							<UserRoundCog className="mr-1 size-4" />
							Manage Members
						</Button>
					</div>
				</Card>

				<EditProjectDialog
					project={project}
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					initialTab={editDialogInitialTab}
				/>

				<Card className="pt-2">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<CardHeader className="pb-0">
							<div className="flex w-full items-center justify-between">
								<TabsList className="w-fit">
									<TabsTrigger
										value="samples"
										className="text-lg font-semibold text-gray-500 [&_svg:not([class*='size-'])]:size-5"
									>
										<IconTestPipe />
										Samples
									</TabsTrigger>

									<TabsTrigger
										value="experiments"
										className="text-lg font-semibold text-gray-500 [&_svg:not([class*='size-'])]:size-5"
									>
										<IconMicroscope />
										Experiments
									</TabsTrigger>

									{!project.parentProjectId && (
										<TabsTrigger
											value="subprojects"
											className="text-lg font-semibold text-gray-500 [&_svg:not([class*='size-'])]:size-5"
										>
											<IconSitemap />
											Sub-Projects
										</TabsTrigger>
									)}
								</TabsList>

								<div className="flex items-center gap-2">
									{/* Admin global vocabulary */}
									{isSystemAdmin && (
										<VocabulariesDialog
											projectId={projectId}
											dataType={activeTab === "samples" ? "sample" : "assay"}
											isSystemAdmin={true}
										/>
									)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="pt-6">
							<TabsContent value="samples">
								<div className="flex justify-end gap-2 py-8">
									<DownloadTemplateButton type="sample" />
									<UploadSampleDialog projectId={projectId} />
								</div>
								<DataTable
									data={samples}
									columns={dynamicColumns}
									onEdit={(sample) => console.log("Edit sample", sample)}
									onDelete={(sample) => console.log("Delete sample", sample)}
									dataType="sample"
									project={project}
									showAddButton={
										<div className="flex gap-2">
											<AddSampleDialog projectId={projectId} />
										</div>
									}
								/>
							</TabsContent>

							<TabsContent value="experiments">
								{assays.length > 0 ? (
									<Tabs
										value={activeAssayTab ?? assays[0].id}
										onValueChange={setActiveAssayTab}
									>
										<div className="mb-4 flex items-center gap-2">
											<TabsList>
												{assays.map((assay) => (
													<TabsTrigger key={assay.id} value={assay.id}>
														{assay.name}
													</TabsTrigger>
												))}
											</TabsList>

											{!project.parentProjectId && (
												<AddAssayDialog projectId={projectId} />
											)}
										</div>

										{assays.map((assay) => (
											<TabsContent key={assay.id} value={assay.id}>
												<Card>
													<CardContent className="pt-6">
														<div className="mb-4 flex justify-end gap-2">
															<DownloadTemplateButton type="experiment" />
															<UploadExperimentDialog
																projectId={projectId}
																assayId={String(assay.id)}
															/>
														</div>

														<AssayTable assay={assay} project={project} />
													</CardContent>
												</Card>
											</TabsContent>
										))}
									</Tabs>
								) : (
									<div className="flex justify-center py-8">
										{project.parentProjectId ? (
											<p className="text-muted-foreground">
												No experiments are linked to this sub-project's samples.
											</p>
										) : (
											<AddAssayDialog projectId={projectId} />
										)}
									</div>
								)}
							</TabsContent>

							{!project.parentProjectId && (
								<TabsContent value="subprojects">
									<SubProjectsTable
										subProjects={subProjects}
										onOpen={(subProject) =>
											navigate({
												to: "/projects/$projectId",
												params: { projectId: subProject.id! },
											})
										}
										showAddButton={
											<AddSubProjectDialog parentProjectId={projectId} />
										}
									/>
								</TabsContent>
							)}
						</CardContent>
					</Tabs>
				</Card>
			</div>
		</div>
	);
}
