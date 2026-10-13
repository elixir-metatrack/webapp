"use client";

import * as React from "react";
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
import { FolderOpen, MoreHorizontal, SquarePen } from "lucide-react";
import { AddProjectDialog } from "./add-project";
import { DataTableColumnHeader } from "../data-table-column-header";
import { DataTablePagination } from "../data-table-pagination";
import { DataTableViewOptions } from "../data-table-column-toggle";
import type { Project } from "@/lib/types";
import { DeleteAlertButton } from "../delete-alert-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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

	const columns: ColumnDef<Project>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Title" />
			),
			cell: ({ row }) => (
				<span className="cursor-pointer font-medium">
					{row.getValue("name")}
				</span>
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
									projectId={project?.id}
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

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: projects,
		columns,
		initialState: {
			pagination: {
				pageSize: 15,
			},
		},
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-x-4">
				<Input
					placeholder="Filter projects..."
					value={globalFilter ?? ""}
					onChange={(e) => setGlobalFilter(e.target.value)}
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
									<TableHead
										key={header.id}
										className={header.id === "name" ? "pl-7" : ""}
									>
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
										<TableCell
											key={cell.id}
											className={cell.column.id === "name" ? "pl-6" : ""}
										>
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

			<DataTablePagination table={table} />
		</div>
	);
}
