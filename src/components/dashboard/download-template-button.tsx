"use client";

import { useState } from "react";
import {
	ChevronDown,
	Download,
	Files,
	FileSpreadsheet,
	Virus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { downloadExcelTemplate, downloadTemplate } from "@/lib/api-keycloak";
import type { TemplateType } from "@/lib/types";

interface DownloadTemplateButtonProps {
	type: "sample" | "experiment";
	format?: "csv" | "xlsx";
}

const SAMPLE_TEMPLATES = [
	{ type: "sample" as const, label: "Sample", icon: FileSpreadsheet },
	{
		type: "sample_extended" as const,
		label: "Sample Extended",
		icon: Files,
	},
	{ type: "sample_virus" as const, label: "Sample Virus", icon: Virus },
];

const EXPERIMENT_TEMPLATES = [
	{
		type: "experiment_PE" as const,
		label: "Paired-end experiment",
		icon: Files,
	},
	{
		type: "experiment_SE" as const,
		label: "Single-end experiment",
		icon: FileSpreadsheet,
	},
];

export function DownloadTemplateButton({
	type,
	format = "csv",
}: DownloadTemplateButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async (templateType: TemplateType) => {
		try {
			setLoading(true);

			await (format === "xlsx" ? downloadExcelTemplate : downloadTemplate)(
				templateType
			);

			toast.success("Template downloaded successfully");
		} catch (err: unknown) {
			toast.error(
				err instanceof Error ? err.message : "Error downloading template"
			);
		} finally {
			setLoading(false);
		}
	};

	const templates =
		type === "experiment" ? EXPERIMENT_TEMPLATES : SAMPLE_TEMPLATES;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default" disabled={loading}>
					<Download className="h-4 w-4" />
					{format === "xlsx"
						? "Download Excel template"
						: `${type === "experiment" ? "Experiment" : "Sample"} Template`}{" "}
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
							{" "}
							<Icon className="mr-2 h-4 w-4" /> {template.label}{" "}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
