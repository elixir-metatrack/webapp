import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddSubProjectDialog } from "./add-subproject";
import { AddSamplesToAssayDialog } from "./add-samples-assay";
import { AssayTable } from "./assayTable";
import { EditAssayDialog } from "./edit-assay-dialog";
import {
	addSamplesToAssay,
	createSubProject,
	getFilesSampleAssay,
	getSamples,
	getSamplesInAssay,
} from "@/lib/api-keycloak";
import type { Assay, Sample } from "@/lib/types";

vi.mock("@/lib/api-keycloak", () => ({
	getSamples: vi.fn(),
	createSubProject: vi.fn(),
	addSamplesToAssay: vi.fn(),
	getSamplesInAssay: vi.fn(),
	getFilesSampleAssay: vi.fn(),
	updateAssay: vi.fn(),
	deleteAssay: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./download-template-button", () => ({
	DownloadTemplateButton: () => null,
}));
vi.mock("./dataTable", () => ({
	DataTable: ({ data }: { data: { name: string }[] }) => (
		<ul>
			{data.map((row) => (
				<li key={row.name}>{row.name}</li>
			))}
		</ul>
	),
}));

const samples = [
	{ id: "alpha-id", name: "Alpha" },
	{ id: "beta-id", name: "Beta" },
] as Sample[];
const assay = { id: "shared-assay", name: "Shared" } as Assay;

function withClient(
	element: ReactElement,
	client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	})
) {
	return <QueryClientProvider client={client}>{element}</QueryClientProvider>;
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.mocked(getSamples).mockResolvedValue(samples);
	vi.mocked(createSubProject).mockResolvedValue({
		id: "2",
		name: "Sub-project",
	});
	vi.mocked(getFilesSampleAssay).mockResolvedValue([]);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("sub-project sample selection", () => {
	it("adds filtered samples when a different hidden sample is already selected", async () => {
		render(withClient(<AddSubProjectDialog parentProjectId="1" />));
		fireEvent.click(screen.getByRole("button", { name: "Create Sub-Project" }));
		fireEvent.click(
			await screen.findByRole("checkbox", { name: "Select Alpha" })
		);
		fireEvent.change(screen.getByPlaceholderText("Search samples..."), {
			target: { value: "Beta" },
		});
		const selectAll = screen.getByRole("checkbox", {
			name: "Select all visible samples",
		});
		expect(selectAll.getAttribute("aria-checked")).toBe("false");
		fireEvent.click(selectAll);
		fireEvent.change(screen.getByLabelText(/Sub-Project Title/), {
			target: { value: "Selected" },
		});
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: "Create Sub-Project",
			})
		);
		await waitFor(() =>
			expect(createSubProject).toHaveBeenCalledWith("1", {
				name: "Selected",
				description: "",
				sampleIds: ["alpha-id", "beta-id"],
			})
		);
	});

	it("deselects only filtered samples and preserves hidden selections", async () => {
		render(withClient(<AddSubProjectDialog parentProjectId="1" />));
		fireEvent.click(screen.getByRole("button", { name: "Create Sub-Project" }));
		await screen.findByRole("checkbox", { name: "Select Alpha" });
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Select all visible samples" })
		);
		fireEvent.change(screen.getByPlaceholderText("Search samples..."), {
			target: { value: "Beta" },
		});
		const selectAll = screen.getByRole("checkbox", {
			name: "Select all visible samples",
		});
		expect(selectAll.getAttribute("aria-checked")).toBe("true");
		fireEvent.click(selectAll);
		fireEvent.change(screen.getByPlaceholderText("Search samples..."), {
			target: { value: "" },
		});
		expect(
			screen
				.getByRole("checkbox", { name: "Select Alpha" })
				.getAttribute("aria-checked")
		).toBe("true");
		expect(
			screen
				.getByRole("checkbox", { name: "Select Beta" })
				.getAttribute("aria-checked")
		).toBe("false");
	});

	it("disables select-all when the filter has no results", async () => {
		render(withClient(<AddSubProjectDialog parentProjectId="1" />));
		fireEvent.click(screen.getByRole("button", { name: "Create Sub-Project" }));
		await screen.findByRole("checkbox", { name: "Select Alpha" });
		fireEvent.change(screen.getByPlaceholderText("Search samples..."), {
			target: { value: "missing" },
		});
		expect(
			screen
				.getByRole("checkbox", { name: "Select all visible samples" })
				.hasAttribute("disabled")
		).toBe(true);
	});
});

it("preserves hidden selections when adding filtered samples to an assay", async () => {
	render(
		withClient(<AddSamplesToAssayDialog projectId="2" assayId="shared-assay" />)
	);
	fireEvent.click(screen.getByRole("button", { name: "Add Samples" }));
	fireEvent.click(
		await screen.findByRole("checkbox", { name: "Select Alpha" })
	);
	fireEvent.change(screen.getByPlaceholderText("Search samples..."), {
		target: { value: "Beta" },
	});
	fireEvent.click(
		screen.getByRole("checkbox", { name: "Select all visible samples" })
	);
	fireEvent.click(screen.getByRole("button", { name: "Add Selected Samples" }));
	await waitFor(() =>
		expect(addSamplesToAssay).toHaveBeenCalledWith("2", "shared-assay", [
			"Alpha",
			"Beta",
		])
	);
});

it("does not reuse cached root samples when switching to the same assay in a sub-project", async () => {
	vi.mocked(getSamplesInAssay).mockImplementation((projectId) =>
		Promise.resolve(projectId === "1" ? samples : [samples[0]])
	);
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	});
	const { rerender } = render(
		withClient(
			<AssayTable assay={assay} project={{ id: "1", name: "Root" }} />,
			client
		)
	);
	await screen.findByText("Beta");
	rerender(
		withClient(
			<AssayTable
				assay={assay}
				project={{ id: "2", name: "Sub", parentProjectId: 1 }}
			/>,
			client
		)
	);
	expect(screen.queryByText("Beta")).toBeNull();
	await screen.findByText("Alpha");
	expect(getSamplesInAssay).toHaveBeenCalledWith("2", "shared-assay");
	expect(screen.queryByText("Beta")).toBeNull();
});

it("keeps shared experiments editable while hiding their delete action", () => {
	render(
		withClient(<EditAssayDialog assay={assay} projectId="2" isSubProject />)
	);
	fireEvent.click(screen.getByRole("button", { name: "Edit Experiment" }));
	expect(
		screen.queryByRole("button", { name: "Delete Experiment" })
	).toBeNull();
	expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy();
	expect(
		screen.getByText(/can only be deleted in the parent project/)
	).toBeTruthy();
});
