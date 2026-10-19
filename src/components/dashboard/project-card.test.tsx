import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { ProjectsDataTable } from "./project-card";
import { TooltipProvider } from "../ui/tooltip";
import type { Project } from "@/lib/types";

vi.mock("./add-project", () => ({ AddProjectDialog: () => null }));
vi.mock("../delete-alert-button", () => ({ DeleteAlertButton: () => null }));

beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

function project(id: string, name: string, parentProjectId?: number): Project {
	return {
		id,
		name,
		parentProjectId,
		createdOn: "2026-09-07T10:00:00Z",
		modifiedOn: "2026-09-07T10:00:00Z",
	};
}

const projects = [
	project("2", "Alpha child", 1),
	project("1", "Parent"),
	project("3", "Beta child", 1),
	project("4", "Standalone sub-project", 99),
];

function renderProjects(data = projects) {
	const onOpen = vi.fn();
	render(
		<TooltipProvider>
			<ProjectsDataTable
				projects={data}
				onOpen={onOpen}
				onEdit={vi.fn()}
				onDelete={vi.fn()}
			/>
		</TooltipProvider>
	);
	return { onOpen };
}

function toggle(name: string) {
	fireEvent.click(screen.getByRole("button", { name }));
}

function select(name: string) {
	return screen.getByRole("checkbox", { name: `Select ${name}` });
}

function filter(value: string) {
	fireEvent.change(screen.getByPlaceholderText("Filter projects..."), {
		target: { value },
	});
}

describe("project table hierarchy", () => {
	it("keeps sub-projects without an accessible parent visible and opens the correct project", () => {
		const { onOpen } = renderProjects();
		expect(screen.queryByText("Alpha child")).toBeNull();
		expect(screen.getByText("Standalone sub-project")).toBeTruthy();
		toggle("Expand Parent");
		expect(onOpen).not.toHaveBeenCalled();
		const rows = within(screen.getByRole("table")).getAllByRole("row");
		expect(
			rows
				.slice(1)
				.map((row) =>
					within(row).getByRole("checkbox").getAttribute("aria-label")
				)
		).toEqual([
			"Select Parent",
			"Select Alpha child",
			"Select Beta child",
			"Select Standalone sub-project",
		]);
		fireEvent.click(screen.getByText("Alpha child"));
		expect(onOpen).toHaveBeenCalledWith(projects[0]);
	});

	it("reveals matching children with their parent and restores the previous expansion after searching", () => {
		renderProjects();
		filter("alpha");
		expect(screen.getByText("Parent")).toBeTruthy();
		expect(screen.getByText("Alpha child")).toBeTruthy();
		expect(screen.queryByText("Beta child")).toBeNull();
		expect(screen.queryByText("Standalone sub-project")).toBeNull();
		toggle("Collapse Parent");
		expect(screen.queryByText("Alpha child")).toBeNull();
		filter("Alpha child");
		expect(screen.getByText("Alpha child")).toBeTruthy();
		filter("");
		expect(screen.queryByText("Alpha child")).toBeNull();
		expect(screen.getByRole("button", { name: "Expand Parent" })).toBeTruthy();
	});

	it("selects only visible rows and counts selected children independently of their parent", () => {
		renderProjects();
		fireEvent.click(select("all visible projects"));
		expect(select("all visible projects").getAttribute("aria-checked")).toBe(
			"true"
		);
		expect(screen.getByText("2 of 4 row(s) selected.")).toBeTruthy();
		toggle("Expand Parent");
		expect(select("Alpha child").getAttribute("aria-checked")).toBe("false");
		expect(select("all visible projects").getAttribute("aria-checked")).toBe(
			"mixed"
		);
		fireEvent.click(select("all visible projects"));
		expect(screen.getByText("4 of 4 row(s) selected.")).toBeTruthy();
		toggle("Collapse Parent");
		fireEvent.click(select("all visible projects"));
		expect(screen.getByText("2 of 4 row(s) selected.")).toBeTruthy();
		toggle("Expand Parent");
		expect(select("Parent").getAttribute("aria-checked")).toBe("false");
		expect(select("Alpha child").getAttribute("aria-checked")).toBe("true");
		expect(select("Beta child").getAttribute("aria-checked")).toBe("true");
		filter("Alpha child");
		fireEvent.click(select("all visible projects"));
		fireEvent.click(select("all visible projects"));
		filter("");
		expect(select("Alpha child").getAttribute("aria-checked")).toBe("false");
		expect(select("Beta child").getAttribute("aria-checked")).toBe("true");
	});

	it("keeps expanded children on their parent's page", () => {
		const manyProjects = Array.from({ length: 16 }, (_, i) =>
			project(String(i + 1), `Project ${i + 1}`)
		);
		manyProjects.push(project("17", "Last parent's child", 15));
		renderProjects(manyProjects);
		toggle("Expand Project 15");
		expect(screen.getByText("Last parent's child")).toBeTruthy();
		expect(screen.queryByText("Project 16")).toBeNull();
		toggle("Go to next page");
		expect(screen.getByText("Project 16")).toBeTruthy();
		expect(screen.queryByText("Project 15")).toBeNull();
		expect(screen.queryByText("Last parent's child")).toBeNull();
		toggle("Go to previous page");
		expect(screen.getByText("Last parent's child")).toBeTruthy();
	});

	it("sorts siblings within their group and preserves selection", () => {
		renderProjects();
		toggle("Expand Parent");
		fireEvent.click(select("Alpha child"));
		fireEvent.keyDown(screen.getByRole("button", { name: "Title" }), {
			key: "Enter",
		});
		fireEvent.click(screen.getByRole("menuitem", { name: "Desc" }));
		const rows = within(screen.getByRole("table")).getAllByRole("row");
		expect(
			rows
				.slice(1)
				.map((row) =>
					within(row).getByRole("checkbox").getAttribute("aria-label")
				)
		).toEqual([
			"Select Standalone sub-project",
			"Select Parent",
			"Select Beta child",
			"Select Alpha child",
		]);
		expect(select("Alpha child").getAttribute("aria-checked")).toBe("true");
		expect(select("Beta child").getAttribute("aria-checked")).toBe("false");
	});
});
