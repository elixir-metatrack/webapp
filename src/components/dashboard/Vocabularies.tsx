"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Search, Trash2, X, Settings2 } from "lucide-react";
import { toast } from "sonner";

import {
	// Sample - project
	getSampleVocabularies,
	getSampleVocabulary,
	updateSampleVocabulary,
	deleteSampleVocabulary,

	// Sample - global
	getGlobalSampleVocabularies,
	getGlobalSampleVocabulary,
	updateGlobalSampleVocabulary,
	deleteGlobalSampleVocabulary,

	// Assay - global
	getGlobalAssayVocabularies,
	getGlobalAssayVocabulary,
	updateGlobalAssayVocabulary,
	deleteGlobalAssayVocabulary,
} from "@/lib/api-keycloak";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Vocabulary } from "#/lib/types";

type VocabularyDataType = "sample" | "assay";

interface VocabulariesProps {
	projectId: string;
	dataType: VocabularyDataType;
	isSystemAdmin: boolean;
}

export function Vocabularies({
	projectId,
	dataType,
	isSystemAdmin,
}: VocabulariesProps) {
	const queryClient = useQueryClient();

	/* -------------------------------------------------------------------------- */
	/* State                                                                      */
	/* -------------------------------------------------------------------------- */

	const [search, setSearch] = useState("");

	const [selectedField, setSelectedField] = useState<string | null>(null);

	const [isViewOpen, setIsViewOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const [newTerm, setNewTerm] = useState("");
	const [bulkTerms, setBulkTerms] = useState("");

	const [editedTerms, setEditedTerms] = useState<string[]>([]);

	/* -------------------------------------------------------------------------- */
	/* Labels                                                                     */
	/* -------------------------------------------------------------------------- */

	const entityLabel = dataType === "sample" ? "Sample" : "Assay";

	/* -------------------------------------------------------------------------- */
	/* Query keys                                                                 */
	/* -------------------------------------------------------------------------- */

	const vocabularyListQueryKey = [
		"vocabularies",
		dataType,
		projectId,
		isSystemAdmin ? "global" : "project",
	];

	const vocabularyQueryKey = [
		"vocabulary",
		dataType,
		projectId,
		selectedField,
		isSystemAdmin ? "global" : "project",
	];

	/* -------------------------------------------------------------------------- */
	/* Get vocabularies                                                           */
	/* -------------------------------------------------------------------------- */

	const { data: vocabularies = [], isLoading } = useQuery<Vocabulary[]>({
		queryKey: vocabularyListQueryKey,

		queryFn: async () => {
			/*
			 * Global
			 */
			if (isSystemAdmin) {
				if (dataType === "sample") {
					return getGlobalSampleVocabularies();
				}

				return getGlobalAssayVocabularies();
			}

			/*
			 * Project
			 */
			if (dataType === "sample") {
				return getSampleVocabularies(projectId);
			}

			return getGlobalAssayVocabularies();
		},

		enabled: Boolean(projectId),
	});

	/* -------------------------------------------------------------------------- */
	/* Get selected vocabulary                                                   */
	/* -------------------------------------------------------------------------- */

	const { data: selectedVocabulary, isLoading: isLoadingVocabulary } =
		useQuery<Vocabulary>({
			queryKey: vocabularyQueryKey,

			queryFn: async () => {
				if (!selectedField) {
					throw new Error("No vocabulary selected");
				}

				/*
				 * Global
				 */
				if (isSystemAdmin) {
					if (dataType === "sample") {
						return getGlobalSampleVocabulary(selectedField);
					}

					return getGlobalAssayVocabulary(selectedField);
				}

				/*
				 * Project
				 */
				if (dataType === "sample") {
					return getSampleVocabulary(projectId, selectedField);
				}

				return getGlobalAssayVocabulary(selectedField);
			},

			enabled: Boolean(
				projectId && selectedField && (isViewOpen || isEditOpen)
			),
		});

	/* -------------------------------------------------------------------------- */
	/* Helpers                                                                    */
	/* -------------------------------------------------------------------------- */

	const normalizeVocabulary = (
		vocabulary: Vocabulary | string[] | undefined
	): string[] => {
		if (!vocabulary) {
			return [];
		}

		if (Array.isArray(vocabulary)) {
			return vocabulary;
		}

		if ("terms" in vocabulary && Array.isArray(vocabulary.terms)) {
			return vocabulary.terms;
		}

		return [];
	};

	const filteredVocabularies = vocabularies.filter((vocabulary) =>
		vocabulary.fieldKey.toLowerCase().includes(search.toLowerCase())
	);

	/* -------------------------------------------------------------------------- */
	/* Update                                                                     */
	/* -------------------------------------------------------------------------- */

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!selectedField) {
				throw new Error("No vocabulary selected");
			}

			/*
			 * Global
			 */
			if (isSystemAdmin) {
				if (dataType === "sample") {
					return updateGlobalSampleVocabulary(selectedField, editedTerms);
				}

				return updateGlobalAssayVocabulary(selectedField, editedTerms);
			}

			/*
			 * Project
			 */
			if (dataType === "sample") {
				return updateSampleVocabulary(projectId, selectedField, editedTerms);
			}

			return updateGlobalAssayVocabulary(selectedField, editedTerms);
		},

		onSuccess: () => {
			toast.success("Vocabulary updated successfully");

			queryClient.invalidateQueries({
				queryKey: vocabularyListQueryKey,
			});

			queryClient.invalidateQueries({
				queryKey: vocabularyQueryKey,
			});

			setIsEditOpen(false);
		},

		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update vocabulary"
			);
		},
	});

	/* -------------------------------------------------------------------------- */
	/* Delete                                                                     */
	/* -------------------------------------------------------------------------- */

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!selectedField) {
				throw new Error("No vocabulary selected");
			}

			/*
			 * Global
			 */
			if (isSystemAdmin) {
				if (dataType === "sample") {
					return deleteGlobalSampleVocabulary(selectedField);
				}

				return deleteGlobalAssayVocabulary(selectedField);
			}

			/*
			 * Project
			 */
			if (dataType === "sample") {
				return deleteSampleVocabulary(projectId, selectedField);
			}

			return deleteGlobalAssayVocabulary(selectedField);
		},

		onSuccess: () => {
			toast.success("Vocabulary deleted successfully");

			queryClient.invalidateQueries({
				queryKey: vocabularyListQueryKey,
			});

			setSelectedField(null);
			setIsDeleteOpen(false);
			setIsViewOpen(false);
			setIsEditOpen(false);
		},

		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete vocabulary"
			);
		},
	});

	/* -------------------------------------------------------------------------- */
	/* Handlers                                                                   */
	/* -------------------------------------------------------------------------- */

	const handleOpenVocabulary = (field: string) => {
		setSelectedField(field);
		setIsViewOpen(true);
	};

	const handleOpenEdit = async (field: string) => {
		setSelectedField(field);

		try {
			let vocabulary: Vocabulary;

			/*
			 * Global
			 */
			if (isSystemAdmin) {
				vocabulary =
					dataType === "sample"
						? await getGlobalSampleVocabulary(field)
						: await getGlobalAssayVocabulary(field);
			} else {
				/*
				 * Project
				 */
				vocabulary =
					dataType === "sample"
						? await getSampleVocabulary(projectId, field)
						: await getGlobalAssayVocabulary(field);
			}

			/*
			 * Vocabulary already exists
			 */
			setEditedTerms(normalizeVocabulary(vocabulary));
			setIsEditOpen(true);
		} catch (error) {
			/*
			 * The field exists, but it does not have a vocabulary yet.
			 * Open the dialog empty so the user
			 * can create one.
			 */
			toast.error(
				error instanceof Error ? error.message : "Failed to load vocabulary"
			);
		}
	};

	/* -------------------------------------------------------------------------- */
	/* Add single term                                                            */
	/* -------------------------------------------------------------------------- */

	const handleAddTerm = () => {
		const term = newTerm.trim();

		if (!term) {
			return;
		}

		if (editedTerms.includes(term)) {
			toast.error("This term already exists");
			return;
		}

		setEditedTerms((current) => [...current, term]);

		setNewTerm("");
	};

	/* -------------------------------------------------------------------------- */
	/* Add bulk terms                                                             */
	/* -------------------------------------------------------------------------- */

	const handleAddBulkTerms = () => {
		if (!bulkTerms.trim()) {
			return;
		}

		const termsToAdd = bulkTerms
			.split("|")
			.map((term) => term.trim())
			.filter(Boolean);

		setEditedTerms((current) => {
			const existing = new Set(current);

			const newTerms = termsToAdd.filter((term) => !existing.has(term));

			return [...current, ...newTerms];
		});

		setBulkTerms("");
	};

	/* -------------------------------------------------------------------------- */
	/* Remove term                                                                */
	/* -------------------------------------------------------------------------- */

	const handleRemoveTerm = (term: string) => {
		setEditedTerms((current) => current.filter((item) => item !== term));
	};

	/* -------------------------------------------------------------------------- */
	/* Save                                                                       */
	/* -------------------------------------------------------------------------- */

	const handleSave = () => {
		if (editedTerms.length === 0) {
			toast.error("Vocabulary must contain at least one term");

			return;
		}

		updateMutation.mutate();
	};

	/* -------------------------------------------------------------------------- */
	/* Render                                                                     */
	/* -------------------------------------------------------------------------- */

	return (
		<div className="space-y-4">
			{/* Search */}

			<div className="relative max-w-sm">
				<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

				<Input
					placeholder={`Search ${entityLabel.toLowerCase()} vocabularies...`}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Loading */}

			{isLoading && (
				<div className="text-muted-foreground py-8 text-center text-sm">
					Loading vocabularies...
				</div>
			)}

			{/* Empty */}

			{!isLoading && filteredVocabularies.length === 0 && (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<Settings2 className="text-muted-foreground mx-auto mb-3 h-8 w-8" />

					<p className="font-medium">No vocabularies found</p>

					<p className="text-muted-foreground mt-1 text-sm">
						There are no {entityLabel.toLowerCase()} vocabularies matching your
						search.
					</p>
				</div>
			)}

			{/* Vocabulary list */}

			{!isLoading && filteredVocabularies.length > 0 && (
				<div className="rounded-lg border">
					<div className="divide-y">
						{filteredVocabularies.map((vocabulary) => (
							<div
								key={vocabulary.fieldKey}
								className="flex items-center justify-between gap-4 p-4"
							>
								<button
									type="button"
									className="min-w-0 flex-1 text-left"
									onClick={() => handleOpenVocabulary(vocabulary.fieldKey)}
								>
									<div className="font-medium">{vocabulary.fieldKey}</div>

									<div className="text-muted-foreground mt-1 text-sm">
										{normalizeVocabulary(vocabulary).length} terms
									</div>
								</button>

								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleOpenEdit(vocabulary.fieldKey)}
									>
										<Edit3 className="mr-2 h-4 w-4" />
										Edit
									</Button>

									<Button
										variant="outline"
										size="icon"
										className="text-destructive"
										onClick={() => {
											setSelectedField(vocabulary.fieldKey);

											setIsDeleteOpen(true);
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ------------------------------------------------------------------ */}
			{/* View Dialog                                                        */}
			{/* ------------------------------------------------------------------ */}

			<Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>{selectedField}</DialogTitle>

						<DialogDescription>
							{entityLabel} vocabulary terms.
						</DialogDescription>
					</DialogHeader>

					<div className="max-h-[500px] overflow-y-auto py-4">
						{isLoadingVocabulary ? (
							<div className="text-muted-foreground py-8 text-center text-sm">
								Loading terms...
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
								{normalizeVocabulary(selectedVocabulary).map((term) => (
									<Badge key={term} variant="secondary">
										{term}
									</Badge>
								))}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* ------------------------------------------------------------------ */}
			{/* Edit Dialog                                                        */}
			{/* ------------------------------------------------------------------ */}

			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Edit {entityLabel} Vocabulary</DialogTitle>

						<DialogDescription>
							Add or remove terms from <strong>{selectedField}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						{/* Add single term */}

						<div className="space-y-2">
							<Label>Add term</Label>

							<div className="flex gap-2">
								<Input
									value={newTerm}
									onChange={(event) => setNewTerm(event.target.value)}
									placeholder="Enter a term..."
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											handleAddTerm();
										}
									}}
								/>

								<Button type="button" onClick={handleAddTerm}>
									<Plus className="mr-2 h-4 w-4" />
									Add
								</Button>
							</div>
						</div>

						{/* Bulk terms */}

						<div className="space-y-2">
							<Label>Add multiple terms</Label>

							<Input
								value={bulkTerms}
								onChange={(event) => setBulkTerms(event.target.value)}
								placeholder="Term 1 | Term 2 | Term 3"
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										handleAddBulkTerms();
									}
								}}
							/>

							<p className="text-muted-foreground text-xs">
								Separate multiple terms using <strong>|</strong>
							</p>

							<Button
								type="button"
								variant="outline"
								onClick={handleAddBulkTerms}
								disabled={!bulkTerms.trim()}
							>
								Add Terms
							</Button>
						</div>

						<Separator />

						{/* Terms */}

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>Terms ({editedTerms.length})</Label>

								<Button
									variant="ghost"
									size="sm"
									onClick={() => setEditedTerms([])}
								>
									Clear all
								</Button>
							</div>

							<div className="max-h-[350px] overflow-y-auto rounded-md border p-4">
								{editedTerms.length === 0 ? (
									<p className="text-muted-foreground text-center text-sm">
										No terms added.
									</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{editedTerms.map((term) => (
											<Badge
												key={term}
												variant="secondary"
												className="gap-1 pr-1"
											>
												{term}

												<button
													type="button"
													className="hover:bg-muted ml-1 rounded-sm"
													onClick={() => handleRemoveTerm(term)}
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditOpen(false)}>
							Cancel
						</Button>

						<Button
							onClick={handleSave}
							disabled={updateMutation.isPending || editedTerms.length === 0}
						>
							{updateMutation.isPending ? "Saving..." : "Save changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ------------------------------------------------------------------ */}
			{/* Delete Dialog                                                      */}
			{/* ------------------------------------------------------------------ */}

			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete {entityLabel} Vocabulary</DialogTitle>

						<DialogDescription>
							Are you sure you want to delete <strong>{selectedField}</strong>?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
							Cancel
						</Button>

						<Button
							variant="destructive"
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
