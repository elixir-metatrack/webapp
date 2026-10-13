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
import { createAssay } from "@/lib/api-keycloak";
import { ChevronDown, ChevronUp, SquarePlus } from "lucide-react";
import { FormField } from "../form-field";
import { toastSuccess, toastError } from "#/lib/toast";

interface AddAssayDialogProps {
	projectId: string;
}

type AssayForm = {
	name: string;
	studyAccession: string;
	instrumentModel: string;
	libraryName: string;
	librarySource: string;
	libraryStrategy: string;
	librarySelection: string;
	libraryLayout: string;
	insertSize: number;
};

type FieldConfig = {
	key: keyof AssayForm;
	label: string;
	placeholder?: string;
	type?: string;
	numeric?: boolean;
	required?: boolean;
	tooltip?: string;
	advanced?: boolean;
};

const fields: FieldConfig[] = [
	{
		key: "name",
		label: "Experiment Name",
		placeholder: "Experiment name",
		tooltip: "Unique name for this sequencing experiment.",
	},
	{
		key: "studyAccession",
		label: "Study Accession",
		placeholder: "ENA study accession",
		tooltip: "Study accession or unique name.",
		advanced: true,
	},
	{
		key: "instrumentModel",
		label: "Instrument Model",
		placeholder: "e.g. Illumina NovaSeq 6000",
		tooltip: "Model of the sequencing instrument.",
	},
	{
		key: "libraryName",
		label: "Library Name",
		placeholder: "Library name",
		tooltip: "The submitter's name for this library.",
		advanced: true,
	},
	{
		key: "librarySource",
		label: "Library Source",
		placeholder: "GENOMIC / TRANSCRIPTOMIC",
		tooltip:
			"The library_source specifies the type of source material that is being sequenced.",
	},
	{
		key: "libraryStrategy",
		label: "Library Strategy",
		placeholder: "e.g. WGS",
		tooltip: "Sequencing technique intended for this library.",
	},
	{
		key: "librarySelection",
		label: "Library Selection",
		placeholder: "e.g. RANDOM",
		tooltip:
			"Method used to enrich the target in the sequence library preparation.",
		advanced: true,
	},
	{
		key: "libraryLayout",
		label: "Library Layout",
		placeholder: "PAIRED / SINGLE",
		tooltip:
			"Library_layout specifies whether to expect single, paired, or other configuration of reads. in the case of paired reads, information about the relative distance and orientation is specified.",
	},
	{
		key: "insertSize",
		label: "Insert Size",
		placeholder: "Insert size",
		type: "number",
		numeric: true,
		tooltip:
			"The size (The distance between paired reads) of the DNA fragment that is sequenced in bp. A typical example for Nextseq is 500 or 550. MiSeq system are 50, 150, 250 and 300 bp.",
		advanced: true,
	},
];

function RenderField({
	field,
	value,
	onChange,
}: {
	field: FieldConfig;
	value: string | number;
	onChange: (value: string | number) => void;
}) {
	const input = (
		<Input
			type={field.type ?? "text"}
			placeholder={field.placeholder}
			value={value}
			required={field.required}
			onChange={(e) => {
				const val = e.target.value;

				if (field.numeric) {
					onChange(val === "" ? 0 : Number(val));
				} else {
					onChange(val);
				}
			}}
			inputMode={field.numeric ? "numeric" : undefined}
		/>
	);

	return (
		<FormField
			label={field.label}
			required={field.required}
			tooltip={field.tooltip}
		>
			{input}
		</FormField>
	);
}

export function AddAssayDialog({ projectId }: AddAssayDialogProps) {
	const [form, setForm] = useState<AssayForm>({
		name: "",
		studyAccession: "",
		instrumentModel: "",
		libraryName: "",
		librarySource: "",
		libraryStrategy: "",
		librarySelection: "",
		libraryLayout: "",
		insertSize: 0,
	});

	const updateField = (key: keyof AssayForm, value: string | number) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	const [showAdvanced, setShowAdvanced] = useState(false);
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () =>
			createAssay(projectId, {
				name: form.name,
				studyAccession: form.studyAccession || null,
				instrumentModel: form.instrumentModel || null,
				libraryName: form.libraryName || null,
				librarySource: form.librarySource || null,
				libraryStrategy: form.libraryStrategy || null,
				librarySelection: form.librarySelection || null,
				libraryLayout: form.libraryLayout || null,
				insertSize: form.insertSize || null,
			}),

		onSuccess: () => {
			setOpen(false);

			toastSuccess("Experiment has been created", {
				description: new Date().toLocaleString(),
			});

			queryClient.invalidateQueries({
				queryKey: ["assays", projectId],
			});
		},

		onError: (error: Error) => {
			toastError(error?.message ?? "Error creating experiment");
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<SquarePlus />
					Add Experiment
				</Button>
			</DialogTrigger>

			<DialogContent aria-describedby={undefined}>
				<form onSubmit={handleCreate} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Create New Experiment</DialogTitle>
					</DialogHeader>

					{fields
						.filter((f) => !f.advanced)
						.map((field) => (
							<RenderField
								key={field.key}
								field={field}
								value={form[field.key]}
								onChange={(value) => updateField(field.key, value)}
							/>
						))}

					<div
						className={`overflow-hidden transition-all duration-300 ${
							showAdvanced ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
						}`}
					>
						<div className="space-y-4">
							{fields
								.filter((f) => f.advanced)
								.map((field) => (
									<RenderField
										key={field.key}
										field={field}
										value={form[field.key]}
										onChange={(value) => updateField(field.key, value)}
									/>
								))}
						</div>
					</div>

					<Button
						type="button"
						variant="ghost"
						className="w-full justify-center gap-2 text-sm"
						onClick={() => setShowAdvanced((prev) => !prev)}
					>
						{showAdvanced ? (
							<>
								<ChevronUp className="h-4 w-4" />
								Hide additional fields
							</>
						) : (
							<>
								<ChevronDown className="h-4 w-4" />
								Show additional fields
							</>
						)}
					</Button>

					<DialogFooter className="flex justify-between">
						<DialogClose asChild>
							<Button variant="outline" type="button">
								Cancel
							</Button>
						</DialogClose>

						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending
								? "Creating Experiment..."
								: "Create Experiment"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
