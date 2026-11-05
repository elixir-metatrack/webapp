import { Check } from "lucide-react";
import { Card, CardContent } from "../ui/card";

const serves = [
	"Research institutions and universities",
	"Diagnostic and public health laboratories",
	"Hospitals and biobanks",
	"Environmental and food safety agencies",
	"Industry and innovation partners",
	"It supports both small research projects and larger national or cross-institutional collaborations.",
];

export default function Who() {
	return (
		<>
			<h4 className="max-w-6xl text-justify text-xl leading-relaxed lg:mx-auto lg:py-4">
				NMDP serves a broad community of users working with microbial and
				pathogen data:
			</h4>
			<section className="mx-auto max-w-7xl px-6 py-12">
				<Card className="w-fit max-w-full">
					<CardContent className="flex flex-col gap-2 p-4">
						{serves.map((item, index) => (
							<div key={index} className="flex items-start gap-2">
								<div className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
									<Check size={14} />
								</div>

								<p className="text-justify text-lg whitespace-pre-line">
									{item}
								</p>
							</div>
						))}
					</CardContent>
				</Card>
			</section>
		</>
	);
}
