import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Braces, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importProjectIsaJson } from "@/lib/api-keycloak";
import type { IsaImportReport } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "@/lib/toast";

interface ImportIsaJsonDialogProps {
	projectId: string;
}

export function ImportIsaJsonDialog({ projectId }: ImportIsaJsonDialogProps) {
	const [open, setOpen] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [document, setDocument] = useState<string | null>(null);
	const [study, setStudy] = useState<string | undefined>();
	const [report, setReport] = useState<IsaImportReport | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const reset = () => {
		setFileName(null);
		setDocument(null);
		setStudy(undefined);
		setReport(null);
		setError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const preview = async (text: string, selectedStudy?: string) => {
		setPending(true);
		setError(null);
		try {
			setReport(
				await importProjectIsaJson(projectId, text, {
					study: selectedStudy,
					commit: false,
				})
			);
		} catch (e) {
			setReport(null);
			setError(e instanceof Error ? e.message : "Preview failed");
		} finally {
			setPending(false);
		}
	};

	const selectFile = async (file: File | null) => {
		if (pending) return;
		reset();
		if (!file) return;
		setFileName(file.name);
		const text = await file.text();
		setDocument(text);
		await preview(text);
	};

	const selectStudy = async (identifier: string) => {
		setStudy(identifier);
		if (document) await preview(document, identifier);
	};

	const commit = async () => {
		if (!document || pending) return;
		setPending(true);
		try {
			const result = await importProjectIsaJson(projectId, document, {
				study,
				commit: true,
			});
			if (result.committed) {
				toastSuccess(
					`Imported ${result.samples.length} samples and ${result.assays.length} experiments`
				);
				setOpen(false);
				reset();
			} else {
				setReport(result);
				toastError("Import could not be completed. See the details below.");
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Import failed");
		} finally {
			setPending(false);
			// Samples, experiments and custom columns may all have changed.
			void queryClient.invalidateQueries({ queryKey: ["samples"] });
			void queryClient.invalidateQueries({ queryKey: ["assays"] });
			void queryClient.invalidateQueries({
				queryKey: ["sample-metadata-fields", projectId],
			});
		}
	};

	const needsStudy =
		report !== null && report.studies.length > 1 && study === undefined;
	const canImport =
		report !== null &&
		report.errors.length === 0 &&
		report.samples.length > 0 &&
		!pending;

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (pending) return;
				setOpen(value);
				if (!value) reset();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex items-center gap-2">
					<Braces className="h-4 w-4" />
					Import ISA-JSON
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Import ISA-JSON</DialogTitle>
					<DialogDescription>
						Experimental. Shows a preview first; nothing is saved until you
						confirm. Existing samples are never changed.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-3">
					<Button
						variant="secondary"
						disabled={pending}
						onClick={() => fileInputRef.current?.click()}
					>
						Choose file
					</Button>
					<span className="text-muted-foreground truncate text-sm">
						{fileName ?? "ISA-JSON (.json)"}
					</span>
					{pending && <Loader2 className="h-4 w-4 animate-spin" />}
					<Input
						ref={fileInputRef}
						type="file"
						accept=".json,application/json"
						aria-label="ISA-JSON file"
						className="hidden"
						onChange={(e) => void selectFile(e.target.files?.[0] ?? null)}
					/>
				</div>

				{report && report.studies.length > 1 && (
					<label className="flex items-center gap-2 text-sm">
						Study
						<select
							className="border-input bg-background rounded-md border px-2 py-1"
							value={study ?? ""}
							onChange={(e) => void selectStudy(e.target.value)}
							disabled={pending}
						>
							<option value="" disabled>
								Choose a study
							</option>
							{report.studies.map((option) => (
								<option
									key={option.identifier ?? ""}
									value={option.identifier ?? ""}
								>
									{option.title ?? option.identifier}
								</option>
							))}
						</select>
					</label>
				)}

				{report && !needsStudy && (
					<div className="max-h-72 space-y-3 overflow-auto text-sm">
						<p>
							<strong>{report.samples.length}</strong> samples,{" "}
							<strong>{report.assays.length}</strong> experiments
							{report.study ? ` from “${report.study}”` : ""}
						</p>
						{report.assays.length > 0 && (
							<ul className="text-muted-foreground list-disc pl-5">
								{report.assays.map((assay) => (
									<li key={assay.name}>
										{assay.name}: {assay.samples} samples, {assay.files} files
									</li>
								))}
							</ul>
						)}
						{report.newFields.length > 0 && (
							<p>
								New custom fields:{" "}
								{report.newFields
									.map((field) => `${field.label} (${field.type})`)
									.join(", ")}
							</p>
						)}
						{report.ignored.length > 0 && (
							<div>
								<p className="font-medium">Not imported</p>
								<ul className="text-muted-foreground list-disc pl-5">
									{report.ignored.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						)}
						{report.errors.length > 0 && (
							<div
								role="alert"
								className="border-destructive space-y-1 rounded-md border p-3"
							>
								<p className="font-medium">
									Fix these problems before importing
								</p>
								<ul className="list-disc pl-5">
									{report.errors.map((problem, index) => (
										<li key={index}>
											{[problem.item, problem.field]
												.filter(Boolean)
												.join(" · ")}
											{problem.value ? ` “${problem.value}”` : ""}:{" "}
											{problem.message}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				{error && (
					<p role="alert" className="text-destructive text-sm">
						{error}
					</p>
				)}

				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						disabled={pending}
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button onClick={() => void commit()} disabled={!canImport}>
						Import
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
