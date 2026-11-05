import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { ImportIsaJsonDialog } from "./import-isa-json-dialog";
import { importProjectIsaJson } from "@/lib/api-keycloak";
import type { IsaImportReport } from "@/lib/api-keycloak";
import { toastSuccess } from "@/lib/toast";

vi.mock("@/lib/api-keycloak", () => ({ importProjectIsaJson: vi.fn() }));
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const report = (overrides: Partial<IsaImportReport>): IsaImportReport => ({
	committed: false,
	study: "Demo",
	studies: [{ identifier: "s1", title: "Demo" }],
	samples: ["S-1", "S-2"],
	newFields: [{ key: "soil", label: "Soil type", type: "TEXT" }],
	assays: [{ name: "WGS", samples: 2, files: 4 }],
	ignored: ["people"],
	errors: [],
	...overrides,
});

async function chooseFile() {
	render(
		<QueryClientProvider client={new QueryClient()}>
			<ImportIsaJsonDialog projectId="42" />
		</QueryClientProvider>
	);
	fireEvent.click(screen.getByRole("button", { name: "Import ISA-JSON" }));
	const file = new File(['{"studies":[]}'], "study.json", {
		type: "application/json",
	});
	fireEvent.change(screen.getByLabelText("ISA-JSON file"), {
		target: { files: [file] },
	});
	await screen.findByText(/New custom fields/);
}

it("previews first and only writes after confirmation", async () => {
	vi.mocked(importProjectIsaJson)
		.mockResolvedValueOnce(report({}))
		.mockResolvedValueOnce(report({ committed: true }));
	await chooseFile();
	expect(importProjectIsaJson).toHaveBeenLastCalledWith(
		"42",
		'{"studies":[]}',
		{ study: undefined, commit: false }
	);
	expect(screen.getByText("WGS: 2 samples, 4 files")).toBeTruthy();
	fireEvent.click(screen.getByRole("button", { name: "Import" }));
	await waitFor(() =>
		expect(toastSuccess).toHaveBeenCalledWith(
			"Imported 2 samples and 1 experiments"
		)
	);
	expect(importProjectIsaJson).toHaveBeenLastCalledWith(
		"42",
		'{"studies":[]}',
		{ study: undefined, commit: true }
	);
});

it("blocks the import while the preview reports problems", async () => {
	vi.mocked(importProjectIsaJson).mockResolvedValueOnce(
		report({
			errors: [
				{
					item: "S-1",
					field: "name",
					value: "S-1",
					message: "Sample name 'S-1' already exists in this project",
				},
			],
		})
	);
	await chooseFile();
	expect(screen.getByRole("alert").textContent).toContain("already exists");
	expect(
		screen.getByRole<HTMLButtonElement>("button", { name: "Import" }).disabled
	).toBe(true);
});
