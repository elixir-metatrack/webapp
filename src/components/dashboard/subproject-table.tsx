import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/types";

interface SubProjectsTableProps {
	subProjects: Project[];
	onOpen: (project: Project) => void;
	showAddButton?: React.ReactNode;
}

export function SubProjectsTable({
	subProjects,
	onOpen,
	showAddButton,
}: SubProjectsTableProps) {
	const [filter, setFilter] = useState("");

	const filtered = subProjects.filter((p) =>
		p.name.toLowerCase().includes(filter.toLowerCase())
	);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-x-4">
				<Input
					placeholder="Filter sub-projects..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					className="max-w-sm"
				/>
				{showAddButton}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader className="bg-muted sticky top-0">
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Created On</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.length ? (
							filtered.map((subProject) => (
								<TableRow
									key={subProject.id}
									className="cursor-pointer hover:bg-neutral-300"
									onClick={() => onOpen(subProject)}
								>
									<TableCell className="font-medium">
										{subProject.name}
									</TableCell>
									<TableCell>{subProject.description || "-"}</TableCell>
									<TableCell>
										{subProject.createdOn
											? new Date(subProject.createdOn)
													.toISOString()
													.split("T")[0]
											: "-"}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={3}
									className="h-24 text-center hover:bg-neutral-300"
								>
									No sub-projects yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
