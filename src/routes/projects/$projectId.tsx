"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { NON_VIEWED_COLUMNS } from "@/lib/utils";
import { DownloadTemplateButton } from "@/components/dashboard/download-template-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { AssayTable } from "@/components/dashboard/assayTable";
import { AddAssayDialog } from "@/components/dashboard/add-assay";
import { Button } from "@/components/ui/button";
import { EditProjectDialog } from "@/components/dashboard/edit-project-dialog";
import { AddSubProjectDialog } from "@/components/dashboard/add-subproject";
import { SubProjectsTable } from "@/components/dashboard/subproject-table";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { SquarePen, UserRoundCog } from "lucide-react";
import { IconMicroscope, IconTestPipe, IconSitemap } from "@tabler/icons-react";

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
		? projects?.find((p) => String(p.id) === project.parentProjectId)
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

	return (
		<div>
			<SiteHeader
				items={[
					{ label: "My Projects", href: "/projects" },
					{ label: project.name, href: `/projects/${project.id}` },
				]}
			/>
			<div className="space-y-6 p-4">
				<Card className="grid grid-flow-col grid-rows-3 gap-4">
					<CardHeader className="row-span-1">
						<CardTitle className="flex items-center gap-2 text-2xl font-bold">
							{project.name}
							{project.parentProjectId && (
								<Badge variant="secondary">
									Sub-project
									{parentProject ? (
										<>
											{" of "}
											<Link
												to="/projects/$projectId"
												params={{ projectId: parentProject.id! }}
												className="underline"
											>
												{parentProject.name}
											</Link>
										</>
									) : null}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>

					<CardContent className="row-span-2 space-y-4">
						<p>Number of samples: {samples.length}</p>
						<p>Description: {project.description}</p>
					</CardContent>
					<div className="col-span-1 row-span-2 row-start-2 space-x-6 justify-self-center">
						<Button size="lg" onClick={() => openEditProjectDialog("general")}>
							<SquarePen />
							Edit Project
						</Button>
						<Button size="lg" onClick={() => openEditProjectDialog("members")}>
							<UserRoundCog />
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
						</CardHeader>

						<CardContent className="pt-6">
							<TabsContent value="samples">
								<DataTable
									data={samples}
									columns={dynamicColumns}
									onEdit={(sample) => console.log("Edit sample", sample)}
									onDelete={(sample) => console.log("Delete sample", sample)}
									dataType="sample"
									project={project}
									showAddButton={
										<div className="flex gap-2">
											<DownloadTemplateButton type="sample" />
											<AddSampleDialog projectId={projectId} />
											<UploadSampleDialog projectId={projectId} />
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

											<AddAssayDialog projectId={projectId}></AddAssayDialog>
										</div>

										{assays.map((assay) => (
											<TabsContent key={assay.id} value={assay.id}>
												<Card>
													<CardContent className="pt-6">
														<AssayTable assay={assay} project={project} />
													</CardContent>
												</Card>
											</TabsContent>
										))}
									</Tabs>
								) : (
									<div className="flex justify-center py-8">
										<AddAssayDialog projectId={projectId}></AddAssayDialog>
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
