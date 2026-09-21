"use client";

import * as React from "react";
import {
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type {
	ColumnDef,
	ExpandedState,
	SortingState,
} from "@tanstack/react-table";
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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ChevronRight,
	FolderOpen,
	GitBranch,
	MoreHorizontal,
	SquarePen,
} from "lucide-react";
import { AddProjectDialog } from "./add-project";
import { DataTableColumnHeader } from "../data-table-column-header";
import { DataTablePagination } from "../data-table-pagination";
import { DataTableViewOptions } from "../data-table-column-toggle";
import type { Project } from "@/lib/types";
import { DeleteAlertButton } from "../delete-alert-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface DataTableProps {
	projects: Project[];
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
	onOpen: (project: Project) => void;
}

const COLUMN_TOOLTIPS: Record<string, string> = {
	name: "Title of the sample.",
	description:
		"Description of the sample (example: Staphylococcus aureus isolated from blood culture.)",
	sampleCount: "Number of samples associated with the project.",
	createdOn: "Date of creation",
	modifiedOn: "Last modification date",
};

function getColumnTooltip(key: string) {
	return COLUMN_TOOLTIPS[key] ?? "";
}

export function ProjectsDataTable({
	projects,
	onEdit,
	onDelete,
	onOpen,
}: DataTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [expanded, setExpanded] = React.useState<ExpandedState>({});
	const [searchExpanded, setSearchExpanded] =
		React.useState<ExpandedState>(true);
	const isSearching = globalFilter.trim().length > 0;
	const { rootProjects, childrenByParent } = React.useMemo(() => {
		const visibleIds = new Set(
			projects
				.filter((project) => project.id != null)
				.map((project) => String(project.id))
		);
		const roots: Project[] = [];
		const children = new Map<string, Project[]>();
		for (const project of projects) {
			const parentId = project.parentProjectId;
			if (parentId != null && visibleIds.has(String(parentId))) {
				const siblings = children.get(String(parentId)) ?? [];
				siblings.push(project);
				children.set(String(parentId), siblings);
			} else {
				// Keep projects visible when the user cannot access their parent.
				roots.push(project);
			}
		}
		return { rootProjects: roots, childrenByParent: children };
	}, [projects]);

	const columns: ColumnDef<Project>[] = [
		{
			id: "select",
			header: ({ table }) => {
				const visibleRows = table.getRowModel().rows;
				const allSelected =
					visibleRows.length > 0 &&
					visibleRows.every((row) => row.getIsSelected());
				const someSelected = visibleRows.some((row) => row.getIsSelected());
				return (
					<Checkbox
						checked={allSelected || (someSelected && "indeterminate")}
						disabled={visibleRows.length === 0}
						onClick={(event) => event.stopPropagation()}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all visible projects"
						className="border-neutral-900"
					/>
				);
			},
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onClick={(event) => event.stopPropagation()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label={`Select ${row.original.name}`}
					className="border-neutral-900"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Title" />
			),
			cell: ({ row }) => (
				<div
					className="flex items-center gap-2"
					style={{ paddingLeft: `${row.depth * 1.5}rem` }}
				>
					{row.getCanExpand() ? (
						<Button
							variant="ghost"
							size="icon"
							className="size-7 shrink-0"
							aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${row.original.name}`}
							aria-expanded={row.getIsExpanded()}
							onClick={(event) => {
								event.stopPropagation();
								row.toggleExpanded();
							}}
						>
							<ChevronRight
								className={cn(
									"transition-transform",
									row.getIsExpanded() && "rotate-90"
								)}
							/>
						</Button>
					) : (
						<span className="size-7 shrink-0" aria-hidden="true" />
					)}
					{row.original.parentProjectId != null && (
						<GitBranch
							className="text-muted-foreground size-4 shrink-0"
							aria-hidden="true"
						/>
					)}
					<span className="font-medium">{row.getValue("name")}</span>
					{row.original.parentProjectId != null && (
						<Badge variant="secondary">Sub-project</Badge>
					)}
				</div>
			),
		},
		{
			accessorKey: "description",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Description" />
			),
			cell: ({ row }) => row.getValue("description") || "-",
		},
		{
			accessorKey: "sampleCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Samples in Project" />
			),
			cell: ({ row }) => row.original.sampleCount ?? 0,
		},

		{
			accessorKey: "createdOn",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Created On" />
			),
			cell: ({ row }) =>
				new Date(row.getValue("createdOn")).toISOString().split("T")[0] || "-",
		},
		{
			accessorKey: "modifiedOn",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Modified On" />
			),
			cell: ({ row }) =>
				new Date(row.getValue("modifiedOn")).toISOString().split("T")[0] || "-",
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				const project = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								onClick={(event) => event.stopPropagation()}
							>
								<MoreHorizontal size={16} />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent onClick={(event) => event.stopPropagation()}>
							<DropdownMenuItem
								onClick={() => onOpen(project)}
								className="flex items-center gap-2"
							>
								<FolderOpen />
								Open
							</DropdownMenuItem>

							<DropdownMenuItem
								onClick={() => onEdit(project)}
								className="flex items-center gap-2"
							>
								<SquarePen />
								Edit
							</DropdownMenuItem>

							<DropdownMenuItem asChild>
								<DeleteAlertButton
									projectId={project.id}
									item={{ id: project.id! }}
									entityName="project"
									onDeleted={() => onDelete(project)}
								/>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const table = useReactTable({
		data: rootProjects,
		columns,
		getRowId: (project, index) =>
			project.id != null ? String(project.id) : `project-${index}`,
		getSubRows: (project) => childrenByParent.get(String(project.id)),
		enableSubRowSelection: false,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		initialState: {
			pagination: {
				pageSize: 15,
			},
		},
		state: {
			sorting,
			globalFilter: globalFilter.trim(),
			expanded: isSearching ? searchExpanded : expanded,
		},
		onExpandedChange: isSearching ? setSearchExpanded : setExpanded,
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-x-4">
				<Input
					placeholder="Filter projects..."
					value={globalFilter}
					onChange={(e) => {
						setGlobalFilter(e.target.value);
						setSearchExpanded(true);
					}}
					className="max-w-sm"
				/>
				<DataTableViewOptions table={table} />
				<AddProjectDialog />
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
													<TooltipContent>
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
									className="cursor-pointer hover:bg-neutral-300 [&_*]:cursor-pointer"
									onClick={() => onOpen(row.original)}
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
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center hover:bg-neutral-300"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<DataTablePagination table={table} pageSizeLabel="Groups per page" />
		</div>
	);
}
