import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadSampleDialog } from "./upload-sample";
import { DownloadTemplateButton } from "./download-template-button";
import {
	downloadExcelTemplate,
	downloadTemplate,
	uploadExperimentsheet,
	uploadSamplesheet,
} from "@/lib/api-keycloak";
import { TableImportError } from "@/lib/table-import";

vi.mock("@/lib/api-keycloak", () => ({
	downloadExcelTemplate: vi.fn(),
	downloadTemplate: vi.fn(),
	uploadExperimentsheet: vi.fn(),
	uploadSamplesheet: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

function uploadDialog(assayId?: string) {
	const client = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	const invalidate = vi.spyOn(client, "invalidateQueries");
	render(
		<QueryClientProvider client={client}>
			<UploadSampleDialog projectId="42" assayId={assayId} />
		</QueryClientProvider>
	);
	fireEvent.click(
		screen.getByRole("button", {
			name: assayId ? "Upload Experiment" : "Upload Sample",
		})
	);
	return invalidate;
}

function choose(file: File) {
	const input = screen.getByLabelText(/table file/i);
	fireEvent.change(input, { target: { files: [file] } });
	fireEvent.click(screen.getByRole("button", { name: "Upload" }));
}

describe("table uploads", () => {
	it.each(["csv", "tsv", "xls", "xlsx"])(
		"sends %s through the same sample upload",
		async (extension) => {
			uploadDialog();
			const file = new File(["contents"], `samples.${extension}`);
			choose(file);
			await waitFor(() =>
				expect(uploadSamplesheet).toHaveBeenCalledWith("42", file)
			);
			expect(uploadExperimentsheet).not.toHaveBeenCalled();
		}
	);

	it("sends experiment workbooks to the selected assay", async () => {
		uploadDialog("assay-1");
		const file = new File(["contents"], "experiments.xlsx");
		choose(file);
		await waitFor(() =>
			expect(uploadExperimentsheet).toHaveBeenCalledWith("42", "assay-1", file)
		);
		expect(uploadSamplesheet).not.toHaveBeenCalled();
	});

	it("shows row errors and refreshes data after a partial import", async () => {
		vi.mocked(uploadSamplesheet).mockRejectedValue(
			new TableImportError([
				{
					sample: "bad (Samples!row 7)",
					fieldKey: "group",
					message: "Value is not in the configured vocabulary",
				},
			])
		);
		const invalidate = uploadDialog();
		choose(new File(["contents"], "samples.xlsx"));
		const alert = await screen.findByRole("alert");
		expect(alert.textContent).toContain("Samples!row 7");
		expect(alert.textContent).toContain("group");
		expect(alert.textContent).toContain(
			"Valid rows may already have been imported"
		);
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ["samples", "42"] });
		expect(screen.getByRole("dialog")).toBeTruthy();
	});

	it("shows vocabulary permission errors without implying a partial import", async () => {
		vi.mocked(uploadSamplesheet).mockRejectedValue(
			new Error("Only project administrators can import new vocabularies")
		);
		uploadDialog();
		choose(new File(["contents"], "samples.xlsx"));
		const alert = await screen.findByRole("alert");
		expect(alert.textContent).toContain("Only project administrators");
		expect(alert.textContent).not.toContain("Valid rows may already");
	});

	it("rejects unsupported files dropped onto the upload area", () => {
		uploadDialog();
		const zone = screen.getByText("Drag & drop your file here").parentElement!;
		fireEvent.drop(zone, {
			dataTransfer: {
				files: { item: () => new File(["contents"], "workbook.xlsm") },
			},
		});
		expect(screen.getByRole("alert").textContent).toContain("Choose a CSV");
		expect(
			screen.getByRole("button", { name: "Upload" }).hasAttribute("disabled")
		).toBe(true);
		expect(uploadSamplesheet).not.toHaveBeenCalled();
	});
});

it("keeps the existing template download separate from the Excel download", async () => {
	render(
		<>
			<DownloadTemplateButton type="experiment" />
			<DownloadTemplateButton type="experiment" format="xlsx" />
		</>
	);
	fireEvent.pointerDown(
		screen.getByRole("button", { name: "Experiment Template" }),
		{ button: 0, ctrlKey: false }
	);
	fireEvent.click(
		screen.getByRole("menuitem", { name: /Paired-end experiment/ })
	);
	await waitFor(() =>
		expect(downloadTemplate).toHaveBeenCalledWith("experiment_PE")
	);
	expect(downloadExcelTemplate).not.toHaveBeenCalled();
	fireEvent.pointerDown(
		screen.getByRole("button", { name: "Download Excel template" }),
		{ button: 0, ctrlKey: false }
	);
	fireEvent.click(
		screen.getByRole("menuitem", { name: /Single-end experiment/ })
	);
	await waitFor(() =>
		expect(downloadExcelTemplate).toHaveBeenCalledWith("experiment_SE")
	);
});
