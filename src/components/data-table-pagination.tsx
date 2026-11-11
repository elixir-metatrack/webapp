import type { Table } from "@tanstack/react-table";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
	pageSizeLabel?: string;
}

export function DataTablePagination<TData>({
	table,
	pageSizeLabel = "Rows per page",
}: DataTablePaginationProps<TData>) {
	const [selectedPageSize, setSelectedPageSize] = useState(
		String(table.getState().pagination.pageSize)
	);

	const totalRows = table.getFilteredRowModel().rows.length;

	useEffect(() => {
		if (selectedPageSize === "all") {
			table.setPageSize(Math.max(1, totalRows));
		}
	}, [selectedPageSize, totalRows, table]);

	return (
		<div className="flex items-center justify-between px-2">
			<div className="text-muted-foreground flex-1 text-sm">
				{table.getFilteredSelectedRowModel().flatRows.length} of{" "}
				{table.getFilteredRowModel().flatRows.length} row(s) selected.
			</div>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">{pageSizeLabel}</p>
					<Select
						value={selectedPageSize}
						onValueChange={(value) => {
							setSelectedPageSize(value);

							table.setPageSize(
								value === "all" ? Math.max(1, totalRows) : Number(value)
							);
						}}
					>
						<SelectTrigger className="h-8 w-[100px]">
							<SelectValue />
						</SelectTrigger>

						<SelectContent side="top">
							{[15, 20, 25, 30, 40, 50].map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}

							<SelectItem value="all">All ({totalRows})</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[100px] items-center justify-center text-sm font-medium">
					Page {table.getState().pagination.pageIndex + 1} of{" "}
					{table.getPageCount()}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to first page</span>
						<ChevronsLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<span className="sr-only">Go to previous page</span>
						<ChevronLeft />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to next page</span>
						<ChevronRight />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hidden size-8 lg:flex"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<span className="sr-only">Go to last page</span>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
