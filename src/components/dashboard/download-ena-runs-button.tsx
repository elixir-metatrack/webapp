import * as React from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getEnaFastqFiles } from "@/lib/ena-api";
import type { EnaFastqFile } from "@/lib/ena-api";
import { toastError, toastSuccess } from "@/lib/toast";

interface DownloadEnaRunsButtonProps {
	runAccessions: string[];
}

export function DownloadEnaRunsButton({
	runAccessions,
}: DownloadEnaRunsButtonProps) {
	const [loading, setLoading] = React.useState(false);
	const [files, setFiles] = React.useState<EnaFastqFile[]>([]);
	const [resolved, setResolved] = React.useState(false);

	const selectionKey = [...new Set(runAccessions)].sort().join(",");

	React.useEffect(() => {
		setFiles([]);
		setResolved(false);
	}, [selectionKey]);

	const handleFetch = async () => {
		if (runAccessions.length === 0) return;

		setLoading(true);
		setResolved(false);

		try {
			const results = await getEnaFastqFiles(runAccessions);

			setFiles(results);
			setResolved(true);

			if (results.length === 0) {
				toastError("No public FASTQ files found for these runs");
				return;
			}

			toastSuccess(`Found ${results.length} FASTQ file(s)`);
		} catch (error) {
			toastError(
				error instanceof Error ? error.message : "Failed to query ENA"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadFastq = () => {
		if (files.length === 0) return;

		for (const file of files) {
			const anchor = document.createElement("a");

			anchor.href = file.url;
			anchor.download = file.fileName;
			anchor.target = "_blank";
			anchor.rel = "noopener noreferrer";

			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={loading || runAccessions.length === 0}
				onClick={handleFetch}
			>
				{loading ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<Download className="size-4" />
				)}
				Find ENA FASTQ ({runAccessions.length})
			</Button>

			{resolved && files.length > 0 && (
				<Button size="sm" onClick={handleDownloadFastq}>
					<Download className="size-4" />
					Download FASTQ ({files.length})
				</Button>
			)}
		</div>
	);
}
