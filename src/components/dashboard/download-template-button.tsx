"use client";

import { useState } from "react";
import {
	ChevronDown,
	Download,
	Files,
	FileSpreadsheet,
	FileText,
	Virus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { downloadExcelTemplate, downloadTemplate } from "@/lib/api-keycloak";
import type { TemplateType } from "@/lib/types";
import { toastError, toastSuccess } from "#/lib/toast";

interface DownloadTemplateButtonProps {
	type: "sample" | "experiment";
}

const SAMPLE_TEMPLATES = [
	{
		type: "sample",
		label: "Sample",
		icon: FileSpreadsheet,
	},
	{
		type: "sample_extended",
		label: "Sample Extended",
		icon: Files,
	},
	{
		type: "sample_virus",
		label: "Sample Virus",
		icon: Virus,
	},
] satisfies {
	type: TemplateType;
	label: string;
	icon: typeof FileSpreadsheet;
}[];

const EXPERIMENT_TEMPLATES = [
	{
		type: "experiment_PE",
		label: "Experiment Paired-End",
		icon: Files,
	},
	{
		type: "experiment_SE",
		label: "Experiment Single-End",
		icon: FileSpreadsheet,
	},
] satisfies {
	type: TemplateType;
	label: string;
	icon: typeof FileSpreadsheet;
}[];

export function DownloadTemplateButton({ type }: DownloadTemplateButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async (
		templateType: TemplateType,
		format: "csv" | "xlsx"
	) => {
		try {
			setLoading(true);

			if (format === "xlsx") {
				await downloadExcelTemplate(templateType);
			} else {
				await downloadTemplate(templateType);
			}

			toastSuccess("Template downloaded successfully");
		} catch (err: unknown) {
			toastError(
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
					Download templates
					<ChevronDown className="ml-1 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">
				{templates.map((template) => {
					const Icon = template.icon;

					return (
						<DropdownMenuSub key={template.type}>
							<DropdownMenuSubTrigger>
								<Icon className="mr-2 h-4 w-4" />
								{template.label}
							</DropdownMenuSubTrigger>

							<DropdownMenuSubContent>
								<DropdownMenuItem
									disabled={loading}
									onSelect={() => handleDownload(template.type, "csv")}
								>
									<FileText className="mr-2 h-4 w-4" />
									CSV
									<span className="text-muted-foreground ml-auto text-xs">
										.csv
									</span>
								</DropdownMenuItem>

								<DropdownMenuItem
									disabled={loading}
									onSelect={() => handleDownload(template.type, "xlsx")}
								>
									<FileSpreadsheet className="mr-2 h-4 w-4" />
									Excel
									<span className="text-muted-foreground ml-auto text-xs">
										.xlsx
									</span>
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
