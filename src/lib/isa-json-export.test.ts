import { afterEach, expect, it, vi } from "vitest";
import { downloadProjectIsaJson } from "./api-keycloak";

vi.mock("./keycloak", () => ({ keycloak: { token: "test-token" } }));
vi.mock("./config", () => ({ API_URL: "/api", API_BASE_URL: "" }));

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

it("downloads original JSON bytes without rounding large numbers", async () => {
	vi.useFakeTimers();
	const blob = new Blob(['{"value":9007199254740993.123456789}'], {
		type: "application/json",
	});
	const createObjectURL = vi.fn(() => "blob:isa-export");
	const revokeObjectURL = vi.fn();
	vi.stubGlobal(
		"URL",
		Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL })
	);
	const fetch = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
	vi.stubGlobal("fetch", fetch);
	const click = vi
		.spyOn(HTMLAnchorElement.prototype, "click")
		.mockImplementation(() => {});
	await downloadProjectIsaJson("42");
	expect(fetch).toHaveBeenCalledWith("/api/projects/42/exports/isa-json", {
		headers: { Authorization: "Bearer test-token" },
	});
	expect(createObjectURL).toHaveBeenCalledWith(blob);
	expect(click).toHaveBeenCalledOnce();
	expect(document.querySelector("a[download]")).toBeNull();
	vi.runAllTimers();
	expect(revokeObjectURL).toHaveBeenCalledWith("blob:isa-export");
});

it("posts the selected sample names and names the file as a selection", async () => {
	vi.stubGlobal(
		"URL",
		Object.assign(class extends URL {}, {
			createObjectURL: vi.fn(() => "blob:isa-selection"),
			revokeObjectURL: vi.fn(),
		})
	);
	const fetch = vi
		.fn()
		.mockResolvedValue({ ok: true, blob: async () => new Blob(["{}"]) });
	vi.stubGlobal("fetch", fetch);
	let filename = "";
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
		this: HTMLAnchorElement
	) {
		filename = this.download;
	});
	await downloadProjectIsaJson("42", ["S-1", "S-2"]);
	expect(fetch).toHaveBeenCalledWith("/api/projects/42/exports/isa-json", {
		method: "POST",
		headers: {
			Authorization: "Bearer test-token",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sampleNames: ["S-1", "S-2"] }),
	});
	expect(filename).toBe("project-42-selection-isa.json");
});

it("does not download an unauthorized response", async () => {
	const blob = vi.fn();
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({ ok: false, status: 403, blob })
	);
	await expect(downloadProjectIsaJson("42")).rejects.toThrow("HTTP 403");
	expect(blob).not.toHaveBeenCalled();
});

it("explains why the server refused the export", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: false,
			status: 422,
			json: async () => ({
				message: "The project cannot be exported as ISA-JSON without guessing",
				problems: [
					"Experiment 'Lanes': files a, b of one sample are not a single run",
				],
			}),
		})
	);
	await expect(downloadProjectIsaJson("42")).rejects.toThrow(
		"without guessing: Experiment 'Lanes'"
	);
});
