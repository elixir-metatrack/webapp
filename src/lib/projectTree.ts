import type { Assay, Project, Sample, SampleWithAssays } from "./types";

import type {
	GraphLink,
	GraphNode,
	ProjectGraph,
} from "#/components/projectTree";

/**
 * ============================================================
 * SAMPLE -> ASSAYS
 * ============================================================
 *
 * Creates:
 *
 * Project
 *   ├── Sample 1
 *   │      ├── Assay A
 *   │      └── Assay B
 *   │
 *   └── Sample 2
 *          ├── Assay A
 *          └── Assay C
 *
 * Assays are deduplicated by ID, so if Sample 1 and Sample 2
 * share the same Assay, only one Assay node is created.
 */
export function buildProjectGraph(
	project: Project,
	samples: Sample[],
	assaysBySample: Record<string, Assay[]>
): ProjectGraph {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];

	/*
	 * ------------------------------------------------------
	 * Project
	 * ------------------------------------------------------
	 */

	nodes.push({
		id: `project-${project.id}`,
		name: project.name,
		type: "project",
	});

	/*
	 * ------------------------------------------------------
	 * Samples
	 * ------------------------------------------------------
	 */

	for (const sample of samples) {
		nodes.push({
			id: `sample-${sample.id}`,
			name: sample.name,
			type: "sample",
		});

		links.push({
			source: `project-${project.id}`,
			target: `sample-${sample.id}`,
		});
	}

	/*
	 * ------------------------------------------------------
	 * Assays
	 * ------------------------------------------------------
	 *
	 * IMPORTANT:
	 * The same assay can belong to multiple samples.
	 *
	 * We therefore create only ONE node per assay ID.
	 */

	const assayMap = new Map<string, Assay>();

	for (const sample of samples) {
		const assays = assaysBySample[sample.id] ?? [];

		for (const assay of assays) {
			if (!assayMap.has(assay.id)) {
				assayMap.set(assay.id, assay);
			}
		}
	}

	/*
	 * ------------------------------------------------------
	 * Assay nodes
	 * ------------------------------------------------------
	 */

	for (const assay of assayMap.values()) {
		nodes.push({
			id: `assay-${assay.id}`,
			name: assay.name,
			type: "assay",
		});
	}

	/*
	 * ------------------------------------------------------
	 * Sample -> Assay
	 * ------------------------------------------------------
	 *
	 * We intentionally create one link for every relationship.
	 *
	 * Sample 1 -> Assay A
	 * Sample 2 -> Assay A
	 *
	 * Both links point to the SAME assay node.
	 */

	for (const sample of samples) {
		const assays = assaysBySample[sample.id] ?? [];

		for (const assay of assays) {
			links.push({
				source: `sample-${sample.id}`,
				target: `assay-${assay.id}`,
			});
		}
	}

	return {
		nodes,
		links,
	};
}

/**
 * ============================================================
 * PROJECT -> SAMPLES
 * ============================================================
 *
 * Used when we only want to display the selected samples.
 */
export function buildProjectTree(project: Project, samples: Sample[]) {
	const nodes = [
		{
			id: `project-${project.id}`,
			name: project.name,
			type: "project" as const,
		},

		...samples.map((sample) => ({
			id: `sample-${sample.id}`,
			name: sample.name,
			type: "sample" as const,
		})),
	];

	const links = samples.map((sample) => ({
		source: `project-${project.id}`,
		target: `sample-${sample.id}`,
	}));

	return {
		nodes,
		links,
	};
}

/**
 * ============================================================
 * ASSAY -> SAMPLES
 * ============================================================
 *
 * Keep this if it is used by the Assays tab.
 */
export function buildProjectTreeSampleAssay(
	project: Project,
	samples: SampleWithAssays[]
) {
	const nodes = [
		{
			id: `project-${project.id}`,
			name: project.name,
			type: "project" as const,
		},

		...samples.map((sample) => ({
			id: `sample-${sample.id}`,
			name: sample.name,
			type: "sample" as const,
		})),

		...Array.from(
			new Map(
				samples
					.flatMap((sample) => sample.assays)
					.map((assay) => [
						assay.id,
						{
							id: `assay-${assay.id}`,
							name: assay.name,
							type: "assay" as const,
						},
					])
			).values()
		),
	];

	const links = [
		...samples.map((sample) => ({
			source: `project-${project.id}`,
			target: `sample-${sample.id}`,
		})),

		...samples.flatMap((sample) =>
			sample.assays.map((assay) => ({
				source: `sample-${sample.id}`,
				target: `assay-${assay.id}`,
			}))
		),
	];

	return {
		nodes,
		links,
	};
}
