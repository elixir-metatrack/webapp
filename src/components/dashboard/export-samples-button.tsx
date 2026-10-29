"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { exportExcelData } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "@/lib/toast";

interface ExportSamplesButtonProps {
	projectId: string;
	assayId?: string;
	sampleNames: string[];
	selected?: boolean;
	onDownloadTSV: () => void;
}

export function ExportSamplesButton({
	projectId,
	assayId,
	sampleNames,
	selected = false,
	onDownloadTSV,
}: ExportSamplesButtonProps) {
	const [loading, setLoading] = useState(false);

	const downloadExcel = async () => {
		setLoading(true);

		try {
			await exportExcelData(projectId, sampleNames, assayId);
			toastSuccess("Excel export downloaded");
		} catch (error) {
			toastError(
				error instanceof Error ? error.message : "Excel export failed"
			);
		} finally {
			setLoading(false);
		}
	};

	const label = selected
		? `Download selected samples (${sampleNames.length})`
		: "Download all samples";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					disabled={loading || sampleNames.length === 0}
					title="Export visible or selected samples"
				>
					<Download className="h-4 w-4" />
					{loading ? "Exporting…" : label}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuItem disabled={loading} onSelect={onDownloadTSV}>
					<FileText className="mr-2 h-4 w-4" />
					TSV (.tsv)
				</DropdownMenuItem>

				<DropdownMenuItem disabled={loading} onSelect={downloadExcel}>
					<FileSpreadsheet className="mr-2 h-4 w-4" />
					Excel (.xlsx)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
