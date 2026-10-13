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

it("exports all filtered pages, then only the selected sample", async () => {
	const data = Array.from({ length: 25 }, (_, index) => ({
		id: `id-${index}`,
		name: `sample-${String(index).padStart(2, "0")}`,
	}));
	data.push({ id: "other", name: "unrelated" });
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
	fireEvent.change(screen.getByPlaceholderText("Filter..."), {
		target: { value: "sample-" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
	await waitFor(() =>
		expect(exportExcelData).toHaveBeenCalledWith(
			"42",
			data.slice(0, 25).map((row) => row.name),
			undefined
		)
	);
	await screen.findByRole("button", { name: "Export Excel" });
	fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0]);
	fireEvent.click(
		screen.getByRole("button", { name: "Export Excel (1 selected)" })
	);
	await waitFor(() =>
		expect(exportExcelData).toHaveBeenLastCalledWith(
			"42",
			["sample-00"],
			undefined
		)
	);
});
