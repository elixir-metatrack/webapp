import { afterEach, expect, it, vi } from "vitest";
import {
	api,
	downloadExcelTemplate,
	exportExcelData,
	uploadExperimentsheet,
	uploadSamplesheet,
} from "./api-keycloak";
import { TableImportError } from "./table-import";

vi.mock("./keycloak", () => ({ keycloak: { token: "test-token" } }));
vi.mock("./config", () => ({
	API_URL: "http://localhost/api",
	API_BASE_URL: "http://localhost/api",
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

it.each([undefined, "assay-1"])(
	"exports selected data with authentication (assay: %s)",
	async (assayId) => {
		const fetch = vi.fn().mockResolvedValue(new Response("workbook"));
		vi.stubGlobal("fetch", fetch);
		const revoke = vi.fn();
		vi.stubGlobal("URL", {
			createObjectURL: vi.fn().mockReturnValue("blob:export"),
			revokeObjectURL: revoke,
		});
		const click = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => {});
		await exportExcelData("42", ["00012", "sample-2"], assayId);
		expect(fetch).toHaveBeenCalledWith(
			assayId
				? "http://localhost/api/projects/42/assays/assay-1/experiments/export"
				: "http://localhost/api/projects/42/samples/export",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer test-token",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ sampleNames: ["00012", "sample-2"] }),
			}
		);
		expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe(
			assayId ? "experiments-assay-1.xlsx" : "samples-42.xlsx"
		);
		expect(revoke).toHaveBeenCalledWith("blob:export");
		expect(document.querySelector("a[download]")).toBeNull();
	}
);

it("does not download export errors or submit an empty selection", async () => {
	const fetch = vi
		.fn()
		.mockResolvedValue(
			Response.json({ message: "Export not allowed" }, { status: 403 })
		);
	vi.stubGlobal("fetch", fetch);
	const click = vi
		.spyOn(HTMLAnchorElement.prototype, "click")
		.mockImplementation(() => {});
	await expect(exportExcelData("42", [])).rejects.toThrow("Choose samples");
	expect(fetch).not.toHaveBeenCalled();
	await expect(exportExcelData("42", ["sample"])).rejects.toThrow(
		"Export not allowed"
	);
	expect(click).not.toHaveBeenCalled();
});

it("keeps multipart uploads on the existing sample and experiment endpoints", async () => {
	const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
	vi.stubGlobal("fetch", fetch);
	const file = new File(["workbook"], "samples.xlsx");
	await uploadSamplesheet("42", file);
	await uploadExperimentsheet("42", "assay-id", file);
	expect(fetch.mock.calls[0][0]).toBe(
		"http://localhost/api/projects/42/samples/samplesheet"
	);
	expect(fetch.mock.calls[1][0]).toBe(
		"http://localhost/api/projects/42/assays/assay-id/experiments"
	);
	for (const [, options] of fetch.mock.calls) {
		expect(options.body.get("file")).toBe(file);
		expect(options.headers.Authorization).toBe("Bearer test-token");
		expect(options.headers["Content-Type"]).toBeUndefined();
	}
});

it("retains structured row errors for table imports only", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockImplementation(() =>
			Promise.resolve(
				Response.json(
					[
						{
							row: "Experiments!row 4",
							field: "Sample",
							message: "Sample not found",
						},
					],
					{ status: 400 }
				)
			)
		)
	);
	await expect(
		uploadExperimentsheet("42", "assay-id", new File([], "table.xls"))
	).rejects.toBeInstanceOf(TableImportError);
	await expect(api("projects/42/assays")).rejects.toThrow("Sample not found");
});

it("downloads the versioned Excel template without changing CSV paths", async () => {
	const fetch = vi.fn().mockResolvedValue(new Response("workbook"));
	vi.stubGlobal("fetch", fetch);
	const create = vi.fn().mockReturnValue("blob:template");
	const revoke = vi.fn();
	vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
	const click = vi
		.spyOn(HTMLAnchorElement.prototype, "click")
		.mockImplementation(() => {});
	await downloadExcelTemplate("sample_extended");
	expect(fetch).toHaveBeenCalledWith(
		"http://localhost/api/templates/excel/sample_extended"
	);
	expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe(
		"sample_extended-v1.xlsx"
	);
	expect(revoke).toHaveBeenCalledWith("blob:template");
});
