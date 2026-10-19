import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExportIsaJsonButton } from "./export-isa-json-button";
import { downloadProjectIsaJson } from "@/lib/api-keycloak";
import { toastError } from "@/lib/toast";

vi.mock("@/lib/api-keycloak", () => ({ downloadProjectIsaJson: vi.fn() }));
vi.mock("@/lib/toast", () => ({ toastError: vi.fn() }));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ISA-JSON project export", () => {
	it("exports the project and prevents another request while downloading", async () => {
		let finish!: () => void;
		vi.mocked(downloadProjectIsaJson).mockReturnValue(
			new Promise<void>((resolve) => {
				finish = resolve;
			})
		);
		render(<ExportIsaJsonButton projectId="42" />);
		fireEvent.click(screen.getByRole("button", { name: "Export ISA-JSON" }));
		expect(downloadProjectIsaJson).toHaveBeenCalledWith("42");
		expect(screen.getByRole<HTMLButtonElement>("button").disabled).toBe(true);
		finish();
		await waitFor(() =>
			expect(screen.getByRole<HTMLButtonElement>("button").disabled).toBe(false)
		);
	});

	it("reports errors and allows retrying", async () => {
		vi.mocked(downloadProjectIsaJson).mockRejectedValue(
			new Error("Access denied")
		);
		render(<ExportIsaJsonButton projectId="42" />);
		fireEvent.click(screen.getByRole("button", { name: "Export ISA-JSON" }));
		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith("Access denied")
		);
		expect(screen.getByRole<HTMLButtonElement>("button").disabled).toBe(false);
	});
});
