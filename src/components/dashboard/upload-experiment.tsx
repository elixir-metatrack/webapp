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
import { Input } from "@/components/ui/input";
import { HardDriveUpload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadExperiments } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "#/lib/toast";

interface UploadExperimentDialogProps {
	projectId: string;
	assayId: string;
}

export function UploadExperimentDialog({
	projectId,
	assayId,
}: UploadExperimentDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [open, setOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const uploadMutation = useMutation({
		mutationFn: (file: File) => uploadExperiments(projectId, assayId, file),

		onSuccess: () => {
			toastSuccess("Experiments uploaded successfully", {
				description: new Date().toLocaleString(),
			});

			setFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			setOpen(false);
		},

		onError: (error: Error) => {
			console.error(error);
			toastError(error.message || "Error uploading experiments");
		},

		onSettled: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["assays", projectId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["experiments", projectId, assayId],
				}),
			]);
		},
	});

	const handleUpload = () => {
		if (!file || uploadMutation.isPending) return;
		uploadMutation.mutate(file);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();

		if (uploadMutation.isPending) return;

		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile) {
			setFile(droppedFile);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (uploadMutation.isPending) return;

				setOpen(nextOpen);

				if (!nextOpen) {
					setFile(null);
					if (fileInputRef.current) {
						fileInputRef.current.value = "";
					}
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<HardDriveUpload className="h-4 w-4" />
					Upload Experiments
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Upload Experiment File</DialogTitle>
				</DialogHeader>

				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					className="hover:bg-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition"
				>
					<p className="text-muted-foreground text-sm">
						Drag & drop your file here
					</p>

					<p className="text-muted-foreground text-xs">CSV, TSV or TXT</p>

					<Button
						type="button"
						variant="secondary"
						className="mt-3"
						disabled={uploadMutation.isPending}
						onClick={() => fileInputRef.current?.click()}
					>
						Choose file
					</Button>

					<Input
						ref={fileInputRef}
						type="file"
						accept=".csv,.tsv,.txt"
						className="hidden"
						disabled={uploadMutation.isPending}
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					/>
				</div>

				{file && (
					<p className="mt-2 text-sm break-all">
						Selected file: <strong>{file.name}</strong>
					</p>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="outline"
						disabled={uploadMutation.isPending}
						onClick={() => setOpen(false)}
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
