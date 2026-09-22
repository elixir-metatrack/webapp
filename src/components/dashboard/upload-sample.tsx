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
import { uploadSamplesheet as uploadSampleFileNew } from "@/lib/api-keycloak";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { HardDriveUpload } from "lucide-react";

interface UploadSampleDialogProps {
	projectId: string;
	studyId?: string;
	assayId?: string;
}

export function UploadSampleDialog({
	projectId,
	studyId,
	assayId,
}: UploadSampleDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const uploadMutation = useMutation({
		mutationFn: (file: File) => uploadSampleFileNew(projectId, file),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["samples", projectId, studyId, assayId],
			});

			const now = new Date();
			const formattedDate = now.toLocaleString();

			toast.success("Upload completed successfully", {
				description: `${formattedDate}.`,
				action: {
					label: "Undo",
					onClick: () => console.log("Undo"),
				},
			});
			setFile(null);
			setOpen(false);
		},
		onError: (error: Error) => {
			console.error(error);
			const message = error?.message || "Uploading error";

			toast.error(message, {
				action: {
					label: "Undo",
					onClick: () => console.log("Undo"),
				},
			});
		},
	});

	const handleUpload = () => {
		if (!file) return;
		uploadMutation.mutate(file);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile) setFile(droppedFile);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<HardDriveUpload className="h-4 w-4" />
					Upload Sample
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Upload Sample File</DialogTitle>
				</DialogHeader>

				{/* Dropzone */}
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
						variant="secondary"
						className="mt-3"
						onClick={() => fileInputRef.current?.click()}
					>
						Choose file
					</Button>

					<Input
						ref={fileInputRef}
						type="file"
						accept=".csv,.tsv,.txt"
						className="hidden"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
					/>
				</div>

				{file && (
					<p className="mt-2 text-sm">
						Selected file: <strong>{file.name}</strong>
					</p>
				)}

				{/* Ações */}
				<div className="mt-4 flex justify-end gap-2">
					<Button variant="outline" onClick={() => setOpen(false)}>
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
