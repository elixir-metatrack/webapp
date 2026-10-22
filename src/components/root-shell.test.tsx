import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import {
	createMemoryHistory,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { Route } from "@/routes/__root";
import { queryClient } from "@/lib/query-client";

vi.mock("@/providers/keycloak-provider", () => ({
	KeycloakProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@tanstack/react-devtools", () => ({
	TanStackDevtools: () => null,
}));

beforeEach(() => {
	vi.stubGlobal("localStorage", {
		getItem: vi.fn().mockReturnValue(null),
		setItem: vi.fn(),
	});
	vi.stubGlobal("scrollTo", vi.fn());
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockReturnValue({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})
	);
});

afterEach(() => {
	cleanup();
	queryClient.clear();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

it.each(["page", "error", "not-found"] as const)(
	"keeps navigation and its providers available for a %s",
	async (scenario) => {
		// Exercise the real router boundary: it replaces the route component on failure.
		const root = Route;
		const page = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => {
				if (scenario === "error") throw new Error("Review page failed");
				return <h1>Review page</h1>;
			},
		});
		const router = createRouter({
			routeTree: root.addChildren([page]),
			history: createMemoryHistory({
				initialEntries: [scenario === "not-found" ? "/missing" : "/"],
			}),
		});
		const errors = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		await router.load();
		render(<RouterProvider router={router} />, { container: document });

		await waitFor(() =>
			expect(document.body.textContent).toContain(
				scenario === "error"
					? "Review page failed"
					: scenario === "not-found"
						? "Not found"
						: "Review page"
			)
		);
		const screen = within(document.body);
		expect(screen.getByRole("button", { name: "Login" })).toBeTruthy();
		expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeTruthy();
		expect(
			errors.mock.calls
				.flat()
				.some((value) =>
					String(value).includes("useTheme must be used within a ThemeProvider")
				)
		).toBe(false);
	}
);
