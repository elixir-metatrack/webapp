"use client";

import { useMemo, useState } from "react";
import type { Table } from "@tanstack/react-table";
import {
	Check,
	Columns3,
	Loader2,
	Pencil,
	Plus,
	Search,
	Trash2,
} from "lucide-react";

import {
	createSampleMetadataField,
	deleteSampleMetadataField,
	getSampleMetadataFields,
	getSampleVocabulary,
	updateSampleMetadataField,
	updateSampleVocabulary,
} from "@/lib/api-keycloak";
import type { SampleMetadataField, SampleMetadataFieldType } from "@/lib/types";

import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toastError, toastSuccess } from "#/lib/toast";
import { VocabularyEditor } from "./vocabulary-editor";
import { ButtonGroup } from "./ui/button-group";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	sortableKeyboardCoordinates,
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableColumnItem } from "./sortable-column-item";

function toSnakeCase(value: string): string {
	return value
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[^a-zA-Z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.toLowerCase();
}

export function DataTableViewOptions<TData>({
	table,
	projectId,
	dataType,
}: {
	table: Table<TData>;
	projectId?: string;
	dataType?: "sample" | "assay";
}) {
	const [search, setSearch] = useState("");

	const queryClient = useQueryClient();

	const { data: customColumns = [], isLoading: loadingCustomColumns } =
		useQuery({
			queryKey: ["sample-metadata-fields", projectId],
			enabled: Boolean(projectId && dataType === "sample"),
			queryFn: () => getSampleMetadataFields(projectId!),
		});

	// ============================================================
	// Create custom column
	// ============================================================

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [newColumnLabel, setNewColumnLabel] = useState("");
	const [newColumnTooltip, setNewColumnTooltip] = useState("");
	const [newColumnTerms, setNewColumnTerms] = useState<string[]>([]);
	const [editColumnTerms, setEditColumnTerms] = useState<string[]>([]);

	const [newColumnType, setNewColumnType] =
		useState<SampleMetadataFieldType>("TEXT");

	const [creatingColumn, setCreatingColumn] = useState(false);

	// ============================================================
	// Edit custom column
	// ============================================================

	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const [columnToEdit, setColumnToEdit] = useState<SampleMetadataField | null>(
		null
	);

	const [editColumnLabel, setEditColumnLabel] = useState("");
	const [editColumnTooltip, setEditColumnTooltip] = useState("");

	const [updatingColumn, setUpdatingColumn] = useState(false);

	// ============================================================
	// Delete custom column
	// ============================================================

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [columnToDelete, setColumnToDelete] =
		useState<SampleMetadataField | null>(null);

	const [deletingColumn, setDeletingColumn] = useState(false);

	// ============================================================
	// Standard table columns
	// ============================================================

	const customColumnKeys = new Set(
		customColumns.filter((field) => !field.archived).map((field) => field.key)
	);

	const columns = table.getAllLeafColumns().filter((column) => {
		if (!column.getCanHide()) {
			return false;
		}

		if (["select", "actions", "name"].includes(column.id)) {
			return false;
		}

		// Custom columns are managed separately.
		if (customColumnKeys.has(column.id)) {
			return false;
		}

		return true;
	});

	// ============================================================
	// Filter standard columns
	// ============================================================

	const filteredColumns = useMemo(() => {
		const value = search.toLowerCase().trim();

		if (!value) {
			return columns;
		}

		return columns.filter((column) => {
			const label = String(
				(column.columnDef.meta as { label?: string } | undefined)?.label ??
					column.id
			);

			return (
				label.toLowerCase().includes(value) ||
				column.id.toLowerCase().includes(value)
			);
		});
	}, [columns, search]);

	// ============================================================
	// Custom columns
	// ============================================================

	const getCustomTableColumn = (field: SampleMetadataField) => {
		return table.getColumn(field.key);
	};

	const availableCustomColumns = customColumns
		.filter((field) => {
			if (dataType !== "sample" || field.archived) return false;

			return Boolean(table.getColumn(field.key)?.getCanHide());
		})
		.sort((a, b) => {
			const order = table.getAllLeafColumns().map((column) => column.id);

			return order.indexOf(a.key) - order.indexOf(b.key);
		});

	const filteredCustomColumns = useMemo(() => {
		const value = search.toLowerCase().trim();

		if (!value) {
			return availableCustomColumns;
		}

		return availableCustomColumns.filter((field) => {
			return (
				field.label.toLowerCase().includes(value) ||
				field.key.toLowerCase().includes(value)
			);
		});
	}, [availableCustomColumns, search]);

	// ============================================================
	// Column visibility
	// ============================================================

	const visibleCount =
		columns.filter((column) => column.getIsVisible()).length +
		availableCustomColumns.filter((field) =>
			table.getColumn(field.key)?.getIsVisible()
		).length;

	const allFilteredTableColumns = [
		...filteredColumns,
		...filteredCustomColumns
			.map((field) => table.getColumn(field.key))
			.filter((column): column is NonNullable<typeof column> =>
				Boolean(column)
			),
	];

	const allFilteredColumnsVisible =
		allFilteredTableColumns.length > 0 &&
		allFilteredTableColumns.every((column) => column.getIsVisible());

	const selectAllFilteredColumns = () => {
		allFilteredTableColumns.forEach((column) => {
			column.toggleVisibility(true);
		});
	};

	const clearAllFilteredColumns = () => {
		allFilteredTableColumns.forEach((column) => {
			column.toggleVisibility(false);
		});
	};

	// ============================================================
	// Create custom column
	// ============================================================

	const handleCreateCustomColumn = async () => {
		const label = newColumnLabel.trim();
		const key = toSnakeCase(label);
		const tooltip = newColumnTooltip.trim();

		if (!key) {
			toastError("Column key is required");
			return;
		}

		if (!label) {
			toastError("Column label is required");
			return;
		}

		if (!projectId) {
			toastError("Project is required");
			return;
		}

		try {
			setCreatingColumn(true);

			const field = await createSampleMetadataField(projectId, {
				key,
				label,
				tooltip,
				type: newColumnType,
			});

			await updateSampleVocabulary(projectId, field.key, newColumnTerms);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["sample-metadata-fields", projectId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["vocabularies"],
				}),
			]);

			setNewColumnLabel("");
			setNewColumnTooltip("");
			setNewColumnType("TEXT");
			setCreateDialogOpen(false);
			setNewColumnTerms([]);

			toastSuccess(`Custom column "${field.label}" created`);
		} catch (error) {
			console.error("Failed to create custom column:", error);

			const message =
				error instanceof Error
					? error.message
					: "Failed to create custom column";

			toastError(message);
		} finally {
			setCreatingColumn(false);
		}
	};

	// ============================================================
	// Edit custom column
	// ============================================================

	const openEditDialog = async (field: SampleMetadataField) => {
		setColumnToEdit(field);
		setEditColumnLabel(field.label);
		setEditColumnTooltip(field.tooltip ?? "");
		setEditColumnTerms([]);

		if (field.type === "TEXT") {
			try {
				const vocabulary = await getSampleVocabulary(projectId!, field.key);

				setEditColumnTerms(vocabulary.terms ?? []);
			} catch (error) {
				console.error("Failed to load vocabulary:", error);
				setEditColumnTerms([]);
			}
		}

		setEditDialogOpen(true);
	};

	const handleEditCustomColumn = async () => {
		if (!columnToEdit || !projectId) {
			return;
		}

		const label = editColumnLabel.trim();

		if (!label) {
			toastError("Column label is required");
			return;
		}

		try {
			setUpdatingColumn(true);

			const updatedField = await updateSampleMetadataField(
				projectId,
				columnToEdit.id,
				{
					label,
					tooltip: editColumnTooltip.trim(),
				}
			);

			await updateSampleVocabulary(
				projectId,
				updatedField.key,
				editColumnTerms
			);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["sample-metadata-fields", projectId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["vocabularies"],
				}),
			]);

			toastSuccess(`Custom column "${updatedField.label}" updated`);

			setEditDialogOpen(false);
			setColumnToEdit(null);
		} catch (error) {
			console.error("Failed to update custom column:", error);

			const message =
				error instanceof Error
					? error.message
					: "Failed to update custom column";

			toastError(message);
		} finally {
			setUpdatingColumn(false);
		}
	};

	// ============================================================
	// Delete custom column
	// ============================================================

	const openDeleteDialog = (field: SampleMetadataField) => {
		setColumnToDelete(field);
		setDeleteDialogOpen(true);
	};

	const handleDeleteCustomColumn = async () => {
		if (!columnToDelete) {
			return;
		}

		if (!projectId) {
			toastError("Project is required");
			return;
		}

		try {
			setDeletingColumn(true);

			await deleteSampleMetadataField(projectId, columnToDelete.id);

			await queryClient.invalidateQueries({
				queryKey: ["sample-metadata-fields", projectId],
			});

			toastSuccess(`Custom column "${columnToDelete.label}" deleted`);

			setDeleteDialogOpen(false);
			setColumnToDelete(null);
		} catch (error) {
			console.error("Failed to delete custom column:", error);

			const message =
				error instanceof Error
					? error.message
					: "Failed to delete custom column";

			toastError(message);
		} finally {
			setDeletingColumn(false);
		}
	};

	// ============================================================
	// Create dialog reset
	// ============================================================

	const handleCreateDialogChange = (open: boolean) => {
		setCreateDialogOpen(open);

		if (!open && !creatingColumn) {
			setNewColumnLabel("");
			setNewColumnTooltip("");
			setNewColumnType("TEXT");
		}
	};

	// ============================================================
	// Order columns
	// ============================================================

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const orderedColumns = table
		.getAllLeafColumns()
		.filter((column) => !["select", "actions"].includes(column.id));

	const orderedColumnIds = orderedColumns.map((column) => column.id);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const oldIndex = orderedColumnIds.indexOf(String(active.id));
		const newIndex = orderedColumnIds.indexOf(String(over.id));

		if (oldIndex === -1 || newIndex === -1) return;

		const newOrder = arrayMove(orderedColumnIds, oldIndex, newIndex);

		table.setColumnOrder(["select", ...newOrder]);
	};

	// ============================================================
	// Render
	// ============================================================

	return (
		<>
			<Dialog>
				<DialogTrigger asChild>
					<Button variant="outline" className="ml-auto">
						<Columns3 />
						Columns settings
					</Button>
				</DialogTrigger>

				<DialogContent className="!max-w-[70vw]">
					<DialogHeader>
						<DialogTitle>Column settings</DialogTitle>

						<DialogDescription>
							Choose which columns are visible in the table and manage custom
							metadata columns.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Search */}

						<div className="relative">
							<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

							<Input
								placeholder="Search columns..."
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Actions */}

						<div className="flex items-center justify-between">
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={
										filteredColumns.length === 0 || allFilteredColumnsVisible
									}
									onClick={selectAllFilteredColumns}
								>
									<Check />
									Select all
								</Button>

								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={filteredColumns.length === 0}
									onClick={clearAllFilteredColumns}
								>
									Clear all
								</Button>
							</div>

							<span className="text-muted-foreground text-sm">
								{visibleCount} of {columns.length} visible
							</span>
						</div>

						<Separator />

						{/* Columns */}
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{/* ================================================== */}
								{/* Available columns */}
								{/* ================================================== */}

								<div className="space-y-3">
									<div>
										<h4 className="font-medium">Available columns</h4>

										<p className="text-muted-foreground text-sm">
											Select the standard columns you want to display.
										</p>
									</div>

									<div className="h-[450px] overflow-y-auto rounded-md border p-2">
										{filteredColumns.length > 0 ? (
											<SortableContext
												items={filteredColumns.map((column) => column.id)}
												strategy={verticalListSortingStrategy}
											>
												<div className="space-y-1">
													{filteredColumns.map((column) => {
														const label = String(
															(
																column.columnDef.meta as
																	| { label?: string }
																	| undefined
															)?.label ?? column.id
														);

														const tooltip = COLUMN_TOOLTIPS[column.id];
														const visible = column.getIsVisible();

														return (
															<SortableColumnItem
																key={column.id}
																id={column.id}
															>
																<ButtonGroup
																	key={column.id}
																	className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm"
																	onClick={() =>
																		column.toggleVisibility(!visible)
																	}
																>
																	<Checkbox
																		checked={visible}
																		onCheckedChange={(value) =>
																			column.toggleVisibility(!!value)
																		}
																		onClick={(event) => event.stopPropagation()}
																	/>

																	<Tooltip>
																		<TooltipTrigger asChild>
																			<span className="flex-1 cursor-help truncate">
																				{label}
																			</span>
																		</TooltipTrigger>

																		{tooltip && (
																			<TooltipContent side="right">
																				<p className="max-w-sm">{tooltip}</p>
																			</TooltipContent>
																		)}
																	</Tooltip>

																	{visible && (
																		<Check className="h-4 w-4 shrink-0" />
																	)}
																</ButtonGroup>
															</SortableColumnItem>
														);
													})}
												</div>
											</SortableContext>
										) : (
											<div className="text-muted-foreground flex h-full items-center justify-center text-sm">
												No columns found.
											</div>
										)}
									</div>
								</div>

								{/* ================================================== */}
								{/* Custom columns */}
								{/* ================================================== */}

								{dataType === "sample" && (
									<div className="space-y-3">
										<div className="flex items-start justify-between gap-4">
											<div>
												<h4 className="font-medium">Custom columns</h4>

												<p className="text-muted-foreground text-sm">
													Create and manage custom metadata columns.
												</p>
											</div>

											<Dialog
												open={createDialogOpen}
												onOpenChange={handleCreateDialogChange}
											>
												<div className="flex items-center gap-2">
													<DialogTrigger asChild>
														<Button type="button" variant="outline" size="sm">
															<Plus />
															Add custom field
														</Button>
													</DialogTrigger>
												</div>

												<DialogContent className="sm:max-w-[500px]">
													<DialogHeader>
														<DialogTitle>Add custom column</DialogTitle>

														<DialogDescription>
															Create a custom metadata field for samples in this
															project.
														</DialogDescription>
													</DialogHeader>

													<div className="space-y-5">
														<div className="space-y-2">
															<Label htmlFor="custom-column-label">Label</Label>

															<Input
																id="custom-column-label"
																placeholder="e.g. Sequencing Platform"
																value={newColumnLabel}
																onChange={(event) =>
																	setNewColumnLabel(event.target.value)
																}
																disabled={creatingColumn}
															/>

															<p className="text-muted-foreground text-xs">
																This is the name that will be displayed in the
																table.
															</p>
														</div>

														<div className="space-y-2">
															<Label htmlFor="custom-column-label">
																Tooltip
															</Label>

															<Input
																id="custom-column-tooltip"
																placeholder="e.g. Description of Field"
																value={newColumnTooltip}
																onChange={(event) =>
																	setNewColumnTooltip(event.target.value)
																}
																disabled={creatingColumn}
															/>

															<p className="text-muted-foreground text-xs">
																This is the help text for the new metadata
																column.
															</p>
														</div>

														<div className="space-y-2">
															<Label htmlFor="custom-column-type">Type</Label>

															<Select
																value={newColumnType}
																onValueChange={(value) =>
																	setNewColumnType(
																		value as SampleMetadataFieldType
																	)
																}
																disabled={creatingColumn}
															>
																<SelectTrigger id="custom-column-type">
																	<SelectValue placeholder="Select a type" />
																</SelectTrigger>

																<SelectContent>
																	<SelectItem value="TEXT">Text</SelectItem>
																	<SelectItem value="NUMBER">Number</SelectItem>
																	<SelectItem value="BOOLEAN">
																		Boolean
																	</SelectItem>
																	<SelectItem value="DATE">Date</SelectItem>
																</SelectContent>
															</Select>
														</div>

														<Separator />

														<div className="space-y-3">
															<div>
																<h4 className="text-sm font-medium">
																	Control vocabulary
																</h4>
																<p className="text-muted-foreground text-xs">
																	Define the allowed values for this field.
																</p>
															</div>

															<VocabularyEditor
																terms={newColumnTerms}
																onTermsChange={setNewColumnTerms}
																fieldKey={newColumnLabel}
															/>
														</div>
													</div>

													<DialogFooter>
														<Button
															type="button"
															variant="outline"
															onClick={() => handleCreateDialogChange(false)}
															disabled={creatingColumn}
														>
															Cancel
														</Button>

														<Button
															type="button"
															onClick={handleCreateCustomColumn}
															disabled={
																creatingColumn || !newColumnLabel.trim()
															}
														>
															{creatingColumn ? (
																<>
																	<Loader2 className="animate-spin" />
																	Creating...
																</>
															) : (
																<>
																	<Plus />
																	Create column
																</>
															)}
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>

										{/* Custom columns list */}

										<div className="h-[450px] overflow-y-auto rounded-md border p-2">
											{loadingCustomColumns ? (
												<div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
													<Loader2 className="h-4 w-4 animate-spin" />
													Loading custom columns...
												</div>
											) : filteredCustomColumns.length > 0 ? (
												<SortableContext
													items={filteredCustomColumns.map(
														(field) => field.key
													)}
													strategy={verticalListSortingStrategy}
												>
													<div className="space-y-1">
														{filteredCustomColumns.map((field) => {
															const column = getCustomTableColumn(field);

															if (!column) {
																return (
																	<div
																		key={field.id}
																		className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
																	>
																		<span className="min-w-0 flex-1 truncate">
																			{field.label}
																		</span>

																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 shrink-0"
																			onClick={() => openEditDialog(field)}
																			title="Edit custom field"
																		>
																			<Pencil className="h-4 w-4" />
																		</Button>

																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 shrink-0"
																			onClick={() => openDeleteDialog(field)}
																			title="Remove custom field"
																		>
																			<Trash2 className="h-4 w-4 text-red-500" />
																		</Button>
																	</div>
																);
															}

															const visible = column.getIsVisible();

															return (
																<SortableColumnItem
																	key={field.key}
																	id={field.key}
																>
																	<ButtonGroup
																		className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm"
																		onClick={() =>
																			column.toggleVisibility(!visible)
																		}
																	>
																		<Checkbox
																			checked={visible}
																			onCheckedChange={(value) =>
																				column.toggleVisibility(!!value)
																			}
																			onClick={(event) =>
																				event.stopPropagation()
																			}
																		/>

																		<Tooltip>
																			<TooltipTrigger asChild>
																				<span className="min-w-0 flex-1 cursor-help truncate text-left">
																					{field.label}
																				</span>
																			</TooltipTrigger>

																			<TooltipContent
																				side="right"
																				className="max-w-sm"
																			>
																				<div className="flex flex-col">
																					<span>
																						Helper text: {field.tooltip}
																					</span>
																					<span>Field Type: {field.type}</span>
																				</div>
																			</TooltipContent>
																		</Tooltip>

																		{visible && (
																			<Check className="h-4 w-4 shrink-0" />
																		)}

																		<Tooltip>
																			<TooltipTrigger asChild>
																				<Button
																					variant="ghost"
																					size="icon"
																					className="h-8 w-8 shrink-0"
																					onClick={(event) => {
																						event.stopPropagation();
																						openEditDialog(field);
																					}}
																				>
																					<Pencil className="h-4 w-4" />
																				</Button>
																			</TooltipTrigger>

																			<TooltipContent>
																				<p>Edit custom field</p>
																			</TooltipContent>
																		</Tooltip>

																		<Tooltip>
																			<TooltipTrigger asChild>
																				<Button
																					variant="ghost"
																					size="icon"
																					className="h-8 w-8 shrink-0"
																					onClick={(event) => {
																						event.stopPropagation();
																						openDeleteDialog(field);
																					}}
																				>
																					<Trash2 className="h-4 w-4 text-red-500" />
																				</Button>
																			</TooltipTrigger>

																			<TooltipContent>
																				<p>Remove this custom field</p>
																			</TooltipContent>
																		</Tooltip>
																	</ButtonGroup>
																</SortableColumnItem>
															);
														})}
													</div>
												</SortableContext>
											) : customColumns.length > 0 ? (
												<div className="text-muted-foreground flex h-full flex-col items-center justify-center px-6 text-center text-sm">
													<Columns3 className="mb-2 h-8 w-8" />

													<p className="font-medium">
														Custom columns are not available in this table
													</p>

													<p className="mt-1 text-xs">
														The metadata fields exist in the project, but their
														corresponding table columns have not been registered
														yet.
													</p>
												</div>
											) : (
												<div className="text-muted-foreground flex h-full flex-col items-center justify-center px-6 text-center">
													<Columns3 className="mb-2 h-8 w-8" />

													<p className="text-sm font-medium">
														No custom columns
													</p>

													<p className="mt-1 text-xs">
														Create a custom metadata column to add it to your
														samples.
													</p>

													<Button
														type="button"
														variant="outline"
														size="sm"
														className="mt-4"
														onClick={() => setCreateDialogOpen(true)}
													>
														<Plus />
														Add custom column
													</Button>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</DndContext>
					</div>
				</DialogContent>
			</Dialog>

			{/* ====================================================== */}
			{/* Edit custom column dialog */}
			{/* ====================================================== */}

			<Dialog
				open={editDialogOpen}
				onOpenChange={(open) => {
					if (!updatingColumn) {
						setEditDialogOpen(open);

						if (!open) {
							setColumnToEdit(null);
							setEditColumnLabel("");
							setEditColumnTooltip("");
							setEditColumnTerms([]);
						}
					}
				}}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Edit custom field</DialogTitle>

						<DialogDescription>
							Update the label and helper text of this custom metadata field.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="edit-custom-column-label">Label</Label>

							<Input
								id="edit-custom-column-label"
								placeholder="e.g. Sequencing Platform"
								value={editColumnLabel}
								onChange={(event) => setEditColumnLabel(event.target.value)}
								disabled={updatingColumn}
							/>

							<p className="text-muted-foreground text-xs">
								This is the name displayed in the table.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-custom-column-tooltip">Tooltip</Label>

							<Input
								id="edit-custom-column-tooltip"
								placeholder="e.g. Description of Field"
								value={editColumnTooltip}
								onChange={(event) => setEditColumnTooltip(event.target.value)}
								disabled={updatingColumn}
							/>

							<p className="text-muted-foreground text-xs">
								This is the help text for the metadata column.
							</p>
						</div>

						{columnToEdit && (
							<>
								<Separator />

								<div className="space-y-3">
									<div>
										<h4 className="text-sm font-medium">Control vocabulary</h4>

										<p className="text-muted-foreground text-xs">
											Define the allowed values for this field.
										</p>
									</div>

									<VocabularyEditor
										terms={editColumnTerms}
										onTermsChange={setEditColumnTerms}
										fieldKey={columnToEdit.key}
									/>
								</div>
							</>
						)}

						{columnToEdit && (
							<div className="text-muted-foreground bg-muted space-y-1 rounded-md p-3 text-xs">
								<p>Field key: {columnToEdit.key}</p>
								<p>Field type: {columnToEdit.type}</p>
								<p>These properties cannot be changed.</p>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setEditDialogOpen(false)}
							disabled={updatingColumn}
						>
							Cancel
						</Button>

						<Button
							type="button"
							onClick={handleEditCustomColumn}
							disabled={updatingColumn || !editColumnLabel.trim()}
						>
							{updatingColumn ? (
								<>
									<Loader2 className="animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Check />
									Save changes
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ====================================================== */}
			{/* Delete custom column dialog */}
			{/* ====================================================== */}

			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					if (!deletingColumn) {
						setDeleteDialogOpen(open);

						if (!open) {
							setColumnToDelete(null);
						}
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete custom column?</AlertDialogTitle>

						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<strong>{columnToDelete?.label}</strong>?
							<br />
							<span className="mt-2 block">
								This will remove the custom metadata field from this project.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={deletingColumn}>
							Cancel
						</AlertDialogCancel>

						<AlertDialogAction
							onClick={handleDeleteCustomColumn}
							disabled={deletingColumn}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deletingColumn ? (
								<>
									<Loader2 className="animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 />
									Delete
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
