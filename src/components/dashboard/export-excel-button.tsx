import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportExcelData } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "@/lib/toast";

interface ExportExcelButtonProps {
	projectId: string;
	assayId?: string;
	sampleNames: string[];
	selected: boolean;
}

export function ExportExcelButton({
	projectId,
	assayId,
	sampleNames,
	selected,
}: ExportExcelButtonProps) {
	const [loading, setLoading] = useState(false);

	const download = async () => {
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

	return (
		<Button
			variant="outline"
			disabled={loading || sampleNames.length === 0}
			onClick={download}
			title="Export all importable fields for the selected or filtered samples"
		>
			<FileSpreadsheet className="h-4 w-4" />
			{loading
				? "Exporting…"
				: selected
					? `Export Excel (${sampleNames.length} selected)`
					: "Export Excel"}
		</Button>
	);
}
