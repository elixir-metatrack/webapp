import type { Sample } from "@/lib/types";

export function getTotalSamples(samples: Sample[]) {
	return samples.length;
}

export function getTotalProjects(projects: any[]) {
	return projects.length;
}

export function getTotalAssays(assays: any[]) {
	return assays.length;
}

export function getUniqueSampleTypes(samples: Sample[]) {
	const set = new Set<string>();

	for (const s of samples) {
		if (s.isolationSource) set.add(s.isolationSource);
		if (s.institution) set.add(s.institution);
		if (s.location) set.add(s.location);
	}

	return set.size;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export function formatStorage(usedBytes: number, totalGB: number = 500) {
	const totalBytes = totalGB * GB;

	const usedGB = usedBytes / GB;

	const percent = (usedBytes / totalBytes) * 100;

	return {
		used: `${usedGB.toFixed(2)} GB`,
		total: `${totalGB} GB`,
		percent: `${percent.toFixed(1)}%`,
		label: `${usedGB.toFixed(2)} GB / ${totalGB} GB`,
	};
}
