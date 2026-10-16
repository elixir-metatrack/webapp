"use client";

import { useState } from "react";
import {
	ChevronDown,
	Download,
	Files,
	FileSpreadsheet,
	Virus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { downloadTemplate } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "#/lib/toast";

interface DownloadTemplateButtonProps {
	type: "sample" | "experiment";
}

type TemplateType =
	| "sample"
	| "sample_extended"
	| "sample_virus"
	| "experiment_PE"
	| "experiment_SE";

const SAMPLE_TEMPLATES = [
	{
		type: "sample" as const,
		label: "Sample",
		icon: FileSpreadsheet,
	},
	{
		type: "sample_extended" as const,
		label: "Sample Extended",
		icon: Files,
	},
	{
		type: "sample_virus" as const,
		label: "Sample Virus",
		icon: Virus,
	},
];

const EXPERIMENT_TEMPLATES = [
	{
		type: "experiment_PE" as const,
		label: "Experiment Paired-End",
		icon: Files,
	},
	{
		type: "experiment_SE" as const,
		label: "Experiment Single-End",
		icon: FileSpreadsheet,
	},
];

export function DownloadTemplateButton({ type }: DownloadTemplateButtonProps) {
	const [loading, setLoading] = useState(false);

	const templates = type === "sample" ? SAMPLE_TEMPLATES : EXPERIMENT_TEMPLATES;

	const handleDownload = async (templateType: TemplateType) => {
		try {
			setLoading(true);

			await downloadTemplate(templateType);

			toastSuccess("Template downloaded successfully");
		} catch (err: unknown) {
			toastError((err as Error)?.message ?? "Error downloading template");
		} finally {
			setLoading(false);
		}
	};

	const label = type === "sample" ? "Sample Template" : "Experiment Template";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default" disabled={loading}>
					<Download className="h-4 w-4" />
					{label}
					<ChevronDown className="ml-1 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">
				{templates.map((template) => {
					const Icon = template.icon;

					return (
						<DropdownMenuItem
							key={template.type}
							onClick={() => handleDownload(template.type)}
						>
							<Icon className="mr-2 h-4 w-4" />
							{template.label}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
