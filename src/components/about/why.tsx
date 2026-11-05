import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface CheckItemProps {
	title?: string;
	description?: string;
}

const checkItems: Array<CheckItemProps> = [
	{
		title: "Connecting fragmented data",
		description:
			"Microbial datasets are often scattered across institutions and repositories. NMDP connects datasets and associated metadata, making valuable data easier to discover and reuse.",
	},
	{
		title: "Enabling research collaboration",
		description:
			"Limited visibility of existing and unpublished datasets can hinder collaboration. NMDP helps researchers discover relevant data, connect with data providers and explore opportunities for collaboration.",
	},
	{
		title: "Maximising data reuse",
		description:
			"Valuable microbial data are often underused due to limited accessibility and inconsistent metadata. NMDP promotes FAIR data practices, supporting long-term accessibility and reuse across research and surveillance.",
	},
];

export default function Why() {
	return (
		<>
			<h3 className="max-w-6xl text-justify text-xl leading-relaxed lg:mx-auto lg:py-4">
				Microbial data are generated across research, surveillance and
				diagnostic activities, but datasets are often scattered across
				institutions, difficult to discover and accompanied by incomplete or
				inconsistent metadata. Furthermore, valuable datasets may remain
				inaccessible to the wider research community until they are formally
				published in public archives. The{" "}
				<strong>Norwegian Microbial Data Platform (NMDP)</strong> addresses
				these challenges by providing a national infrastructure for discovering,
				managing and sharing microbial data and associated metadata. Through its
				integrated MetaTrack tool, NMDP supports structured metadata management,
				early discovery of unpublished datasets and collaboration across
				institutions. By promoting standardised metadata, controlled data access
				and integration with public archives, <strong>NMDP</strong> facilitates
				FAIR data practices and enables more efficient data sharing and reuse
				across research and surveillance activities.
			</h3>

			<section className="mx-auto max-w-7xl px-6 py-12">
				<div className="grid grid-cols-3 gap-4 bg-gray-100 p-2">
					{checkItems.map((check, index) => (
						<Card
							key={index}
							className="h-full transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
						>
							<CardHeader className="flex flex-row items-center gap-3">
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
