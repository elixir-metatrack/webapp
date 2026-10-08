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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { CheckCircle, HardDriveUpload, Loader2, XCircle } from "lucide-react";
import { progressUploadFile, requestPresignedUpload } from "@/lib/api-keycloak";
import { Progress } from "../ui/progress";
import { toastSuccess } from "#/lib/toast";

interface UploadSampleDialogProps {
	projectId: string;
	assayId: string;
	sampleName: string;
}

type FileUploadState = {
	file: File;
	progress: number;
	status: "pending" | "uploading" | "done" | "error";
	error?: string;
};

export function UploadDataDialog({
	projectId,
	assayId,
	sampleName,
}: UploadSampleDialogProps) {
	const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const addFiles = (incoming: FileList | File[]) => {
		const arr = Array.from(incoming);
		setFileStates((prev) => [
			...prev,
			...arr.map((file) => ({
				file,
				progress: 0,
				status: "pending" as const,
			})),
		]);
	};

	const updateFile = (index: number, update: Partial<FileUploadState>) => {
		setFileStates((prev) =>
			prev.map((s, i) => (i === index ? { ...s, ...update } : s))
		);
	};

	const handleUpload = async () => {
		if (fileStates.length === 0) return;
		setUploading(true);
		let failed = 0;

		const CONCURRENCY = 5;
		const queue = fileStates.map((_, i) => i);

		const uploadOne = async (index: number) => {
			const state = fileStates[index];
			try {
				updateFile(index, { status: "uploading" });

				const { url } = await requestPresignedUpload({
					projectId: Number(projectId),
					assayId,
					sampleName,
					file: state.file,
				});

				await progressUploadFile(url, state.file, (progress) => {
					updateFile(index, { progress });
				});

				updateFile(index, { status: "done", progress: 100 });
			} catch (err) {
				failed++;
				updateFile(index, {
					status: "error",
					error: err instanceof Error ? err.message : "Upload failed",
				});
			}
		};

		const worker = async () => {
			while (queue.length > 0) {
				const index = queue.shift()!;
				await uploadOne(index);
			}
		};

		await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

		setUploading(false);
		await queryClient.invalidateQueries({ queryKey: ["samples", projectId] });

		const succeeded = fileStates.length - failed;
		if (failed === 0) {
			toastSuccess(
				`${succeeded} file${succeeded > 1 ? "s" : ""} uploaded successfully`
			);
		} else {
			toast.warning(`${succeeded} uploaded, ${failed} failed`);
		}
	};

	const handleOpenChange = (next: boolean) => {
		if (uploading) return;
		setOpen(next);
		if (!next) setFileStates([]);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
	};

	const allSettled =
		fileStates.length > 0 &&
		fileStates.every((s) => s.status === "done" || s.status === "error");

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="flex w-full gap-2 !px-2" variant={"ghost"}>
					<HardDriveUpload />
					Upload Data
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Upload Data Files</DialogTitle>
				</DialogHeader>

				{/* Dropzone — visible while not uploading */}
				{!uploading && (
					<div
						onDrop={handleDrop}
						onDragOver={(e) => e.preventDefault()}
						className="hover:bg-muted flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition"
					>
						<p className="text-muted-foreground text-sm">
							Drag & drop files here
						</p>
						<p className="text-muted-foreground text-xs">
							Any file type · Multiple files supported
						</p>
						<Button
							variant="secondary"
							className="mt-3"
							onClick={() => fileInputRef.current?.click()}
						>
							Choose files
						</Button>
						<Input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={(e) => {
								if (e.target.files) addFiles(e.target.files);
							}}
						/>
					</div>
				)}

				{/* Per-file progress list */}
				{fileStates.length > 0 && (
					<div className="mt-2 max-h-64 space-y-3 overflow-y-auto pr-1">
						{fileStates.map((state, i) => (
							<div key={i} className="space-y-1">
								<div className="flex items-center gap-2 text-sm">
									{state.status === "done" && (
										<CheckCircle className="size-4 shrink-0 text-green-500" />
									)}
									{state.status === "error" && (
										<XCircle className="size-4 shrink-0 text-red-500" />
									)}
									{state.status === "uploading" && (
										<Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
									)}
									{state.status === "pending" && (
										<div className="size-4 shrink-0" />
									)}
									<span className="flex-1 truncate">{state.file.name}</span>
									<span className="text-muted-foreground shrink-0 text-xs">
										{state.progress}%
									</span>
								</div>
								<Progress
									value={state.progress}
									className={`h-1.5 ${
										state.status === "error"
											? "[&>div]:bg-red-500"
											: state.status === "done"
												? "[&>div]:bg-green-500"
												: "[&>div]:bg-blue-500"
									}`}
								/>
								{state.error && (
									<p className="text-destructive text-xs">{state.error}</p>
								)}
							</div>
						))}
					</div>
				)}

				<div className="mt-4 flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={uploading}
					>
						{allSettled ? "Close" : "Cancel"}
					</Button>
					<Button
						onClick={handleUpload}
						disabled={fileStates.length === 0 || uploading || allSettled}
					>
						{uploading
							? "Uploading..."
							: `Upload${fileStates.length > 0 ? ` (${fileStates.length})` : ""}`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
