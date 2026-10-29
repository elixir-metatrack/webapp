import * as React from "react";
import { useState } from "react";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";

import type { VisibilityState } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreHorizontal, SquarePen, X } from "lucide-react";
import { DataTableColumnHeader } from "../data-table-column-header";
import { DataTablePagination } from "../data-table-pagination";
import { DataTableViewOptions } from "../data-table-column-toggle";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import downloadTSV from "@/lib/data/dataExport";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "../ui/drawer";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteAlertButton } from "../delete-alert-button";
import type {
	Assay,
	CreateSample,
	Project,
	Sample,
	SampleFile,
} from "@/lib/types";
import {
	ASSAY_NUMBER_FIELDS,
	DATE_FIELDS,
	formatDateToYMD,
	getColumnOrder,
	NON_EDITABLE_COLUMNS,
	NON_VIEWED_COLUMNS,
	QUICK_EDIT_LIMIT,
	SAMPLE_NUMBER_FIELDS,
} from "@/lib/utils";
import { ProjectTree, type ProjectGraph } from "../projectTree";
import { buildAssaySelectionTree, buildProjectGraph } from "@/lib/projectTree";
import { UploadDataDialog } from "./upload-data";
import {
	batchEditSamples,
	deleteProjectFile,
	getAssaysInSample,
	getSampleMetadataFields,
	requestPresignedDownload,
	updateAssay,
	updateSample,
} from "@/lib/api-keycloak";
import { useEnrichedSamples } from "#/hooks/use-enrichedSamples";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";
import { toastError, toastSuccess } from "#/lib/toast";
import { VocabularyCombobox } from "../vocabulary-combobox";
import { useVocabularies } from "#/hooks/use-vocabularies";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "../ui/input-group";
import { FastqFloatingActions } from "./fastq-floating-actions";
import { ExportSamplesButton } from "./export-samples-button";

interface DataTableProps<T extends object> {
	data: T[];
	columns?: ColumnDef<T>[];
	onSelectSamples?: (selected: Sample[]) => void;
	onEdit?: (row: T) => void;
	onDelete?: (row: T) => void;
	showAddButton?: React.ReactNode;
	filterPlaceholder?: string;
	project?: Project;
	dataType: "sample" | "assay";
	assay?: Assay;
	onAssayClick?: (assayId: string) => void;
}

const COLUMN_NAMES: Record<string, string> = {
	name: "Sample Name",
	alias: "Alias",
	taxId: "Tax ID",
	taxonName: "Scientific Name",
	hostTaxId: "Host Tax ID",
	hostTaxonName: "Host Scientific Name",
	mlst: "MLST",
	isolationSource: "Isolation Source",
	collectionDate: "Collection Date",
	location: "Geographical Location",
	sequencingLab: "Sequencing Lab",
	institution: "Institution (Data owner)",
	hostHealthState: "Host Health State",
	projectTitle: "Project Title",
	description: "Description",
	isolate: "Isolate",
	collectedBy: "Collected By",
	latitude: "Latitude",
	longitude: "Longitude",
	environmentalSample: "Environmental Sample",
	hostAssociated: "Host Associated",
	hostCommonName: "Host Common Name",
	hostSubjectId: "Host Subject ID",
	collectorName: "Collector Name",
	collectingInstitution: "Collecting Institution",
	hostSex: "Host Sex",
	influenzaTestMethod: "Influenza Test Method",
	influenzaTestResult: "Influenza Test Result",
	otherPathogensTested: "Other Pathogens Tested",
	otherPathogensTestResult: "Other Pathogens Test Result",
	hostHabitat: "Host Habitat",
	isolationSourceHostAssociated: "Isolation Source Host Associated",
	hostBehaviour: "Host Behaviour",
	isolationSourceNonHostAssociated: "Isolation Source Non-Host Associated",
	influenzaVirusType: "Influenza Virus Type",
	influenzaSubType: "Influenza Subtype",
	serovar: "Serovar",
	strain: "Strain",
	hostAge: "Host Age",
	county: "County",
	commune: "Commune",
	hospitalHealthInstitution: "Hospital Health Institution",

	createdOn: "Created On",
	modifiedOn: "Modified On",
	files: "FASTQ Files",
	sampleName: "Sample Name",
	studyAccession: "Study Accession",
	instrumentModel: "Instrument Model",
	libraryName: "Library Name",
	librarySource: "Library Source",
	libraryStrategy: "LibraryStrategy",
	librarySelection: "Library Selection",
	libraryLayout: "Library Layout",
	insertSize: "Insert Size",
};

function getColumnTooltip(key: string) {
	return COLUMN_TOOLTIPS[key] ?? "";
}

function getColumnNewName(key: string) {
	return COLUMN_NAMES[key] ?? "";
}

function QuickEditField({
	fieldKey,
	label,
	terms,
	dataType,
	onSubmit,
}: {
	fieldKey: string;
	label: string;
	terms: string[];
	dataType: "sample" | "assay";
	onSubmit: (value: string) => void;
}) {
	const [value, setValue] = React.useState("");

	const isNumberField =
		dataType === "assay"
			? ASSAY_NUMBER_FIELDS.has(fieldKey)
			: SAMPLE_NUMBER_FIELDS.has(fieldKey);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();

		onSubmit(value);
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2 p-1">
			{terms.length > 0 ? (
				<VocabularyCombobox
					name={fieldKey}
					value={value}
					terms={terms}
					onChange={(newValue) => {
						setValue(newValue);
					}}
				/>
			) : (
				<InputGroup>
					<InputGroupInput
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={label}
						type={isNumberField ? "number" : "text"}
					/>

					{value !== "" && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								type="button"
								size="icon-xs"
								variant="ghost"
								aria-label="Limpar campo"
								title="Limpar campo"
								onClick={() => setValue("")}
							>
								<X />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			)}

			<Button type="submit" size="sm" className="w-full">
				Apply
			</Button>
		</form>
	);
}

export function DataTable<T extends object>({
	data,
	onEdit,
	onDelete,
	showAddButton,
	project,
	filterPlaceholder = "Filter...",
	dataType,
	assay,
	onAssayClick,
}: DataTableProps<T>) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "name",
			desc: false,
		},
	]);
	const [globalFilter, setGlobalFilter] = React.useState("");

	const initialColumnOrder = getColumnOrder(dataType);

	const queryClient = useQueryClient();

	const { getTerms } = useVocabularies(dataType ?? "sample", project?.id);

	React.useEffect(() => {
		setSelectedFastqFiles(new Set());
	}, [project?.id, assay?.id]);

	const { data: customMetadataFields = [] } = useQuery({
		queryKey: ["sample-metadata-fields", project?.id],
		enabled: Boolean(project?.id && dataType === "sample"),
		queryFn: () => getSampleMetadataFields(project!.id!),
	});

	const enrichedData = useEnrichedSamples(
		data as Sample[],
		dataType !== "assay"
	);

	const getHeaderTooltip = (columnId: string): string | undefined => {
		const customField = customMetadataFields.find(
			(field) => field.key === columnId
		);

		return customField?.tooltip || getColumnTooltip(columnId);
	};

	// ===================================================================
	// SELECT FASTQ FILES

	type SelectableFastqFile = {
		uuid: string;
		sampleName: string;
		fileName: string;
		key: string;
	};

	const [selectedFastqFiles, setSelectedFastqFiles] = React.useState<
		Set<string>
	>(() => new Set());

	const fastqFiles = React.useMemo<SelectableFastqFile[]>(() => {
		if (dataType !== "assay") return [];

		return (
			enrichedData as Array<{
				name: string;
				files?: SampleFile[];
			}>
		).flatMap((sample) =>
			(sample.files ?? []).map((file) => ({
				uuid: file.uuid,
				sampleName: sample.name,
				fileName: file.name,
				key: JSON.stringify([sample.name, file.name]),
			}))
		);
	}, [dataType, enrichedData]);

	const selectedFastqFilesToDownload = fastqFiles.filter((file) =>
		selectedFastqFiles.has(file.key)
	);

	const toggleFastqFile = (key: string, checked: boolean) => {
		setSelectedFastqFiles((previous) => {
			const next = new Set(previous);

			if (checked) {
				next.add(key);
			} else {
				next.delete(key);
			}

			return next;
		});
	};

	const handleDownloadFastqFiles = async (
		filesToDownload: SelectableFastqFile[]
	) => {
		if (!project?.id || !assay?.id || filesToDownload.length === 0) {
			return;
		}

		let failed = 0;

		console.log("filesToDownload:", filesToDownload);

		for (const file of filesToDownload) {
			try {
				const { url } = await requestPresignedDownload({
					projectId: Number(project.id),
					assayId: assay.id,
					sampleName: file.sampleName,
					fileName: file.fileName,
				});

				window.open(url, "_blank", "noopener,noreferrer");
			} catch {
				failed++;
			}
		}

		if (failed > 0) {
			toastError(
				`Failed to download ${failed} of ${filesToDownload.length} file(s).`
			);
		} else {
			toastSuccess(`Started downloading ${filesToDownload.length} file(s).`);
		}
	};

	// =============================================================================

	const autoColumns: ColumnDef<T>[] =
		enrichedData.length === 0
			? []
			: (Object.keys(enrichedData[0]) as Array<keyof T>)
					.filter((key) => key !== "files")
					.map((key) => ({
						id: String(key),
						accessorKey: String(key),
						enableHiding: !NON_VIEWED_COLUMNS.includes(String(key)),
						header: (props) => (
							<DataTableColumnHeader
								column={props.column}
								title={getColumnNewName(String(key))}
							/>
						),
						meta: {
							label: getColumnNewName(String(key)),
						},
					}));

	const customColumns: ColumnDef<T>[] =
		dataType === "sample"
			? customMetadataFields
					.filter((field) => !field.archived)
					.map((field) => ({
						id: field.key,
						accessorFn: (row) => {
							const sample = row as Sample;

							return sample.customMetadata?.[field.key] ?? "";
						},
						enableHiding: true,
						header: ({ column }) => (
							<DataTableColumnHeader column={column} title={field.label} />
						),
						cell: ({ getValue }) => {
							const value = getValue();

							return value !== null && value !== undefined ? String(value) : "";
						},
						meta: {
							label: field.label,
						},
					}))
			: [];

	const allDataColumns = [...autoColumns, ...customColumns];

	const orderedColumns: ColumnDef<T>[] =
		allDataColumns.length === 0
			? []
			: initialColumnOrder.length === 0
				? allDataColumns
				: ([
						...initialColumnOrder
							.map((id) => allDataColumns.find((col) => col.id === id))
							.filter(Boolean),
						...customColumns.filter(
							(col) => !initialColumnOrder.includes(String(col.id))
						),
					] as ColumnDef<T>[]);

	const enhancedColumns: ColumnDef<T>[] = (() => {
		const selectionColumn: ColumnDef<T> = {
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
					className="border-neutral-900"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="border-neutral-900"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		};

		const fileColumn: ColumnDef<T> = {
			id: "files",
			header: ({ column }) => (
				<DataTableColumnHeader
					column={column}
					title={getColumnNewName("files")}
				/>
			),

			cell: ({ row }) => {
				const sample = row.original as {
					name: string;
					files?: SampleFile[];
				};

				if (!sample.files || sample.files.length === 0) {
					return null;
				}

				return (
					<div className="flex flex-col gap-2">
						{sample.files.map((file) => {
							const fileKey = JSON.stringify([sample.name, file.name]);

							return (
								<div key={fileKey} className="flex items-center gap-2">
									<Checkbox
										checked={selectedFastqFiles.has(fileKey)}
										onCheckedChange={(checked) =>
											toggleFastqFile(fileKey, checked === true)
										}
										aria-label={`Select ${file.name}`}
									/>

									<button
										type="button"
										onClick={async () => {
											if (!project?.id || !assay?.id) return;

											try {
												const { url } = await requestPresignedDownload({
													projectId: Number(project.id),
													assayId: assay.id,
													sampleName: sample.name,
													fileName: file.name,
												});

												window.open(url, "_blank", "noopener,noreferrer");
											} catch (err: unknown) {
												const message =
													err instanceof Error
														? err.message
														: "Download failed";

												toastError(message);
											}
										}}
										className="text-left text-blue-600 hover:underline"
									>
										{file.name}
									</button>
								</div>
							);
						})}
					</div>
				);
			},

			enableSorting: false,
			enableHiding: true,
		};

		const actionColumn: ColumnDef<T> | undefined =
			onEdit || onDelete
				? {
						id: "actions",
						enableHiding: false,
						cell: ({ row }) => (
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreHorizontal size={16} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{onEdit && dataType === "sample" ? (
										<TableCellViewer
											item={row.original as Sample}
											projectId={project?.id ?? ""}
											dataType={dataType}
											onUpdated={() => {
												if (onEdit) onEdit(row.original);
											}}
										/>
									) : null}

									{dataType === "assay" ? (
										<UploadDataDialog
											projectId={project?.id ?? ""}
											assayId={assay?.id ?? ""}
											sampleName={(row.original as Sample).name}
										/>
									) : null}
									{onDelete && !project?.parentProjectId && (
										<DeleteAlertButton
											projectId={project?.id ?? ""}
											item={row.original as { id: string; name: string }[]}
											entityName={dataType}
											assayId={assay?.id ?? ""}
											onDeleted={() => table.resetRowSelection()}
										/>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						),
					}
				: undefined;

		return [
			selectionColumn,
			...orderedColumns,
			...(dataType === "assay" ? [fileColumn] : []),
			...(actionColumn ? [actionColumn] : []),
		];
	})();

	const enhancedColumnsWithDates: ColumnDef<T>[] = enhancedColumns.map(
		(col) => {
			if (
				"accessorKey" in col &&
				(col.accessorKey === "createdOn" || col.accessorKey === "modifiedOn")
			) {
				return {
					...col,
					cell: ({ row }) => {
						const key = col.accessorKey as string;
						const dateStr = row.getValue(key) as unknown as string;
						if (!dateStr) return "";
						return formatDateToYMD(dateStr);
					},
				};
			}
			return col;
		}
	);

	const [pagination, setPagination] = React.useState({
		pageIndex: 0,
		pageSize: 15,
	});

	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({
			alias: false,
			taxId: false,
			taxonName: true,
			hostTaxId: false,
			hostTaxonName: true,
			isolationSource: true,
			collectionDate: true,
			location: true,
			sequencingLab: false,
			institution: false,
			hostHealthState: false,
			createdOn: false,
			modifiedOn: false,
			lastUpdatedOn: false,
			id: false,
			mlst: false,
			files: true,
			isolate: false,
			collectedBy: false,
			latitude: false,
			longitude: false,
			environmentalSample: false,
			hostAssociated: false,
			hostCommonName: false,
			hostSubjectId: false,
			collectorName: false,
			collectingInstitution: false,
			hostSex: false,
			influenzaTestMethod: false,
			influenzaTestResult: false,
			otherPathogensTested: false,
			otherPathogensTestResult: false,
			hostHabitat: false,
			isolationSourceHostAssociated: false,
			hostBehaviour: false,
			isolationSourceNonHostAssociated: false,
			influenzaVirusType: false,
			influenzaSubType: false,
			serovar: false,
			strain: false,
			hostAge: false,
			county: false,
			commune: false,
			hospitalHealthInstitution: false,
			projectTitle: false,
			description: false,
		});

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: enrichedData as T[],
		columns: enhancedColumnsWithDates,
		getRowId: (row) => String((row as { name: string }).name),
		state: {
			sorting,
			globalFilter,
			columnVisibility,
			pagination,
		},
		autoResetPageIndex: false,
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		enableRowSelection: true,
		onColumnVisibilityChange: setColumnVisibility,
	});

	const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
	const hasSelection = selectedRows.length > 0;
	// Export across all pages, keeping the current filter even when rows are selected.
	const exportRows = hasSelection
		? table.getFilteredSelectedRowModel().rows
		: table.getSortedRowModel().rows;
	const handleDownloadTSV = () => {
		const tsvRows = exportRows.map((row) =>
			Object.fromEntries(
				row
					.getVisibleCells()
					.filter((cell) => cell.column.accessorFn)
					.map((cell) => [cell.column.id, cell.getValue()])
			)
		);
		downloadTSV(tsvRows, hasSelection ? "selected-rows" : "filtered-rows");
	};

	const handleBatchUpdate = async (colName: string, value: string) => {
		try {
			if (!project?.id) {
				toastError("Project is required");
				return;
			}

			/*
			 * ============================================================
			 * ASSAY / EXPERIMENT
			 * ============================================================
			 */
			if (dataType === "assay") {
				const assays = selectedRows as unknown as Assay[];

				await Promise.all(
					assays.map((row) => {
						const updateData: Record<string, unknown> = {};

						const originalValue = row[colName as keyof Assay];

						if (value === "") {
							updateData[colName] = "";
						} else if (typeof originalValue === "number") {
							const numberValue = Number(value);

							updateData[colName] = Number.isNaN(numberValue)
								? null
								: numberValue;
						} else if (typeof originalValue === "boolean") {
							updateData[colName] = value === "true";
						} else {
							updateData[colName] = value;
						}

						return updateAssay(
							project.id!,
							row.id,
							updateData as Partial<Assay>
						);
					})
				);

				toastSuccess("Experiments have been updated");

				await queryClient.invalidateQueries({
					queryKey: ["assays"],
				});

				return;
			}

			/*
			 * ============================================================
			 * SAMPLE
			 * ============================================================
			 */

			const customField = customMetadataFields.find(
				(field) => !field.archived && field.key === colName
			);

			const sampleData = (selectedRows as unknown as Sample[]).map((row) => {
				const updateData: Record<string, unknown> = {};

				/*
				 * Copy all editable standard columns dynamically
				 */
				Object.keys(row).forEach((field) => {
					if (field === "id" || field === "alias") {
						return;
					}

					updateData[field] = row[field as keyof Sample];
				});

				/*
				 * Update custom metadata
				 */
				if (customField) {
					const customMetadata = {
						...(row.customMetadata ?? {}),
					};

					if (value === "") {
						customMetadata[colName] = "";
					} else {
						switch (customField.type) {
							case "NUMBER": {
								const numberValue = Number(value);

								customMetadata[colName] = Number.isNaN(numberValue)
									? null
									: numberValue;

								break;
							}

							case "BOOLEAN":
								customMetadata[colName] = value === "true";
								break;

							case "DATE":
							case "TEXT":
							default:
								customMetadata[colName] = value;
								break;
						}
					}

					updateData.customMetadata = customMetadata;
				} else {
					/*
					 * Update standard column
					 */
					const originalValue = row[colName as keyof Sample];

					if (value === "") {
						updateData[colName] = "";
					} else if (typeof originalValue === "number") {
						const numberValue = Number(value);

						updateData[colName] = Number.isNaN(numberValue)
							? null
							: numberValue;
					} else if (typeof originalValue === "boolean") {
						updateData[colName] = value === "true";
					} else {
						updateData[colName] = value;
					}
				}

				return updateData;
			});

			await batchEditSamples(project.id, {
				sampleData,
			});

			toastSuccess("Samples have been updated");

			await queryClient.invalidateQueries({
				queryKey: ["samples"],
			});
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Error updating data";

			toastError(
				dataType === "assay"
					? "Error updating experiments"
					: "Error updating samples",
				{
					description: (
						<div className="flex flex-col gap-1 text-black">
							{message.split("\n").map((line, index) => (
								<div key={index}>{line}</div>
							))}
						</div>
					),
				}
			);
		}
	};

	/*
	 * ============================================================
	 * PROJECT TREE
	 * ============================================================
	 */

	const selectedSamples: Sample[] =
		dataType === "sample" ? (selectedRows as Sample[]) : [];

	const selectedAssays: Assay[] =
		dataType === "assay" ? (selectedRows as Assay[]) : [];

	/*
	 * ============================================================
	 * SAMPLE TAB
	 *
	 * Selected Samples
	 *      ↓
	 * GET /projects/{projectId}/samples/{sampleId}/assays
	 *      ↓
	 * Assays for each Sample
	 *      ↓
	 * Project -> Sample -> Assay
	 * ============================================================
	 */

	const { data: treeAssaysBySample = {} } = useQuery({
		queryKey: [
			"tree-assays-by-sample",
			project?.id,
			selectedSamples.map((sample) => sample.id),
		],

		enabled:
			dataType === "sample" &&
			Boolean(project?.id) &&
			selectedSamples.length > 0,

		queryFn: async () => {
			if (!project?.id) return {};

			const entries = await Promise.all(
				selectedSamples
					.filter((sample) => Boolean(sample.id))
					.map(async (sample) => {
						const assays = await getAssaysInSample(project.id!, sample.id!);

						return [sample.id, assays] as const;
					})
			);

			return Object.fromEntries(entries);
		},
	});

	/*
	 * ============================================================
	 * BUILD GRAPH
	 * ============================================================
	 */

	const treeData: ProjectGraph = !project
		? { nodes: [], links: [] }
		: dataType === "sample"
			? selectedSamples.length > 0
				? buildProjectGraph(project, selectedSamples, treeAssaysBySample)
				: { nodes: [], links: [] }
			: selectedAssays.length > 0
				? buildAssaySelectionTree(project, assay!, selectedAssays)
				: { nodes: [], links: [] };

	const editableColumns = enhancedColumns.filter(
		(col) => !NON_EDITABLE_COLUMNS.includes(String(col.id))
	);

	const quickEditColumns = editableColumns.slice(1, QUICK_EDIT_LIMIT);
	const moreEditColumns = editableColumns.slice(QUICK_EDIT_LIMIT);

	const handleDeleteSelectedFastqFiles = async (
		filesToDelete: SelectableFastqFile[]
	) => {
		if (!project?.id || !assay?.id || filesToDelete.length === 0) {
			return;
		}

		const results = await Promise.allSettled(
			filesToDelete.map((file) => {
				return deleteProjectFile(Number(project.id), file.uuid);
			})
		);

		const succeeded = results.filter(
			(result) => result.status === "fulfilled"
		).length;

		const failed = results.length - succeeded;

		await queryClient.invalidateQueries({
			queryKey: ["assaySamples", assay.id, String(project.id)],
		});

		if (failed > 0) {
			toastError(`Failed to delete ${failed} of ${results.length} file(s).`);
		}

		if (succeeded > 0) {
			toastSuccess(`${succeeded} file(s) deleted successfully.`);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-center space-x-2 lg:flex">
				<ProjectTree data={treeData} width={1200} onAssayClick={onAssayClick} />
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<Input
					placeholder={filterPlaceholder}
					value={globalFilter ?? ""}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-xs"
				/>

				{selectedRows.length > 0 && (
					<div className="inline-flex min-h-9 max-w-full flex-wrap items-center rounded-md border">
						<div className="text-selected flex flex-1 flex-wrap items-center pl-3 text-sm md:flex-row">
							{table.getFilteredSelectedRowModel().rows.length} selected
							<Button
								variant="ghost"
								size="sm"
								className="text-primary font-semibold"
								onClick={() => table.resetRowSelection()}
							>
								<X />
							</Button>
						</div>

						{!project?.parentProjectId && (
							<>
								<DeleteAlertButton
									projectId={project?.id ?? ""}
									item={selectedRows as { id: string }[]}
									entityName={dataType}
									assayId={assay?.id ?? ""}
									insideDropdown={false}
									onDeleted={() => table.resetRowSelection()}
								/>
							</>
						)}

						<Separator orientation="vertical" className="!h-8" />

						{dataType === "sample" ? (
							<>
								{quickEditColumns.map((col) => {
									const fieldKey = String(col.id);
									const terms = getTerms(fieldKey);

									return (
										<React.Fragment key={fieldKey}>
											<DropdownMenu modal={false}>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="rounded-none"
													>
														{col.meta?.label}
													</Button>
												</DropdownMenuTrigger>

												<DropdownMenuContent>
													<QuickEditField
														fieldKey={fieldKey}
														label={String(col.meta?.label)}
														terms={terms}
														dataType={dataType}
														onSubmit={(value) =>
															handleBatchUpdate(fieldKey, value)
														}
													/>
												</DropdownMenuContent>
											</DropdownMenu>

											<Separator orientation="vertical" className="!h-8" />
										</React.Fragment>
									);
								})}
							</>
						) : null}

						{dataType === "sample" ? (
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="rounded-none">
										<MoreHorizontal />
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent align="end">
									<DropdownMenuLabel className="flex w-full flex-row items-center gap-2 px-6">
										<SquarePen size={18} />
										Edit selected
									</DropdownMenuLabel>

									<DropdownMenuSeparator />

									{moreEditColumns.map((col) => {
										const fieldKey = String(col.id);
										const terms = getTerms(fieldKey);

										return (
											<DropdownMenuItem key={fieldKey} asChild>
												<Popover modal={false}>
													<PopoverTrigger asChild>
														<Button
															variant="ghost"
															className="flex justify-start"
														>
															{String(col.meta?.label)}
														</Button>
													</PopoverTrigger>

													<PopoverContent className="p-1">
														<QuickEditField
															fieldKey={fieldKey}
															label={String(col.meta?.label)}
															terms={terms}
															dataType={dataType}
															onSubmit={(value) =>
																handleBatchUpdate(fieldKey, value)
															}
														/>
													</PopoverContent>
												</Popover>
											</DropdownMenuItem>
										);
									})}
								</DropdownMenuContent>
							</DropdownMenu>
						) : null}
					</div>
				)}

				<div className="ml-auto flex flex-wrap items-center gap-2">
					<DataTableViewOptions
						table={table}
						projectId={project?.id ?? ""}
						dataType={dataType!}
					/>
					{showAddButton}
					<div className="flex items-center gap-2">
						{project?.id && (dataType === "sample" || assay) && (
							<ExportSamplesButton
								projectId={project.id}
								assayId={assay?.id}
								sampleNames={exportRows.map((row) => row.id)}
								selected={hasSelection}
								onDownloadTSV={handleDownloadTSV}
							/>
						)}
					</div>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader className="bg-muted sticky top-0">
						{dataType === "assay" && (
							<TableRow>
								{table.getVisibleLeafColumns().map((column) => (
									<TableHead key={column.id}>
										{column.id === "files" ? (
											<Button
												variant="outline"
												size="sm"
												disabled={fastqFiles.length === 0}
												onClick={() => handleDownloadFastqFiles(fastqFiles)}
											>
												<Download className="mr-2 h-4 w-4" />
												Download All Files
											</Button>
										) : null}
									</TableHead>
								))}
							</TableRow>
						)}

						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const tooltip = getHeaderTooltip(header.column.id);

									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : (
												<div className="flex items-center gap-1">
													{tooltip ? (
														<Tooltip>
															<TooltipTrigger asChild>
																<div>
																	{flexRender(
																		header.column.columnDef.header,
																		header.getContext()
																	)}
																</div>
															</TooltipTrigger>

															<TooltipContent className="max-w-xs">
																<p>{tooltip}</p>
															</TooltipContent>
														</Tooltip>
													) : (
														flexRender(
															header.column.columnDef.header,
															header.getContext()
														)
													)}
												</div>
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="hover:bg-neutral-300"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow className="hover:bg-neutral-300">
								<TableCell
									colSpan={enhancedColumns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />

			{dataType === "assay" && (
				<FastqFloatingActions
					count={selectedFastqFilesToDownload.length}
					onDownload={() =>
						handleDownloadFastqFiles(selectedFastqFilesToDownload)
					}
					onDelete={() =>
						handleDeleteSelectedFastqFiles(selectedFastqFilesToDownload)
					}
					onClear={() => setSelectedFastqFiles(new Set())}
					deleteAction={
						<DeleteAlertButton
							projectId={String(project?.id)}
							assayId={String(assay?.id)}
							entityName="fastq"
							insideDropdown={false}
							item={selectedFastqFilesToDownload.map((file) => ({
								id: file.uuid,
							}))}
							onDeleted={() => setSelectedFastqFiles(new Set())}
						/>
					}
				/>
			)}
		</div>
	);
}

function TableCellViewer({
	item,
	projectId,
	dataType,
	onUpdated,
}: {
	item: Sample;
	projectId: string;
	dataType?: "sample" | "assay";
	onUpdated?: () => void;
}) {
	const [loading, setLoading] = useState(false);
	const [openDrawer, setOpenDrawer] = useState(false);
	const [formValues, setFormValues] = useState<Record<string, string>>({});

	const queryClient = useQueryClient();

	const { data: customMetadataFields = [] } = useQuery({
		queryKey: ["sample-metadata-fields", projectId],
		enabled: Boolean(projectId && dataType === "sample"),
		queryFn: () => getSampleMetadataFields(projectId),
	});

	const columnOrder = getColumnOrder(dataType ?? "sample");

	const standardFields = Object.keys(item)
		.filter(
			(field) =>
				!NON_EDITABLE_COLUMNS.includes(field) &&
				field !== "id" &&
				field !== "customMetadata"
		)
		.sort((a, b) => {
			const indexA = columnOrder.indexOf(a);
			const indexB = columnOrder.indexOf(b);

			if (indexA === -1 && indexB === -1) return 0;
			if (indexA === -1) return 1;
			if (indexB === -1) return -1;

			return indexA - indexB;
		});

	const activeCustomFields = customMetadataFields.filter(
		(field) => !field.archived
	);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!projectId) return;

		setLoading(true);

		try {
			const formData = new FormData(e.currentTarget);
			const updateData: Record<string, unknown> = {};

			/*
			 * Standard columns
			 */
			for (const field of standardFields) {
				const value = formData.get(field);

				if (value === null) continue;

				if (value === "") {
					updateData[field] = "";
					continue;
				}

				const isNumberField =
					dataType === "assay"
						? ASSAY_NUMBER_FIELDS.has(field)
						: SAMPLE_NUMBER_FIELDS.has(field);

				if (isNumberField) {
					const numberValue = Number(value);
					updateData[field] = Number.isNaN(numberValue) ? null : numberValue;
					continue;
				}

				updateData[field] = String(value);
			}

			/*
			 * Custom columns only belong to Samples.
			 */
			if (dataType === "sample" && activeCustomFields.length > 0) {
				const customMetadata: Record<string, string | number | boolean | null> =
					{};

				for (const field of activeCustomFields) {
					const value = formData.get(`customMetadata.${field.key}`);

					if (value === null || value === "") {
						customMetadata[field.key] = "";
						continue;
					}

					switch (field.type) {
						case "NUMBER": {
							const numberValue = Number(value);

							customMetadata[field.key] = Number.isNaN(numberValue)
								? null
								: numberValue;
							break;
						}

						case "BOOLEAN":
							customMetadata[field.key] = value === "true";
							break;

						case "DATE":
						case "TEXT":
						default:
							customMetadata[field.key] = String(value);
							break;
					}
				}

				updateData.customMetadata = customMetadata;
			}

			/*
			 * Update the correct entity.
			 */
			if (dataType === "assay") {
				await updateAssay(projectId, item.id, updateData as Partial<Assay>);

				toastSuccess("Experiment has been updated", {
					description: `${new Date().toLocaleString()}.`,
				});
			} else {
				await updateSample(
					projectId,
					item.id,
					updateData as Partial<CreateSample>
				);

				toastSuccess("Sample has been updated", {
					description: `${new Date().toLocaleString()}.`,
				});

				await queryClient.invalidateQueries({
					queryKey: ["sample-metadata-fields", projectId],
				});
			}

			await queryClient.invalidateQueries({
				queryKey: ["samples"],
			});

			await queryClient.invalidateQueries({
				queryKey: ["assays"],
			});

			onUpdated?.();
			setOpenDrawer(false);
			setFormValues({});
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: `Error updating ${dataType === "assay" ? "experiment" : "sample"}`;

			toastError(message);
		} finally {
			setLoading(false);
		}
	};

	const { getTerms } = useVocabularies(dataType ?? "sample", projectId);

	return (
		<Drawer
			direction="right"
			open={openDrawer}
			onOpenChange={(open) => {
				setOpenDrawer(open);

				if (open) {
					setFormValues({});
				}
			}}
			autoFocus={openDrawer}
		>
			<DrawerTrigger asChild>
				<DrawerTrigger asChild>
					<DropdownMenuItem
						onSelect={(e) => e.preventDefault()}
						className="gap-2"
					>
						<SquarePen className="size-5" />
						{dataType === "sample" ? "Edit" : "Edit all samples"}
					</DropdownMenuItem>
				</DrawerTrigger>
			</DrawerTrigger>

			<DrawerContent aria-describedby={undefined}>
				<DrawerHeader className="gap-1">
					<DrawerTitle className="text-xl">Edit {item.name}</DrawerTitle>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto px-4">
					<form
						id="sampleForm"
						onSubmit={handleSubmit}
						className="flex flex-col gap-4"
					>
						{standardFields.map((field) => {
							const rawValue = item[field as keyof Sample];
							const isDateField = DATE_FIELDS.has(field);

							const isNumberField =
								dataType === "assay"
									? ASSAY_NUMBER_FIELDS.has(field)
									: SAMPLE_NUMBER_FIELDS.has(field);

							const formattedValue = isDateField
								? formatDateToYMD(rawValue as string)
								: String(rawValue ?? "");

							const currentValue = formValues[field] ?? formattedValue;

							const vocabularyTerms = getTerms(field);

							return (
								<div key={field} className="flex flex-col gap-3">
									<Label htmlFor={field}>{getColumnNewName(field)}</Label>

									{vocabularyTerms.length > 0 ? (
										<VocabularyCombobox
											name={field}
											value={formattedValue}
											terms={vocabularyTerms}
										/>
									) : (
										<InputGroup>
											<InputGroupInput
												id={field}
												name={field}
												type={
													isDateField
														? "date"
														: isNumberField
															? "number"
															: "text"
												}
												value={currentValue}
												onChange={(e) =>
													setFormValues((prev) => ({
														...prev,
														[field]: e.target.value,
													}))
												}
												onPointerDown={(e) => e.stopPropagation()}
											/>

											{currentValue !== "" && (
												<InputGroupAddon align="inline-end">
													<InputGroupButton
														type="button"
														variant="ghost"
														size="icon-xs"
														aria-label={`Clear ${getColumnNewName(field)}`}
														title="Clear field"
														onClick={() =>
															setFormValues((prev) => ({
																...prev,
																[field]: "",
															}))
														}
													>
														<X />
													</InputGroupButton>
												</InputGroupAddon>
											)}
										</InputGroup>
									)}
								</div>
							);
						})}

						{dataType === "sample" &&
							activeCustomFields.map((field) => {
								const originalValue = String(
									item.customMetadata?.[field.key] ?? ""
								);

								const inputKey = `customMetadata.${field.key}`;
								const currentValue = formValues[inputKey] ?? originalValue;

								const vocabularyTerms = getTerms(field.key);

								return (
									<div
										key={`custom-${field.id}`}
										className="flex flex-col gap-3"
									>
										<Label htmlFor={`custom-${field.key}`}>{field.label}</Label>

										{vocabularyTerms.length > 0 ? (
											<VocabularyCombobox
												name={inputKey}
												value={originalValue}
												terms={vocabularyTerms}
											/>
										) : (
											<InputGroup>
												<InputGroupInput
													id={`custom-${field.key}`}
													name={inputKey}
													type={
														field.type === "DATE"
															? "date"
															: field.type === "NUMBER"
																? "number"
																: "text"
													}
													value={currentValue}
													onChange={(e) =>
														setFormValues((prev) => ({
															...prev,
															[inputKey]: e.target.value,
														}))
													}
													onPointerDown={(e) => e.stopPropagation()}
												/>

												{currentValue !== "" && (
													<InputGroupAddon align="inline-end">
														<InputGroupButton
															type="button"
															variant="ghost"
															size="icon-xs"
															aria-label={`Clear ${field.label}`}
															title="Clear field"
															onClick={() =>
																setFormValues((prev) => ({
																	...prev,
																	[inputKey]: "",
																}))
															}
														>
															<X />
														</InputGroupButton>
													</InputGroupAddon>
												)}
											</InputGroup>
										)}
									</div>
								);
							})}
					</form>
				</div>

				<DrawerFooter>
					<Button form="sampleForm" type="submit" disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</Button>

					<DrawerClose asChild>
						<Button variant="outline">Cancel</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
