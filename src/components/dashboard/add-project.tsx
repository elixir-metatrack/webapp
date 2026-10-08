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

export function AddProjectDialog() {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: createInvestigation,
		onSuccess: (newProject) => {
			queryClient.setQueryData(["projects"], (old: Project[] = []) => [
				newProject,
				...old,
			]);

			setName("");
			setDescription("");
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
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<SquarePlus className="h-4 w-4" />
					Add Project
				</Button>
			</DialogTrigger>
			<DialogContent aria-describedby={undefined}>
				<form onSubmit={handleCreate} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Create New Project</DialogTitle>
					</DialogHeader>

					<div className="space-y-2">
						{/* Project Title */}
						<div className="flex items-center gap-2">
							<label htmlFor="projectName" className="font-medium">
								Project Title <span className="text-red-500">*</span>
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<HelpCircle className="h-4 w-4 cursor-pointer text-gray-500" />
									</TooltipTrigger>
									<TooltipContent>
										<p>
											The main title of your project. This field is required.
										</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Input
							id="projectName"
							placeholder="Project Title"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>

						{/* Description */}
						<div className="flex items-center gap-2">
							<label htmlFor="description" className="font-medium">
								Description
							</label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<HelpCircle className="h-4 w-4 cursor-pointer text-gray-500" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Optional description to explain the project.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Input
							id="description"
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<DialogFooter className="flex justify-between">
						<DialogClose asChild>
							<Button variant="outline" type="button">
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Creating Project..." : "Create Project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
