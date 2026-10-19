import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadProjectIsaJson } from "@/lib/api-keycloak";
import { toastError } from "@/lib/toast";

interface ExportIsaJsonButtonProps {
	projectId: string;
}

export function ExportIsaJsonButton({ projectId }: ExportIsaJsonButtonProps) {
	const [pending, setPending] = useState(false);

	async function download() {
		setPending(true);
		try {
			await downloadProjectIsaJson(projectId);
		} catch (error) {
			toastError(
				error instanceof Error ? error.message : "ISA-JSON export failed"
			);
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button variant="outline" onClick={download} disabled={pending}>
				{pending ? <Loader2 className="animate-spin" /> : <Download />}
				{pending ? "Exporting…" : "Export ISA-JSON"}
			</Button>
			<p className="text-muted-foreground text-sm">
				Experimental · All project metadata · Not validated for submission
			</p>
		</div>
	);
}
