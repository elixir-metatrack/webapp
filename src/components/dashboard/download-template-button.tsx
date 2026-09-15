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

import { downloadTemplate } from "@/lib/api-keycloak";

interface DownloadTemplateButtonProps {
	type: "sample" | "experiment";
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

export function DownloadTemplateButton({ type }: DownloadTemplateButtonProps) {
	const [loading, setLoading] = useState(false);

	const handleDownload = async (
		templateType: "sample" | "sample_extended" | "sample_virus" | "experiment"
	) => {
		try {
			setLoading(true);

			await downloadTemplate(templateType);

			toast.success("Template downloaded successfully");
		} catch (err: unknown) {
			toast.error((err as Error)?.message ?? "Error downloading template");
		} finally {
			setLoading(false);
		}
	};

	if (type === "experiment") {
		return (
			<Button
				variant="default"
				onClick={() => handleDownload("experiment")}
				disabled={loading}
			>
				<Download className="h-4 w-4" />
				Experiment Template
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default" disabled={loading}>
					<Download className="h-4 w-4" /> Sample Template{" "}
					<ChevronDown className="ml-1 h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start">
				{SAMPLE_TEMPLATES.map((template) => {
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
