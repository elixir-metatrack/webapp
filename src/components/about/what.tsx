import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckItemProps {
	title?: string;
	description?: string;
}

const checkItems: Array<CheckItemProps> = [
	{
		title: "Discover unpublished data",
		description:
			"Discover microbial datasets before formal publication through searchable metadata, facilitating early data discovery and research collaboration.",
	},
	{
		title: "Rich metadata management",
		description:
			"Organise, manage and enrich contextual metadata linked to microbial datasets throughout the research data lifecycle.",
	},
	{
		title: "User-friendly interface",
		description:
			"Easily register, manage and share datasets and associated metadata through an intuitive web-based interface.",
	},
	{
		title: "Standardised and FAIR data",
		description:
			"Support FAIR data practices through structured metadata, international standards and integration with public data archives.",
	},
	{
		title: "Controlled data access",
		description:
			"Securely manage access to datasets and metadata through user authentication, permissions and controlled sharing.",
	},
	{
		title: "Support and training",
		description:
			"Access guidance, training and technical support through the ELIXIR Norway support desk.",
	},
];

export default function What() {
	return (
		<>
			<h3 className="max-w-6xl text-justify text-xl leading-relaxed lg:mx-auto lg:py-4">
				The <strong>Norwegian Microbial Data Platform (NMDP)</strong> provides a
				national infrastructure for discovering, managing, sharing and reusing
				microbial data. Through its integrated{" "}
				<a
					href="https://metatrack.no"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 hover:underline"
				>
					MetaTrack
				</a>{" "}
				tool, researchers can manage datasets and contextual metadata,
				collaborate across institutions and prepare data for publication in
				public archives.
			</h3>

			<section className="mx-auto max-w-7xl px-6 py-12">
				<h3 className="mb-4 text-center text-xl font-semibold">
					What NMDP Offers
				</h3>

				<div className="grid grid-cols-3 gap-4 bg-gray-100 p-2">
					{checkItems.map((check, index) => (
						<Card
							key={index}
							className="h-full transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
						>
							<CardHeader className="flex flex-row items-center gap-3">
								<div className="text-secondary flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600">
									<Check size={14} />
								</div>

								<CardTitle>{check.title}</CardTitle>
							</CardHeader>

							<CardContent className="flex flex-col">
								<p className="text-justify text-base whitespace-pre-line">
									{check.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</>
	);
}
