import { Download, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";

export function FastqFloatingActions({
	count,
	onDownload,
	onDelete,
	onClear,
	deleteAction,
}: {
	count: number;
	onDownload: () => void;
	onDelete: () => void;
	onClear: () => void;
	deleteAction?: React.ReactNode;
}) {
	if (count === 0) return null;

	return (
		<div className="pointer-events-none absolute inset-x-0 top-35/100 left-35/100 z-50 flex justify-center px-4">
			<div className="bg-background pointer-events-auto flex w-full max-w-xl flex-wrap items-center gap-3 rounded-xl border p-3 shadow-xl">
				<div className="flex items-center gap-2 pr-2">
					<div className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
						<Download className="text-primary size-4" />
					</div>

					<div className="flex flex-col">
						<span className="text-sm font-semibold">
							{count} {count === 1 ? "file" : "files"} selected
						</span>
						<span className="text-muted-foreground text-xs">FASTQ files</span>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<Button variant="outline" size="sm" onClick={onDownload}>
						<Download className="mr-2 size-4" />
						Download
					</Button>

					{deleteAction ?? (
						<Button variant="ghost" size="sm" onClick={onDelete}>
							<Trash2 className="size-4" />
							Delete
						</Button>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={onClear}
						aria-label="Clear FASTQ selection"
						title="Clear selection"
					>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
