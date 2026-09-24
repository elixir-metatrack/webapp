import { useQuery } from "@tanstack/react-query";
import {
	IconCircleDashedNumber1,
	IconDatabase,
	IconFolders,
	IconMicroscope,
	IconTestPipe,
} from "@tabler/icons-react";

import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useProject } from "#/hooks/use-projects";
import {
	formatStorage,
	getTotalAssays,
	getTotalProjects,
	getTotalSamples,
	getUniqueSampleTypes,
} from "#/lib/data/project-metrics";
import { getProjectStorageStatistics } from "#/lib/api-keycloak";

export function SectionCards() {
	const { data, isLoading } = useProject();

	const projects = data?.projects ?? [];

	const { data: storageStats = [], isLoading: isStorageLoading } = useQuery({
		queryKey: [
			"projects-storage-statistics",
			projects.map((project) => project.id),
		],
		queryFn: async () => {
			return Promise.all(
				projects
					.filter((project) => project.id)
					.map((project) => getProjectStorageStatistics(project.id!))
			);
		},
		enabled: projects.length > 0,
	});

	if (isLoading || !data) {
		return (
			<div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
				{[1, 2, 3, 4, 5].map((i) => (
					<Card key={i} className="animate-pulse">
						<CardHeader>
							<CardDescription>Loading...</CardDescription>
							<CardTitle>...</CardTitle>
						</CardHeader>
					</Card>
				))}
			</div>
		);
	}

	const { projects: allProjects, samples, assays } = data;

	const totalSamples = getTotalSamples(samples);
	const totalProjects = getTotalProjects(allProjects);
	const totalAssays = getTotalAssays(assays);
	const sampleTypes = getUniqueSampleTypes(samples);

	const totalStorageBytes = storageStats.reduce(
		(total, stats) => total + stats.totalBytes,
		0
	);

	const storage = formatStorage(totalStorageBytes);

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
			{/* PROJECTS */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Total Projects</CardDescription>
					<CardTitle className="text-2xl font-semibold">
						{totalProjects}
					</CardTitle>
				</CardHeader>
				<CardFooter className="gap-2 text-sm">
					<IconFolders className="size-5" />
					Your research projects
				</CardFooter>
			</Card>

			{/* SAMPLES */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Total Samples</CardDescription>
					<CardTitle className="text-2xl font-semibold">
						{totalSamples}
					</CardTitle>
				</CardHeader>
				<CardFooter className="gap-2 text-sm">
					<IconTestPipe className="size-5" />
					Across all projects
				</CardFooter>
			</Card>

			{/* ASSAYS */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Total Experiments</CardDescription>
					<CardTitle className="text-2xl font-semibold">
						{totalAssays}
					</CardTitle>
				</CardHeader>
				<CardFooter className="gap-2 text-sm">
					<IconMicroscope className="size-5" />
					Sequencing experiments
				</CardFooter>
			</Card>

			{/* SAMPLE TYPES */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Sample Diversity</CardDescription>
					<CardTitle className="text-2xl font-semibold">
						{sampleTypes}
					</CardTitle>
				</CardHeader>
				<CardFooter className="gap-2 text-sm">
					<IconCircleDashedNumber1 className="size-5" />
					Unique metadata sources
				</CardFooter>
			</Card>

			{/* DISK */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Disk Usage</CardDescription>
					<CardTitle className="text-2xl font-semibold">
						{isStorageLoading ? "Loading..." : storage.label}
					</CardTitle>
				</CardHeader>
				<CardFooter className="gap-2 text-sm">
					<IconDatabase className="size-5" />
					Storage used across all projects
				</CardFooter>
			</Card>
		</div>
	);
}
