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
import { Checkbox } from "@/components/ui/checkbox";
import { SquarePlus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSubProject, getSamples } from "@/lib/api-keycloak";
import type { Project } from "@/lib/types";

interface AddSubProjectDialogProps {
	parentProjectId: string;
}

export function AddSubProjectDialog({
	parentProjectId,
}: AddSubProjectDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
	const [search, setSearch] = useState("");

	const queryClient = useQueryClient();

	const { data: samples = [] } = useQuery({
		queryKey: ["samples", parentProjectId],
		queryFn: () => getSamples(parentProjectId),
		enabled: open,
	});

	const filteredSamples = samples.filter((sample) =>
		sample.name.toLowerCase().includes(search.toLowerCase())
	);

	const reset = () => {
		setName("");
		setDescription("");
		setSelectedSampleIds([]);
		setSearch("");
	};

	const mutation = useMutation({
		mutationFn: () =>
			createSubProject(parentProjectId, {
				name,
				description,
				sampleIds: selectedSampleIds,
			}),
		onSuccess: (newSubProject) => {
			queryClient.invalidateQueries({
				queryKey: ["subprojects", parentProjectId],
			});
			queryClient.setQueryData(["projects"], (old: Project[] = []) => [
				newSubProject,
				...old,
			]);
			toast.success("Sub-project created");
			setOpen(false);
			reset();
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create sub-project");
		},
	});

	const toggleSample = (sampleId: string) => {
		setSelectedSampleIds((prev) =>
			prev.includes(sampleId)
				? prev.filter((id) => id !== sampleId)
				: [...prev, sampleId]
		);
	};

	const toggleSelectAll = () => {
		const visibleIds = filteredSamples.map((sample) => sample.id);
		setSelectedSampleIds((prev) =>
			visibleIds.every((id) => prev.includes(id))
				? prev.filter((id) => !visibleIds.includes(id))
				: [...new Set([...prev, ...visibleIds])]
		);
	};

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				setOpen(value);
				if (!value) reset();
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<SquarePlus className="h-4 w-4" />
					Create Sub-Project
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-lg" aria-describedby={undefined}>
				<form onSubmit={handleCreate} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Create Sub-Project</DialogTitle>
					</DialogHeader>

					<div className="space-y-2">
						<label htmlFor="subProjectName" className="font-medium">
							Sub-Project Title <span className="text-red-500">*</span>
						</label>
						<Input
							id="subProjectName"
							placeholder="Sub-Project Title"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>

						<label htmlFor="subProjectDescription" className="font-medium">
							Description
						</label>
						<Textarea
							id="subProjectDescription"
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					<div className="space-y-3">
						<label className="font-medium">Samples to include</label>

						<Input
							placeholder="Search samples..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>

						<div className="flex items-center gap-2 border-b pb-2">
							<Checkbox
								aria-label="Select all visible samples"
								checked={
									filteredSamples.length > 0 &&
									filteredSamples.every((sample) =>
										selectedSampleIds.includes(sample.id)
									)
								}
								disabled={filteredSamples.length === 0}
								onCheckedChange={toggleSelectAll}
							/>
							<span className="text-sm font-medium">Select All</span>
						</div>

						<div className="max-h-64 space-y-2 overflow-y-auto">
							{filteredSamples.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No samples found
								</p>
							) : (
								filteredSamples.map((sample) => (
									<div key={sample.id} className="flex items-center gap-2">
										<Checkbox
											aria-label={`Select ${sample.name}`}
											checked={selectedSampleIds.includes(sample.id)}
											onCheckedChange={() => toggleSample(sample.id)}
										/>
										<span className="text-sm">{sample.name}</span>
									</div>
								))
							)}
						</div>
					</div>

					<DialogFooter className="flex justify-between">
						<DialogClose asChild>
							<Button variant="outline" type="button">
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Creating..." : "Create Sub-Project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
