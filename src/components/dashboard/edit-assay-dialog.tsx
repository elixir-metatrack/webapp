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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAssay } from "@/lib/api-keycloak";
import type { Assay } from "@/lib/types";
import { SquarePen } from "lucide-react";
import { toastError, toastSuccess } from "#/lib/toast";
import { VocabularyCombobox } from "../vocabulary-combobox";
import { useVocabularies } from "#/hooks/use-vocabularies";
import { FormField } from "../form-field";
import { DeleteAlertButton } from "../delete-alert-button";

const fields = [
	{
		key: "name",
		label: "Experiment Name",
		placeholder: "Experiment name",
	},
	{
		key: "studyAccession",
		label: "Study Accession",
		placeholder: "ENA study accession",
	},
	{
		key: "instrumentModel",
		label: "Instrument Model",
		placeholder: "e.g. Illumina NovaSeq 6000",
	},
	{
		key: "libraryName",
		label: "Library Name",
		placeholder: "Library name",
	},
	{
		key: "librarySource",
		label: "Library Source",
		placeholder: "GENOMIC / TRANSCRIPTOMIC",
	},
	{
		key: "libraryStrategy",
		label: "Library Strategy",
		placeholder: "e.g. WGS",
	},
	{
		key: "librarySelection",
		label: "Library Selection",
		placeholder: "e.g. RANDOM",
	},
	{
		key: "libraryLayout",
		label: "Library Layout",
		placeholder: "PAIRED / SINGLE",
	},
	{
		key: "insertSize",
		label: "Insert Size",
		placeholder: "Insert size",
		numeric: true,
	},
	{
		key: "experimentAccession",
		label: "Experiment Accession",
		placeholder: "Experiment Accession Number",
	},
	{
		key: "runAccession",
		label: "Run Accession",
		placeholder: "Run Accession Number",
	},
] as const;

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
		experimentAccession: assay.experimentAccession ?? "",
		runAccession: assay.runAccession ?? "",
	});

	const queryClient = useQueryClient();

	const { getTerms } = useVocabularies("assay", projectId);

	const updateMutation = useMutation({
		mutationFn: () => updateAssay(projectId, assay.id, form),
		onSuccess: () => {
			toastSuccess("Experiment updated successfully!");
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
			toastError(err?.message ?? "Failed to update experiment"),
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
					{fields.map((field) => {
						const key = field.key;
						const value = form[key];
						const vocabularyTerms = getTerms(key);

						const input =
							vocabularyTerms.length > 0 ? (
								<VocabularyCombobox
									value={String(value)}
									terms={vocabularyTerms}
									onChange={(newValue) => handleChange(key, newValue)}
								/>
							) : (
								<Input
									type={"numeric" in field && field.numeric ? "number" : "text"}
									placeholder={field.placeholder}
									value={value}
									onChange={(e) =>
										handleChange(
											key,
											"numeric" in field && field.numeric
												? e.target.value === ""
													? 0
													: Number(e.target.value)
												: e.target.value
										)
									}
								/>
							);

						return (
							<FormField key={key} label={field.label}>
								{input}
							</FormField>
						);
					})}
				</div>

				<DialogFooter className="w-full !justify-between">
					<div className="mt-4 flex w-full justify-between">
						{isSubProject ? (
							<p className="text-muted-foreground max-w-48 text-sm">
								Shared experiments can only be deleted in the parent project.
							</p>
						) : (
							<DeleteAlertButton
								projectId={projectId}
								item={{ id: assay.id, name: assay.name }}
								entityName="assay"
								insideDropdown={false}
								onDeleted={() => setOpen(false)}
							/>
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
