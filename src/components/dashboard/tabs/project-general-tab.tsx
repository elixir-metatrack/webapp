import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { updateProject } from "@/lib/api-keycloak";
import type { Project } from "@/lib/types";

import { toastError, toastSuccess } from "#/lib/toast";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";

type ProjectGeneralTabProps = {
	project: Project;
};

export function ProjectGeneralTab({ project }: ProjectGeneralTabProps) {
	const queryClient = useQueryClient();

	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description ?? "");
	const [detailedDescription, setDetailedDescription] = useState(
		project.detailedDescription ?? ""
	);
	const [dataOwningOrganization, setDataOwningOrganization] = useState(
		project.dataOwningOrganization ?? ""
	);
	const [comments, setComments] = useState(project.comments ?? "");

	const renderTooltip = (key: keyof typeof COLUMN_TOOLTIPS) => {
		const tooltip = COLUMN_TOOLTIPS[key];

		if (!tooltip) return null;

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						aria-label={`Help: ${key}`}
						className="text-muted-foreground hover:text-foreground inline-flex items-center"
					>
						<HelpCircle className="h-4 w-4 cursor-help" />
					</button>
				</TooltipTrigger>

				<TooltipContent>
					<p className="max-w-xs">{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		);
	};

	const mutation = useMutation({
		mutationFn: () =>
			updateProject(project.id!, {
				name,
				description,
				detailedDescription,
				dataOwningOrganization,
				comments,
			}),
		onSuccess: () => {
			toastSuccess("Project updated");
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: () => {
			toastError("Failed to update project");
		},
	});

	return (
		<TooltipProvider>
			<div className="w-full space-y-4">
				{/* Project Title */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<label htmlFor="project-name" className="text-sm font-medium">
							Project Title <span className="text-destructive">*</span>
						</label>
						{renderTooltip("projectTitle")}
					</div>

					<Input
						id="project-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Project Title"
						required
					/>
				</div>

				{/* Data Owning Organization */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<label
							htmlFor="data-owning-organization"
							className="text-sm font-medium"
						>
							Data Owning Organization{" "}
							<span className="text-destructive">*</span>
						</label>
						{renderTooltip("dataOwningOrganization")}
					</div>

					<Input
						id="data-owning-organization"
						value={dataOwningOrganization}
						onChange={(e) => setDataOwningOrganization(e.target.value)}
						placeholder="Organization responsible for the data"
						required
					/>
				</div>

				{/* Description */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<label
							htmlFor="project-description"
							className="text-sm font-medium"
						>
							Description
						</label>
						{renderTooltip("description")}
					</div>

					<Textarea
						id="project-description"
						placeholder="Short project description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>

				{/* Detailed Description */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<label
							htmlFor="project-detailed-description"
							className="text-sm font-medium"
						>
							Detailed Description
						</label>
						{renderTooltip("detailedDescription")}
					</div>

					<Textarea
						id="project-detailed-description"
						placeholder="Provide additional details about the project"
						value={detailedDescription}
						onChange={(e) => setDetailedDescription(e.target.value)}
						rows={4}
					/>
				</div>

				{/* Comments */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<label htmlFor="project-comments" className="text-sm font-medium">
							Comments
						</label>
						{renderTooltip("comments")}
					</div>

					<Textarea
						id="project-comments"
						placeholder="Additional comments about the project"
						value={comments}
						onChange={(e) => setComments(e.target.value)}
						rows={3}
					/>
				</div>

				<Button
					onClick={() => mutation.mutate()}
					disabled={
						mutation.isPending || !name.trim() || !dataOwningOrganization.trim()
					}
				>
					{mutation.isPending ? "Saving..." : "Save changes"}
				</Button>
			</div>
		</TooltipProvider>
	);
}
