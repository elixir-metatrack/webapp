import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateProject } from "@/lib/api-keycloak";
import { Textarea } from "@/components/ui/textarea";
import { toastError, toastSuccess } from "#/lib/toast";

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
		<div className="w-full space-y-4">
			<div className="space-y-2">
				<label htmlFor="project-name" className="text-sm font-medium">
					Project name
				</label>
				<Input
					id="project-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Project name"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="project-description" className="text-sm font-medium">
					Description
				</label>
				<Textarea
					id="project-description"
					placeholder="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="project-detailed-description"
					className="text-sm font-medium"
				>
					Detailed description
					<span className="text-muted-foreground ml-1 font-normal">
						(Optional)
					</span>
				</label>
				<Textarea
					id="project-detailed-description"
					placeholder="Provide additional details about the project"
					value={detailedDescription}
					onChange={(e) => setDetailedDescription(e.target.value)}
					rows={4}
				/>
			</div>

			<div className="space-y-2">
				<label
					htmlFor="data-owning-organization"
					className="text-sm font-medium"
				>
					Data owning organization
					<span className="text-muted-foreground ml-1 font-normal">
						(Optional)
					</span>
				</label>
				<Input
					id="data-owning-organization"
					value={dataOwningOrganization}
					onChange={(e) => setDataOwningOrganization(e.target.value)}
					placeholder="Organization responsible for the data"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="project-comments" className="text-sm font-medium">
					Comments
					<span className="text-muted-foreground ml-1 font-normal">
						(Optional)
					</span>
				</label>
				<Textarea
					id="project-comments"
					placeholder="Add comments about the project"
					value={comments}
					onChange={(e) => setComments(e.target.value)}
					rows={3}
				/>
			</div>

			<Button
				onClick={() => mutation.mutate()}
				disabled={mutation.isPending || !name.trim()}
			>
				{mutation.isPending ? "Saving..." : "Save changes"}
			</Button>
		</div>
	);
}
