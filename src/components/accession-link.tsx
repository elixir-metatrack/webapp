import { ExternalLink } from "lucide-react";

interface AccessionLinkProps {
	accession?: string | null;
}

export function AccessionLink({ accession }: AccessionLinkProps) {
	if (!accession) return null;

	const value = accession.trim();

	const url = /^(SAMEA|SAMN|SAMD)\d+$/i.test(value)
		? `https://www.ebi.ac.uk/biosamples/samples/${encodeURIComponent(value)}`
		: /^(ERS|SRS|DRS|ERX|SRX|DRX|ERR|SRR|DRR|ERP|SRP|DRP)\d+$/i.test(value) ||
			  /^PRJ(EB|NA|DB)\d+$/i.test(value)
			? `https://www.ebi.ac.uk/ena/browser/view/${encodeURIComponent(value)}`
			: null;

	if (!url) return <span>{accession}</span>;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			onClick={(e) => e.stopPropagation()}
			className="inline-flex items-center gap-1 text-blue-600 hover:underline"
		>
			{accession}
			<ExternalLink className="size-3.5" />
		</a>
	);
}
