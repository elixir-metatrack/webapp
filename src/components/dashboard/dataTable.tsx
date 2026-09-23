import * as React from "react";
import { useState } from "react";
import {
	type Cell,
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type Header,
	type Row,
	type SortingState,
	type Table as TanStackTable,
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
import { toast } from "sonner";
import type {
	Assay,
	CreateSample,
	Project,
	Sample,
	SampleFile,
} from "@/lib/types";
import {
	emptyToNull,
	NON_EDITABLE_COLUMNS,
	NON_VIEWED_COLUMNS,
	QUICK_EDIT_LIMIT,
} from "@/lib/utils";
import { ProjectTree } from "../projectTree";
import {
	buildProjectTree,
	buildProjectTreeSampleAssay,
} from "@/lib/projectTree";
import { UploadDataDialog } from "./upload-data";
import {
	batchEditSamples,
	getSampleMetadataFields,
	requestPresignedDownload,
	updateSample,
} from "@/lib/api-keycloak";
import { useEnrichedSamples } from "#/hooks/use-enrichedSamples";
import { COLUMN_TOOLTIPS } from "#/lib/data/column_tooltips";

interface DataTableProps<T extends object> {
	data: T[];
	columns?: ColumnDef<T>[];
	onSelectSamples?: (selected: Sample[]) => void;
	onEdit?: (row: T) => void;
	onDelete?: (row: T) => void;
	showAddButton?: React.ReactNode;
	filterPlaceholder?: string;
	project?: Project;
	dataType?: "sample" | "assay";
	assay?: Assay;
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

const formatDateToYMD = (dateStr?: string | null) =>
	dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

export function DataTable<T extends object>({
	data,
	onEdit,
	onDelete,
	showAddButton,
	project,
	filterPlaceholder = "Filter...",
	dataType,
	assay,
}: DataTableProps<T>) {
	const [sorting, setSorting] = React.useState<SortingState>([
		{
			id: "name",
			desc: false,
		},
	]);
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [initialColumnOrder] = React.useState<string[]>(
		dataType === "assay"
			? []
			: [
					"name",
					"projectTitle",
					"description",
					"taxId",
					"isolationSource",
					"collectionDate",
					"geographicLocation",
					"hostHealthState",
					"hostTaxId",
					"isolate",
					"collectedBy",
					"latitude",
					"longitude",
					"environmentalSample",
					"hostAssociated",
					"hostCommonName",
					"hostSubjectId",
					"collectorName",
					"collectingInstitution",
					"hostSex",
					"influenzaTestMethod",
					"influenzaTestResult",
					"otherPathogensTested",
					"otherPathogensTestResult",
					"hostHabitat",
					"isolationSourceHostAssociated",
					"hostBehaviour",
					"isolationSourceNonHostAssociated",
					"influenzaVirusType",
					"influenzaSubType",
					"serovar",
					"strain",
					"hostAge",
					"county",
					"commune",
					"hospitalHealthInstitution",
					"mlst",
					"alias",
					"taxonName",
					"hostTaxonName",
					"sequencingLab",
					"institution",
					"createdOn",
					"modifiedOn",
					"lastUpdatedOn",
				]
	);
	const queryClient = useQueryClient();

	const { data: customMetadataFields = [] } = useQuery({
		queryKey: ["sample-metadata-fields", project?.id],
		enabled: Boolean(project?.id && dataType === "sample"),
		queryFn: () => getSampleMetadataFields(project!.id!),
	});

	const enrichedData = useEnrichedSamples(
		data as Sample[],
		dataType !== "assay"
	);

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
				const sample = row.original as { name: string; files?: SampleFile[] };

				if (!sample.files || sample.files.length === 0) {
					return null;
				}

				return (
					<div className="flex flex-col gap-1">
						{sample.files.map((file, index) => (
							<button
								key={index}
								onClick={async () => {
									if (!project?.id) return;
									try {
										const { url } = await requestPresignedDownload({
											projectId: Number(project.id),
											assayId: assay?.id ?? "",
											sampleName: sample.name,
											fileName: file.name,
										});

										window.open(url, "_blank");
									} catch (err: unknown) {
										const message =
											err instanceof Error ? err.message : "Download failed";
										toast.error(message);
									}
								}}
								className="text-left text-blue-600 hover:underline"
							>
								{file.name}
							</button>
						))}
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
									{onEdit && (
										<TableCellViewer
											item={row.original as Sample}
											projectId={project?.id ?? ""}
											onUpdated={() => {
												if (onEdit) onEdit(row.original);
											}}
										/>
									)}

									{dataType === "assay" ? (
										<UploadDataDialog
											projectId={project?.id ?? ""}
											assayId={assay?.id ?? ""}
											sampleName={(row.original as Sample).name}
										/>
									) : null}
									{onDelete && (
										<DeleteAlertButton
											projectId={project?.id ?? ""}
											item={row.original as { id: string }[]}
											entityName="sample"
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
			geoLocation: true,
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
	const prepareTableDataForDownload = (table: TanStackTable<T>) => {
		const headers = table
			.getHeaderGroups()[0]
			.headers.filter(
				(h: Header<T, unknown>, idx: number) =>
					!h.isPlaceholder &&
					idx > 0 &&
					idx < table.getHeaderGroups()[0].headers.length - 1
			)
			.map((h: Header<T, unknown>) => {
				const resolvedColumnDef = h.column.columnDef;
				if ("accessorKey" in resolvedColumnDef)
					return resolvedColumnDef.accessorKey as string;
				if ("accessorFn" in resolvedColumnDef)
					return resolvedColumnDef.id as string;
				return "";
			});

		const rows = table.getRowModel().rows.map((row: Row<T>) =>
			row
				.getVisibleCells()
				.slice(1, -1)
				.map((cell: Cell<T, unknown>) => {
					const value = cell.getValue();
					return value !== undefined && value !== null ? String(value) : "";
				})
		);

		return { headers, rows };
	};

	const { headers, rows } = prepareTableDataForDownload(table);

	const handleBatchUpdate = async (colName: string, value: string) => {
		try {
			if (!project?.id) {
				toast.error("Project is required");
				return;
			}

			const customField = customMetadataFields.find(
				(field) => !field.archived && field.key === colName
			);

			const sampleData = (selectedRows as unknown as Sample[]).map((row) => {
				const sampleData: Record<string, unknown> = {};

				/*
				 * Copy all editable standard columns dynamically
				 */
				Object.keys(row).forEach((field) => {
					if (field === "id" || field === "alias") {
						return;
					}

					sampleData[field] = row[field as keyof Sample];
				});

				/*
				 * Update custom metadata
				 */
				if (customField) {
					const customMetadata = {
						...(row.customMetadata ?? {}),
					};

					if (value === "") {
						customMetadata[colName] = null;
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

					sampleData.customMetadata = customMetadata;
				} else {
					/*
					 * Update standard column
					 */
					const originalValue = row[colName as keyof Sample];

					if (value === "") {
						sampleData[colName] = null;
					} else if (typeof originalValue === "number") {
						const numberValue = Number(value);

						sampleData[colName] = Number.isNaN(numberValue)
							? null
							: numberValue;
					} else if (typeof originalValue === "boolean") {
						sampleData[colName] = value === "true";
					} else {
						sampleData[colName] = value;
					}
				}

				return sampleData;
			});

			await batchEditSamples(project.id, {
				sampleData,
			});

			toast.success("Samples have been updated");

			await queryClient.invalidateQueries({
				queryKey: ["samples"],
			});
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Error updating samples";

			toast.error("Error updating samples", {
				description: (
					<div className="flex flex-col gap-1 text-black">
						{message.split("\n").map((line, index) => (
							<div key={index}>{line}</div>
						))}
					</div>
				),
			});
		}
	};

	const treeData = project
		? dataType === "assay" && assay
			? buildProjectTreeSampleAssay(
					project,
					selectedRows as unknown as Sample[],
					assay
				)
			: buildProjectTree(project, selectedRows as unknown as Sample[])
		: { name: "", children: [] };

	const editableColumns = enhancedColumns.filter(
		(col) => !NON_EDITABLE_COLUMNS.includes(String(col.id))
	);

	const quickEditColumns = editableColumns.slice(1, QUICK_EDIT_LIMIT);
	const moreEditColumns = editableColumns.slice(QUICK_EDIT_LIMIT);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-center space-x-2 lg:flex">
				<ProjectTree data={treeData} width={1200} />
			</div>

			<div className="items-center justify-between space-x-2 lg:flex">
				<Input
					placeholder={filterPlaceholder}
					value={globalFilter ?? ""}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-xs"
				/>

				{selectedRows.length > 0 && (
					<div className="inline-flex h-9 items-center rounded-md border">
						<div className="text-selected flex flex-1 flex-wrap items-center p-4 text-sm md:flex-row">
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

						<Separator orientation="vertical" />
						{quickEditColumns.map((col) => (
							<React.Fragment key={String(col.id)}>
								<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="rounded-none">
											{col.meta?.label}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<form>
											<Input
												name="field"
												placeholder={String(col.meta?.label)}
												className="w-auto"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const form = e.currentTarget.form;
														if (form) {
															const value = new FormData(form).get(
																"field"
															) as string;
															handleBatchUpdate(String(col.id), value);
														}
													}
												}}
											/>
										</form>
									</DropdownMenuContent>
								</DropdownMenu>
								<Separator orientation="vertical" />
							</React.Fragment>
						))}

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="rounded-none"
									onClick={() =>
										downloadTSV(
											table
												.getSelectedRowModel()
												.rows.map((r: Row<T>) =>
													Object.fromEntries(
														r
															.getVisibleCells()
															.map((cell: Cell<T, unknown>, i: number) => [
																headers[i],
																cell.getValue(),
															])
													)
												),
											"selected-rows"
										)
									}
								>
									<Download className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Download selected</p>
							</TooltipContent>
						</Tooltip>

						<Separator orientation="vertical" />

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

								{moreEditColumns.map((col) => (
									<DropdownMenuItem key={String(col.meta?.label)} asChild>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="ghost" className="flex justify-start">
													{String(col.meta?.label)}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="p-1">
												<Input
													placeholder={String(col.meta?.label)}
													className="w-auto"
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															handleBatchUpdate(
																String(col.id),
																e.currentTarget.value
															);
														}
													}}
												/>
											</PopoverContent>
										</Popover>
									</DropdownMenuItem>
								))}

								{/* Separator */}
								<DropdownMenuSeparator />

								{/* Delete */}
								<DeleteAlertButton
									projectId={project?.id ?? ""}
									item={selectedRows as { id: string }[]}
									entityName="sample"
									onDeleted={() => table.resetRowSelection()}
								/>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}

				<DataTableViewOptions
					table={table}
					projectId={project?.id ?? ""}
					dataType={dataType!}
				/>
				{showAddButton}
				<Button
					disabled={rows.length === 0}
					onClick={() =>
						downloadTSV(
							table
								.getFilteredRowModel()
								.rows.map((r: Row<T>) =>
									Object.fromEntries(
										r
											.getVisibleCells()
											.map((cell: Cell<T, unknown>, i: number) => [
												headers[i],
												cell.getValue(),
											])
									)
								),
							"filtered-rows"
						)
					}
				>
					<Download className="h-4 w-4" />
				</Button>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader className="bg-muted sticky top-0">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : (
											<div className="flex items-center gap-1">
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
														<p>{getColumnTooltip(header.id)}</p>
													</TooltipContent>
												</Tooltip>
											</div>
										)}
									</TableHead>
								))}
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
		</div>
	);
}

function TableCellViewer({
	item,
	projectId,
	onUpdated,
}: {
	item: Sample;
	projectId: string;
	onUpdated?: () => void;
}) {
	const [loading, setLoading] = useState(false);

	const [openDrawer, setOpenDrawer] = useState(false);

	const queryClient = useQueryClient();

	const { data: customMetadataFields = [] } = useQuery({
		queryKey: ["sample-metadata-fields", projectId],
		enabled: Boolean(projectId),
		queryFn: () => getSampleMetadataFields(projectId),
	});

	const standardFields = Object.keys(item).filter(
		(field) =>
			!NON_EDITABLE_COLUMNS.includes(field) &&
			field !== "id" &&
			field !== "customMetadata"
	);

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

				if (value === null) {
					continue;
				}

				const originalValue = item[field as keyof Sample];

				// Empty values become null
				if (value === "") {
					updateData[field] = null;
					continue;
				}

				/*
				 * Preserve the type of the original Sample value.
				 * This means we don't need to manually list every field.
				 */
				if (typeof originalValue === "number") {
					const numberValue = Number(value);

					updateData[field] = Number.isNaN(numberValue) ? null : numberValue;
				} else if (typeof originalValue === "boolean") {
					updateData[field] = value === "true";
				} else {
					updateData[field] = String(value);
				}
			}

			/*
			 * Custom columns
			 */
			const customMetadata: Record<string, string | number | boolean | null> =
				{};

			for (const field of activeCustomFields) {
				const value = formData.get(`customMetadata.${field.key}`);

				if (value === null || value === "") {
					customMetadata[field.key] = null;
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

			/*
			 * Add custom metadata only when there are custom fields.
			 */
			if (activeCustomFields.length > 0) {
				updateData.customMetadata = customMetadata;
			}

			await updateSample(
				projectId,
				item.id,
				updateData as Partial<CreateSample>
			);

			toast.success("Sample has been updated", {
				description: `${new Date().toLocaleString()}.`,
			});

			await queryClient.invalidateQueries({
				queryKey: ["samples"],
			});

			await queryClient.invalidateQueries({
				queryKey: ["sample-metadata-fields", projectId],
			});

			onUpdated?.();
			setOpenDrawer(false);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Error updating sample";

			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Drawer
			direction="right"
			open={openDrawer}
			onOpenChange={setOpenDrawer}
			autoFocus={openDrawer}
		>
			<DrawerTrigger asChild>
				<Button
					variant="ghost"
					className="text-foreground w-full justify-start gap-2 text-left"
					size={"sm"}
				>
					<SquarePen size={6} />
					Edit
				</Button>
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

							const isDateField = field.toLowerCase().includes("date");

							const formattedValue = isDateField
								? formatDateToYMD(rawValue as string)
								: String(rawValue ?? "");

							return (
								<div key={field} className="flex flex-col gap-3">
									<Label htmlFor={field}>{getColumnNewName(field)}</Label>

									<Input
										id={field}
										name={field}
										type={isDateField ? "date" : "text"}
										onPointerDown={(e) => e.stopPropagation()}
										defaultValue={formattedValue}
										className="grid grid-cols-1 place-content-around"
									/>
								</div>
							);
						})}

						{activeCustomFields.map((field) => {
							const value = item.customMetadata?.[field.key] ?? "";

							return (
								<div key={`custom-${field.id}`} className="flex flex-col gap-3">
									<Label htmlFor={`custom-${field.key}`}>{field.label}</Label>

									<Input
										id={`custom-${field.key}`}
										name={`customMetadata.${field.key}`}
										type={
											field.type === "DATE"
												? "date"
												: field.type === "NUMBER"
													? "number"
													: "text"
										}
										defaultValue={String(value ?? "")}
										onPointerDown={(e) => e.stopPropagation()}
										className="grid grid-cols-1 place-content-around"
									/>
								</div>
							);
						})}
					</form>
				</div>

				<DrawerFooter>
					<Button form="sampleForm" type="submit">
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
