import * as React from "react";
import type { ColumnOrderState } from "@tanstack/react-table";

function readColumnOrder(
	key: string,
	defaultOrder: ColumnOrderState
): ColumnOrderState {
	try {
		const saved = localStorage.getItem(key);

		if (saved) {
			const parsed: unknown = JSON.parse(saved);

			if (
				Array.isArray(parsed) &&
				parsed.every((id) => typeof id === "string")
			) {
				return [
					"select",
					...parsed.filter((id) => id !== "select" && id !== "actions"),
				];
			}
		}
	} catch (error) {
		console.error("Failed to load column order:", error);
	}

	return defaultOrder;
}

export function usePersistentColumnOrder(
	storageKey: string,
	defaultOrder: ColumnOrderState
) {
	const [stored, setStored] = React.useState(() => ({
		key: storageKey,
		order: readColumnOrder(storageKey, defaultOrder),
	}));

	// When the project or assay changes, use the corresponding order
	// immediately, without writing the previous project's order.
	const columnOrder =
		stored.key === storageKey
			? stored.order
			: readColumnOrder(storageKey, defaultOrder);

	const setColumnOrder = React.useCallback<
		React.Dispatch<React.SetStateAction<ColumnOrderState>>
	>(
		(updater) => {
			setStored((previous) => {
				const current =
					previous.key === storageKey
						? previous.order
						: readColumnOrder(storageKey, defaultOrder);

				const next = typeof updater === "function" ? updater(current) : updater;

				const normalized = [
					"select",
					...next.filter((id) => id !== "select" && id !== "actions"),
				];

				try {
					localStorage.setItem(storageKey, JSON.stringify(normalized));
				} catch (error) {
					console.error("Failed to save column order:", error);
				}

				return {
					key: storageKey,
					order: normalized,
				};
			});
		},
		[storageKey, defaultOrder]
	);

	return [columnOrder, setColumnOrder] as const;
}
