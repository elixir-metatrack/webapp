import { afterEach, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DataTable } from "./dataTable";
import { exportExcelData } from "@/lib/api-keycloak";
import type * as ApiClient from "@/lib/api-keycloak";
import type { Project } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import downloadTSV from "@/lib/data/dataExport";

vi.mock("@/lib/data/dataExport", () => ({ default: vi.fn() }));

vi.mock("@/lib/api-keycloak", async (importOriginal) => ({
	...(await importOriginal<typeof ApiClient>()),
	exportExcelData: vi.fn(),
	getSampleMetadataFields: vi.fn().mockResolvedValue([]),
	getAssaysInSample: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/hooks/use-enrichedSamples", () => ({
	useEnrichedSamples: (data: unknown[]) => data,
}));
vi.mock("#/hooks/use-enrichedSamples", () => ({
	useEnrichedSamples: (data: unknown[]) => data,
}));
vi.mock("#/hooks/use-vocabularies", () => ({
	useVocabularies: () => ({ getTerms: () => [] }),
}));
vi.mock("../projectTree", () => ({ ProjectTree: () => null }));
vi.mock("../data-table-column-toggle", () => ({
	DataTableViewOptions: () => null,
}));
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

it.each(["XLS", "TSV"])(
	"%s exports all filtered pages, then only the selected sample",
	async (format) => {
		const data = Array.from({ length: 25 }, (_, index) => ({
			id: `id-${index}`,
			name: `sample-${String(index).padStart(2, "0")}`,
			location: `location-${index}`,
		}));
		data.push({ id: "other", name: "unrelated", location: "other-location" });
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		render(
			<QueryClientProvider client={client}>
				<TooltipProvider>
					<DataTable
						data={data}
						dataType="sample"
						project={{ id: "42" } as Project}
					/>
				</TooltipProvider>
			</QueryClientProvider>
		);
		const expectExport = async (expected: typeof data, filename: string) => {
			const label =
				filename === "selected-rows"
					? `${format} (${expected.length})`
					: format;
			fireEvent.click(screen.getByRole("button", { name: label }));
			await waitFor(() => {
				if (format === "XLS") {
					expect(exportExcelData).toHaveBeenLastCalledWith(
						"42",
						expected.map((row) => row.name),
						undefined
					);
				} else {
					expect(downloadTSV).toHaveBeenLastCalledWith(
						expected.map(({ name, location }) => ({ name, location })),
						filename
					);
				}
			});
			await waitFor(() =>
				expect(
					screen.getByRole("button", { name: label }).hasAttribute("disabled")
				).toBe(false)
			);
		};
		await expectExport(data, "filtered-rows");
		fireEvent.change(screen.getByPlaceholderText("Filter..."), {
			target: { value: "sample-" },
		});
		await expectExport(data.slice(0, 25), "filtered-rows");
		fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
		await expectExport([data[0]], "selected-rows");
		fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
		fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
		await expectExport([data[0], data[15]], "selected-rows");
		fireEvent.change(screen.getByPlaceholderText("Filter..."), {
			target: { value: "sample-15" },
		});
		await expectExport([data[15]], "selected-rows");
		fireEvent.change(screen.getByPlaceholderText("Filter..."), {
			target: { value: "unrelated" },
		});
		expect(
			screen
				.getByRole("button", { name: `${format} (0)` })
				.hasAttribute("disabled")
		).toBe(true);
	}
);
