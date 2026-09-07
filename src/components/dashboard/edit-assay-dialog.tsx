"use client";

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
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAssay, updateAssay } from "@/lib/api-keycloak";
import type { Assay } from "@/lib/types";
import { SquarePen } from "lucide-react";

interface EditAssayDialogProps {
	assay: Assay;
	projectId: string;
	isSubProject?: boolean;
}

export function EditAssayDialog({
	assay,
	projectId,
	isSubProject = false,
}: EditAssayDialogProps) {
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({
		name: assay.name ?? "Unknown",
		studyAccession: assay.studyAccession ?? "",
		instrumentModel: assay.instrumentModel ?? "",
		libraryName: assay.libraryName ?? "",
		librarySource: assay.librarySource ?? "",
		libraryStrategy: assay.libraryStrategy ?? "",
		librarySelection: assay.librarySelection ?? "",
		libraryLayout: assay.libraryLayout ?? "",
		insertSize: assay.insertSize ?? 0,
	});

	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: () => updateAssay(projectId, assay.id, form),
		onSuccess: () => {
			toast.success("Experiment updated successfully!");
			queryClient.invalidateQueries({
				queryKey: ["assays"],
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: ["assaySamples"],
				exact: false,
			});
			setOpen(false);
		},
		onError: (err: Error) =>
			toast.error(err?.message ?? "Failed to update experiment"),
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteAssay(projectId, assay.id),
		onSuccess: () => {
			toast.success("Experiment deleted successfully!");
			queryClient.invalidateQueries({ queryKey: ["assays", projectId] });
			setOpen(false);
		},
		onError: (err: Error) =>
			toast.error(err?.message ?? "Failed to delete experiment"),
	});

	const handleChange = (key: keyof typeof form, value: string | number) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<SquarePen />
					Edit Experiment
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-lg" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Edit Experiment</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{Object.keys(form).map((key) => (
						<div key={key} className="space-y-1">
							<label className="text-sm font-medium">{key}</label>
							<Input
								type={key === "insertSize" ? "number" : "text"}
								value={form[key as keyof typeof form]}
								onChange={(e) =>
									handleChange(
										key as keyof typeof form,
										key === "insertSize"
											? Number(e.target.value)
											: e.target.value
									)
								}
							/>
						</div>
					))}
				</div>

				<DialogFooter className="w-full !justify-between">
					<div className="mt-4 flex w-full justify-between">
						{isSubProject ? (
							<p className="text-muted-foreground max-w-48 text-sm">
								Shared experiments can only be deleted in the parent project.
							</p>
						) : (
							<Button
								variant="destructive"
								onClick={() => deleteMutation.mutate()}
								disabled={deleteMutation.isPending}
							>
								{deleteMutation.isPending ? "Deleting..." : "Delete Experiment"}
							</Button>
						)}

						<div className="flex gap-2">
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>
							<Button
								onClick={() => updateMutation.mutate()}
								disabled={updateMutation.isPending}
							>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
