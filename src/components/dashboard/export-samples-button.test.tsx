import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportSamplesButton } from "./export-samples-button";
import { downloadProjectIsaJson } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "@/lib/toast";

vi.mock("@/lib/api-keycloak", () => ({
	downloadProjectIsaJson: vi.fn(),
	exportExcelData: vi.fn(),
}));
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

function openMenu(selected = true) {
	render(
		<ExportSamplesButton
			projectId="42"
			sampleNames={["S-1", "S-2"]}
			selected={selected}
			onDownloadTSV={vi.fn()}
		/>
	);
	fireEvent.keyDown(
		screen.getByRole("button", { name: /Download (selected|all) samples/ }),
		{ key: "Enter" }
	);
	return screen.getByRole("menuitem", { name: /ISA-JSON/ });
}

describe("ISA-JSON in the download menu", () => {
	it("exports only the selected samples", async () => {
		vi.mocked(downloadProjectIsaJson).mockResolvedValue();
		const item = openMenu();
		expect(item.textContent).toContain("2 selected");
		fireEvent.click(item);
		expect(downloadProjectIsaJson).toHaveBeenCalledWith("42", ["S-1", "S-2"]);
		await waitFor(() =>
			expect(toastSuccess).toHaveBeenCalledWith("ISA-JSON export downloaded")
		);
	});

	it("exports the whole project without a selection", () => {
		vi.mocked(downloadProjectIsaJson).mockResolvedValue();
		const item = openMenu(false);
		expect(item.textContent).toContain("Whole project");
		fireEvent.click(item);
		expect(downloadProjectIsaJson).toHaveBeenCalledWith("42", undefined);
	});

	it("reports why the export failed", async () => {
		vi.mocked(downloadProjectIsaJson).mockRejectedValue(
			new Error("Access denied")
		);
		fireEvent.click(openMenu());
		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith("Access denied")
		);
	});
});
