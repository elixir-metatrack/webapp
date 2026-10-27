import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, SquarePlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvestigation } from "@/lib/api-keycloak";
import type { Project } from "@/lib/types";
import { toastError, toastSuccess } from "#/lib/toast";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";

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

export function AddProjectDialog() {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [detailedDescription, setDetailedDescription] = useState("");
	const [dataOwningOrganization, setDataOwningOrganization] = useState("");
	const [comments, setComments] = useState("");
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const resetForm = () => {
		setName("");
		setDescription("");
		setDetailedDescription("");
		setDataOwningOrganization("");
		setComments("");
	};

	const mutation = useMutation({
		mutationFn: createInvestigation,

		onSuccess: (newProject) => {
			queryClient.setQueryData(["projects"], (old: Project[] = []) => [
				newProject,
				...old,
			]);

			resetForm();
			setOpen(false);

			const now = new Date();
			const formattedDate = now.toLocaleString();

			toastSuccess("Project has been created", {
				description: `${formattedDate}.`,
			});
		},

		onError: (error: Error) => {
			const message = error?.message || "Error creating project";
			toastError(message, {});
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();

		mutation.mutate({
			name,
			description,
			detailedDescription,
			dataOwningOrganization,
			comments,
		});
	};

	return (
		<TooltipProvider>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button>
						<SquarePlus className="h-4 w-4" />
						Create Project
					</Button>
				</DialogTrigger>

				<DialogContent
					aria-describedby={undefined}
					className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
				>
					<form onSubmit={handleCreate} className="space-y-4">
						<DialogHeader>
							<DialogTitle>Create New Project</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
							{/* Project Title */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label htmlFor="projectName" className="font-medium">
										Project Title <span className="text-destructive">*</span>
									</label>
									{renderTooltip("projectTitle")}
								</div>

								<Input
									id="projectName"
									placeholder="Project Title"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							{/* Data Owning Organization */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label
										htmlFor="dataOwningOrganization"
										className="font-medium"
									>
										Data Owning Organization{" "}
										<span className="text-destructive">*</span>
									</label>
									{renderTooltip("dataOwningOrganization")}
								</div>

								<Input
									id="dataOwningOrganization"
									placeholder="Organization responsible for the data"
									value={dataOwningOrganization}
									onChange={(e) => setDataOwningOrganization(e.target.value)}
									required
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label htmlFor="description" className="font-medium">
										Description
									</label>
									{renderTooltip("description")}
								</div>

								<Input
									id="description"
									placeholder="Short project description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>

							{/* Detailed Description */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label htmlFor="detailedDescription" className="font-medium">
										Detailed Description
									</label>
									{renderTooltip("detailedDescription")}
								</div>

								<Textarea
									id="detailedDescription"
									placeholder="Provide additional details about the project"
									value={detailedDescription}
									onChange={(e) => setDetailedDescription(e.target.value)}
									rows={4}
								/>
							</div>

							{/* Comments */}
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label htmlFor="comments" className="font-medium">
										Comments
									</label>
									{renderTooltip("comments")}
								</div>

								<Textarea
									id="comments"
									placeholder="Additional comments about the project"
									value={comments}
									onChange={(e) => setComments(e.target.value)}
									rows={3}
								/>
							</div>
						</div>

						<DialogFooter className="flex justify-between">
							<DialogClose asChild>
								<Button variant="outline" type="button">
									Cancel
								</Button>
							</DialogClose>

							<Button
								type="submit"
								disabled={
									mutation.isPending ||
									!name.trim() ||
									!dataOwningOrganization.trim()
								}
							>
								{mutation.isPending ? "Creating Project..." : "Create Project"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</TooltipProvider>
	);
}
