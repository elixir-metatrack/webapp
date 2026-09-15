import { getSamplesByDate } from "@/lib/api-keycloak";
import { useQuery } from "@tanstack/react-query";

export type SampleStatPoint = {
	date: string;
	sample: number;
};

function getDaysFromRange(range: string) {
	switch (range) {
		case "7d":
			return 7;
		case "30d":
			return 30;
		case "90d":
		default:
			return 90;
	}
}

function getStartDate(days: number) {
	const date = new Date();

	date.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - (days - 1));

	return date;
}

export function useSampleStats(range: string) {
	return useQuery({
		queryKey: ["sample-stats", range],

		queryFn: async (): Promise<SampleStatPoint[]> => {
			const days = getDaysFromRange(range);
			const startDate = getStartDate(days);

			const data = await getSamplesByDate();

			return data.items
				.filter((item) => {
					const date = new Date(`${item.date}T00:00:00`);

					return date >= startDate;
				})
				.map((item) => ({
					date: item.date,
					sample: item.sampleCount,
				}))
				.sort((a, b) => a.date.localeCompare(b.date));
		},

		staleTime: 1000 * 60 * 5,
	});
}
