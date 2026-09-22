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
import type { CreateSample } from "@/lib/types";
import { createSample } from "@/lib/api-keycloak";
import { ChevronDown, ChevronUp, SquarePlus } from "lucide-react";
import { FormField } from "../form-field";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";

interface AddSampleDialogProps {
	projectId: string;
	studyId?: string;
	assayId?: string;
}

type SampleForm = {
	name: string;
	alias: string;
	taxId: string;
	hostTaxId: string;
	mlst: string;
	isolationSource: string;
	collectionDate: string;
	location: string;
	sequencingLab: string;
	institution: string;
	hostHealthState: string;
	projectTitle: string;
	description: string;
	isolate: string;
	collectedBy: string;
	latitude: string;
	longitude: string;
	environmentalSample: string;
	hostAssociated: string;
	hostCommonName: string;
	hostSubjectId: string;
	collectorName: string;
	collectingInstitution: string;
	hostSex: string;
	influenzaTestMethod: string;
	influenzaTestResult: string;
	otherPathogensTested: string;
	otherPathogensTestResult: string;
	hostHabitat: string;
	isolationSourceHostAssociated: string;
	hostBehaviour: string;
	isolationSourceNonHostAssociated: string;
	influenzaVirusType: string;
	influenzaSubType: string;
	serovar: string;
	strain: string;
	hostAge: string;
	county: string;
	commune: string;
	hospitalHealthInstitution: string;
};

type FieldConfig = {
	key: keyof SampleForm;
	label: string;
	placeholder?: string;
	type?: string;
	numeric?: boolean;
	required?: boolean;
	advanced?: boolean;
};

const fields: FieldConfig[] = [
	{
		key: "name",
		label: "Sample Name",
		placeholder: "Sample name",
		required: true,
	},

	{
		key: "alias",
		label: "Alias",
		placeholder: "Alias",
		advanced: true,
	},

	{
		key: "taxId",
		label: "Tax ID",
		placeholder: "NCBI TaxId",
		numeric: true,
	},

	{
		key: "hostTaxId",
		label: "Host Tax ID",
		placeholder: "Host NCBI TaxId",
		numeric: true,
	},

	{
		key: "mlst",
		label: "MLST",
		placeholder: "MLST",
		advanced: true,
	},

	{
		key: "isolationSource",
		label: "Isolation Source",
		placeholder: "Isolation Source",
	},

	{
		key: "collectionDate",
		label: "Collection Date",
		placeholder: "Collection Date",
		type: "date",
	},

	{
		key: "location",
		label: "Geographic Location",
		placeholder: "Geographic Location",
	},

	{
		key: "sequencingLab",
		label: "Sequencing Lab",
		placeholder: "Sequencing Lab",
	},

	{
		key: "institution",
		label: "Institution (Data owner)",
		placeholder: "Institution",
	},

	{
		key: "hostHealthState",
		label: "Host Health State",
		placeholder: "Host Health State",
		advanced: true,
	},

	// NEW FIELDS

	{
		key: "isolate",
		label: "Isolate",
		placeholder: "Isolate",
		advanced: true,
	},

	{
		key: "collectedBy",
		label: "Collected By",
		placeholder: "Person or institution",
		advanced: true,
	},

	{
		key: "latitude",
		label: "Latitude",
		placeholder: "Latitude",
		type: "number",
		numeric: true,
		advanced: true,
	},

	{
		key: "longitude",
		label: "Longitude",
		placeholder: "Longitude",
		type: "number",
		numeric: true,
		advanced: true,
	},

	{
		key: "environmentalSample",
		label: "Environmental Sample",
		placeholder: "Environmental Sample",
		advanced: true,
	},

	{
		key: "hostAssociated",
		label: "Host Associated",
		placeholder: "Yes / No",
		advanced: true,
	},

	{
		key: "hostCommonName",
		label: "Host Common Name",
		placeholder: "e.g. human",
		advanced: true,
	},

	{
		key: "hostSubjectId",
		label: "Host Subject ID",
		placeholder: "Host Subject ID",
		advanced: true,
	},

	{
		key: "collectorName",
		label: "Collector Name",
		placeholder: "Collector Name",
		advanced: true,
	},

	{
		key: "collectingInstitution",
		label: "Collecting Institution",
		placeholder: "Collecting Institution",
		advanced: true,
	},

	{
		key: "hostSex",
		label: "Host Sex",
		placeholder: "Host Sex",
		advanced: true,
	},

	{
		key: "influenzaTestMethod",
		label: "Influenza Test Method",
		placeholder: "Influenza Test Method",
		advanced: true,
	},

	{
		key: "influenzaTestResult",
		label: "Influenza Test Result",
		placeholder: "P / N",
		advanced: true,
	},

	{
		key: "otherPathogensTested",
		label: "Other Pathogens Tested",
		placeholder: "Other Pathogens Tested",
		advanced: true,
	},

	{
		key: "otherPathogensTestResult",
		label: "Other Pathogens Test Result",
		placeholder: "P / N / not applicable",
		advanced: true,
	},

	{
		key: "hostHabitat",
		label: "Host Habitat",
		placeholder: "Host Habitat",
		advanced: true,
	},

	{
		key: "isolationSourceHostAssociated",
		label: "Isolation Source (Host Associated)",
		placeholder: "Isolation Source",
		advanced: true,
	},

	{
		key: "hostBehaviour",
		label: "Host Behaviour",
		placeholder: "Host Behaviour",
		advanced: true,
	},

	{
		key: "isolationSourceNonHostAssociated",
		label: "Isolation Source (Non-Host Associated)",
		placeholder: "Isolation Source",
		advanced: true,
	},

	{
		key: "influenzaVirusType",
		label: "Influenza Virus Type",
		placeholder: "Influenza Virus Type",
		advanced: true,
	},

	{
		key: "influenzaSubType",
		label: "Influenza Subtype",
		placeholder: "Influenza Subtype",
		advanced: true,
	},

	{
		key: "serovar",
		label: "Serovar",
		placeholder: "Serovar",
		advanced: true,
	},

	{
		key: "strain",
		label: "Strain",
		placeholder: "Strain",
		advanced: true,
	},

	{
		key: "hostAge",
		label: "Host Age",
		placeholder: "Host Age",
		advanced: true,
	},

	{
		key: "county",
		label: "County",
		placeholder: "County / Fylke",
		advanced: true,
	},

	{
		key: "commune",
		label: "Commune",
		placeholder: "Municipality / Kommune",
		advanced: true,
	},

	{
		key: "hospitalHealthInstitution",
		label: "Hospital / Health Institution",
		placeholder: "Hospital or health institution",
		advanced: true,
	},
];

function RenderField({
	field,
	value,
	onChange,
}: {
	field: FieldConfig;
	value: string;
	onChange: (value: string) => void;
}) {
	const tooltip = COLUMN_TOOLTIPS[field.key];

	const input = (
		<Input
			type={field.type ?? "text"}
			placeholder={field.placeholder}
			value={value}
			required={field.required}
			onChange={(e) => {
				const val = e.target.value;

				if (field.numeric && !/^\d*\.?\d*$/.test(val)) {
					return;
				}

				onChange(val);
			}}
			inputMode={field.numeric ? "decimal" : undefined}
		/>
	);

	if (tooltip || field.required) {
		return (
			<FormField
				label={field.label}
				required={field.required}
				tooltip={tooltip}
			>
				{input}
			</FormField>
		);
	}

	return (
		<div>
			<label className="font-medium">{field.label}</label>
			{input}
		</div>
	);
}

export function AddSampleDialog({ projectId }: AddSampleDialogProps) {
	const [form, setForm] = useState({
		name: "",
		alias: "",
		taxId: "",
		hostTaxId: "",
		mlst: "",
		isolationSource: "",
		collectionDate: "",
		location: "",
		sequencingLab: "",
		institution: "",
		hostHealthState: "",

		projectTitle: "",
		description: "",
		isolate: "",
		collectedBy: "",
		latitude: "",
		longitude: "",
		environmentalSample: "",
		hostAssociated: "",
		hostCommonName: "",
		hostSubjectId: "",
		collectorName: "",
		collectingInstitution: "",
		hostSex: "",
		influenzaTestMethod: "",
		influenzaTestResult: "",
		otherPathogensTested: "",
		otherPathogensTestResult: "",
		hostHabitat: "",
		isolationSourceHostAssociated: "",
		hostBehaviour: "",
		isolationSourceNonHostAssociated: "",
		influenzaVirusType: "",
		influenzaSubType: "",
		serovar: "",
		strain: "",
		hostAge: "",
		county: "",
		commune: "",
		hospitalHealthInstitution: "",
	});

	const updateField = (key: keyof SampleForm, value: string) => {
		setForm((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const [showAdvanced, setShowAdvanced] = useState(false);
	const [open, setOpen] = useState(false);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (data: CreateSample) => createSample(data, projectId),

		onSuccess: () => {
			setOpen(false);

			toast.success("Sample has been created", {
				description: new Date().toLocaleString(),
			});

			queryClient.invalidateQueries({
				queryKey: ["samples", projectId],
			});
		},

		onError: (error: Error) => {
			toast.error(error?.message ?? "Error creating sample");
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();

		mutation.mutate({
			...form,

			taxId: form.taxId === "" ? null : Number(form.taxId),
			hostTaxId: form.hostTaxId === "" ? null : Number(form.hostTaxId),

			latitude: form.latitude === "" ? null : Number(form.latitude),
			longitude: form.longitude === "" ? null : Number(form.longitude),
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<SquarePlus className="h-4 w-4" />
					Add Sample
				</Button>
			</DialogTrigger>

			<DialogContent
				aria-describedby={undefined}
				className="max-h-[90vh] overflow-y-auto"
			>
				<form onSubmit={handleCreate} className="space-y-4">
					<DialogHeader>
						<DialogTitle>Create New Sample</DialogTitle>
					</DialogHeader>

					{fields
						.filter((f) => !f.advanced)
						.map((field) => (
							<RenderField
								key={field.key}
								field={field}
								value={form[field.key] ?? ""}
								onChange={(value) => updateField(field.key, value)}
							/>
						))}

					<div
						className={`overflow-hidden transition-all duration-300 ease-in-out ${
							showAdvanced ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
						}`}
					>
						<div className="space-y-4">
							{fields
								.filter((f) => f.advanced)
								.map((field) => (
									<RenderField
										key={field.key}
										field={field}
										value={form[field.key] ?? ""}
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
							{mutation.isPending ? "Creating Sample..." : "Create Sample"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
