"use client";

import { useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadSamplesheet, uploadExperimentsheet } from "@/lib/api-keycloak";
import {
	isTableFile,
	TABLE_FILE_ACCEPT,
	TableImportError,
} from "@/lib/table-import";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { HardDriveUpload } from "lucide-react";

interface UploadSampleDialogProps {
	projectId: string;
	assayId?: string;
}

export function UploadSampleDialog({
	projectId,
	assayId,
}: UploadSampleDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [importError, setImportError] = useState<string | null>(null);
	const [partialImport, setPartialImport] = useState(false);
	const entity = assayId ? "Experiment" : "Sample";
	const queryClient = useQueryClient();

	const uploadMutation = useMutation({
		mutationFn: (selectedFile: File) =>
			assayId
				? uploadExperimentsheet(projectId, assayId, selectedFile)
				: uploadSamplesheet(projectId, selectedFile),
		onSuccess: () => {
			toast.success(`${entity} import completed successfully`);
			setFile(null);
			setOpen(false);
		},
		onError: (error: Error) => {
			setImportError(error.message);
			setPartialImport(error instanceof TableImportError);
			toast.error("Import could not be completed. See the details below.");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["samples", projectId] });
			if (assayId) {
				queryClient.invalidateQueries({ queryKey: ["assays", projectId] });
				queryClient.invalidateQueries({ queryKey: ["assaySamples", assayId] });
			}
		},
	});

	const handleUpload = () => {
		if (!file) return;
		setImportError(null);
		setPartialImport(false);
		uploadMutation.mutate(file);
	};

	const selectFile = (selected: File | null) => {
		if (uploadMutation.isPending) return;
		setPartialImport(false);
		if (selected && !isTableFile(selected)) {
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			setImportError("Choose a CSV, TSV, TXT, XLS or XLSX file.");
			return;
		}
		setFile(selected);
		setImportError(null);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files.item(0);
		if (droppedFile) selectFile(droppedFile);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (uploadMutation.isPending) return;
				setOpen(value);
				if (!value) {
					setFile(null);
					setImportError(null);
					setPartialImport(false);
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<HardDriveUpload className="h-4 w-4" />
					Upload {entity}
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Upload {entity} File</DialogTitle>
				</DialogHeader>

				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					className="hover:bg-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition"
				>
					<p className="text-muted-foreground text-sm">
						Drag & drop your file here
					</p>
					<p className="text-muted-foreground text-xs">
						CSV, TSV, XLS, XLSX or TXT
					</p>

					<Button
						variant="secondary"
						className="mt-3"
						onClick={() => fileInputRef.current?.click()}
					>
						Choose file
					</Button>

					<Input
						ref={fileInputRef}
						type="file"
						accept={TABLE_FILE_ACCEPT}
						aria-label={`${entity} table file`}
						disabled={uploadMutation.isPending}
						className="hidden"
						onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
					/>
				</div>

				{file && (
					<p className="mt-2 text-sm">
						Selected file: <strong>{file.name}</strong>
					</p>
				)}

				{importError && (
					<div
						role="alert"
						className="border-destructive max-h-60 space-y-2 overflow-auto rounded-md border p-3 text-sm"
					>
						{/* The server may accept valid rows before reporting the rejected ones. */}
						<p className="whitespace-pre-wrap">{importError}</p>
						{partialImport && (
							<p>
								Valid rows may already have been imported. Check the project
								before retrying.
							</p>
						)}
					</div>
				)}
				{!assayId && (
					<p className="text-muted-foreground text-sm">
						Excel files may include a second sheet with vocabularies for
						existing custom text attributes.
					</p>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="outline"
						disabled={uploadMutation.isPending}
						onClick={() => {
							setOpen(false);
							selectFile(null);
						}}
					>
						Cancel
					</Button>

					<Button
						onClick={handleUpload}
						disabled={!file || uploadMutation.isPending}
					>
						{uploadMutation.isPending ? "Uploading..." : "Upload"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
