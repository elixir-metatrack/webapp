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
			<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
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

	const totalStorageBytes = storageStats.reduce(
		(total, stats) => total + stats.totalBytes,
		0
	);

	const storage = formatStorage(totalStorageBytes);

	return (
		<div className="*:data-[slot=card]:from-primary/5 grid grid-cols-1 gap-3 px-4 *:data-[slot=card]:bg-gradient-to-t lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* PROJECTS */}
			<Card>
				<CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
					<IconFolders className="text-muted-foreground size-5 shrink-0" />
					<div className="flex-1 space-y-1">
						<CardDescription>Total Projects</CardDescription>
						<CardTitle className="text-2xl font-semibold">
							{totalProjects}
						</CardTitle>
					</div>
				</CardHeader>
			</Card>

			{/* SAMPLES */}
			<Card>
				<CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
					<IconTestPipe className="text-muted-foreground size-5 shrink-0" />
					<div className="flex-1 space-y-1">
						<CardDescription>Total Samples</CardDescription>
						<CardTitle className="text-2xl font-semibold">
							{totalSamples}
						</CardTitle>
					</div>
				</CardHeader>
			</Card>

			{/* EXPERIMENTS */}
			<Card>
				<CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
					<IconMicroscope className="text-muted-foreground size-5 shrink-0" />
					<div className="flex-1 space-y-1">
						<CardDescription>Total Experiments</CardDescription>
						<CardTitle className="text-2xl font-semibold">
							{totalAssays}
						</CardTitle>
					</div>
				</CardHeader>
			</Card>

			{/* STORAGE */}
			<Card>
				<CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
					<IconDatabase className="text-muted-foreground size-5 shrink-0" />
					<div className="flex-1 space-y-1">
						<CardDescription>Total Disk Usage</CardDescription>
						<CardTitle className="text-2xl font-semibold">
							{isStorageLoading ? "Loading..." : storage.label}
						</CardTitle>
					</div>
				</CardHeader>
			</Card>
		</div>
	);
}
