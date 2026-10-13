import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { ExportExcelButton } from "./export-excel-button";
import { exportExcelData } from "@/lib/api-keycloak";
import { toastError } from "@/lib/toast";

vi.mock("@/lib/api-keycloak", () => ({ exportExcelData: vi.fn() }));
vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it("exports the selected sample names in the current assay and prevents duplicate downloads", async () => {
	let finish!: () => void;
	vi.mocked(exportExcelData).mockImplementation(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			})
	);
	render(
		<ExportExcelButton
			projectId="42"
			assayId="assay-1"
			sampleNames={["00012"]}
			selected
		/>
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Export Excel (1 selected)" })
	);
	expect(exportExcelData).toHaveBeenCalledWith("42", ["00012"], "assay-1");
	expect(
		screen.getByRole("button", { name: "Exporting…" }).hasAttribute("disabled")
	).toBe(true);
	finish();
	await waitFor(() =>
		expect(
			screen
				.getByRole("button", {
					name: "Export Excel (1 selected)",
				})
				.hasAttribute("disabled")
		).toBe(false)
	);
});

it("shows export errors and allows retrying", async () => {
	vi.mocked(exportExcelData).mockRejectedValue(
		new Error("Select fewer samples")
	);
	render(
		<ExportExcelButton
			projectId="42"
			sampleNames={["sample"]}
			selected={false}
		/>
	);
	fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
	await waitFor(() =>
		expect(toastError).toHaveBeenCalledWith("Select fewer samples")
	);
	expect(
		screen
			.getByRole("button", { name: "Export Excel" })
			.hasAttribute("disabled")
	).toBe(false);
});

it("does not offer a download for an empty filtered selection", () => {
	render(
		<ExportExcelButton projectId="42" sampleNames={[]} selected={false} />
	);
	expect(
		screen
			.getByRole("button", { name: "Export Excel" })
			.hasAttribute("disabled")
	).toBe(true);
});
