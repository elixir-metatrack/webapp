import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportExcelData } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "@/lib/toast";

interface ExportExcelButtonProps {
	projectId: string;
	assayId?: string;
	sampleNames: string[];
}

export function ExportExcelButton({
	projectId,
	assayId,
	sampleNames,
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
			disabled={loading || sampleNames.length === 0}
			onClick={download}
			title="Export all importable fields for the selected or filtered samples"
		>
			<Download className="h-4 w-4" />
			{loading ? "Exporting…" : "XLS"}
		</Button>
	);
}
