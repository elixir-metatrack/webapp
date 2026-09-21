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
import { useQueryClient } from "@tanstack/react-query";
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
	hostTaxId: "Host Taxonomic Identifier",
	hostTaxonName: "Host Scientific Name",
	mlst: "MLST",
	isolationSource: "Isolation Source",
	collectionDate: "Collection Date",
	location: "Geographical Location",
	sequencingLab: "Sequencing Lab",
	institution: "Institution (Data owner)",
	hostHealthState: "Host Health State",
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
					"alias",
					"taxId",
					"taxonName",
					"hostTaxId",
					"hostTaxonName",
					"mlst",
					"isolationSource",
					"collectionDate",
					"location",
					"sequencingLab",
					"institution",
					"hostHealthState",
					"createdOn",
					"modifiedOn",
					"lastUpdatedOn",
				]
	);
	const queryClient = useQueryClient();

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

	const orderedColumns: ColumnDef<T>[] =
		autoColumns.length === 0
			? []
			: initialColumnOrder.length === 0
				? autoColumns
				: (initialColumnOrder
						.map((id) => autoColumns.find((col) => col.id === id))
						.filter(Boolean) as ColumnDef<T>[]);

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
									{onDelete && !project?.parentProjectId && (
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
		});

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: enrichedData as T[],
		columns: enhancedColumnsWithDates,
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
			const sampleData = (selectedRows as unknown as Sample[]).map(
				(row: Sample) => {
					return {
						name: row.name,
						alias: row.alias,
						taxId: row.taxId,
						hostTaxId: row.hostTaxId,
						mlst: row.mlst,
						isolationSource: row.isolationSource,
						collectionDate: row.collectionDate,
						location: row.location,
						sequencingLab: row.sequencingLab,
						institution: row.institution,
						hostHealthState: row.hostHealthState,

						[colName]: value,
					};
				}
			);

			await batchEditSamples(project?.id ?? "", { sampleData });

			toast.success("Samples have been updated");

			queryClient.invalidateQueries({
				queryKey: ["samples"],
			});
		} catch (err: unknown) {
			toast.error((err as Error)?.message ?? "Error updating samples");
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

	const editableColumns = autoColumns.filter(
		(col) => !NON_EDITABLE_COLUMNS.includes(String(col.header))
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

								{!project?.parentProjectId && (
									<>
										<DropdownMenuSeparator />

										<DeleteAlertButton
											projectId={project?.id ?? ""}
											item={selectedRows as { id: string }[]}
											entityName="sample"
											onDeleted={() => table.resetRowSelection()}
										/>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}

				<DataTableViewOptions table={table} />
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

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!projectId) return;
		setLoading(true);

		try {
			const formData = new FormData(e.currentTarget);

			const rawData: Partial<CreateSample> = {
				name: formData.get("name") as string,
				alias: formData.get("alias") as string,
				taxId: formData.get("taxId") ? Number(formData.get("taxId")) : null,
				hostTaxId: formData.get("hostTaxId")
					? Number(formData.get("hostTaxId"))
					: null,
				mlst: formData.get("mlst") as string,
				isolationSource: formData.get("isolationSource") as string,
				collectionDate: formData.get("collectionDate") as string,
				location: formData.get("location") as string,
				sequencingLab: formData.get("sequencingLab") as string,
				institution: formData.get("institution") as string,
				hostHealthState: formData.get("hostHealthState") as string,
			};

			const updateData = emptyToNull(rawData);

			await updateSample(projectId, item.id, updateData);

			toast.success("Sample has been updated", {
				description: `${new Date().toLocaleString()}.`,
			});

			queryClient.invalidateQueries({
				queryKey: ["samples"],
			});

			if (onUpdated) onUpdated();
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
						{Object.keys(item)
							.filter(
								(field) =>
									!NON_EDITABLE_COLUMNS.includes(field) && field !== "id"
							)
							.map((field) => {
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
