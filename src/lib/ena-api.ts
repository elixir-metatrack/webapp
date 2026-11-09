export interface EnaFastqFile {
	runAccession: string;
	fileName: string;
	url: string;
	md5?: string;
	bytes?: number;
}

interface EnaFileReport {
	run_accession: string;
	fastq_ftp?: string;
	fastq_md5?: string;
	fastq_bytes?: string;
}

function toHttpsUrl(path: string): string {
	const normalized = path.replace(/^(ftp|https?):\/\//i, "");
	const url = new URL(`https://${normalized}`);

	if (url.hostname !== "ftp.sra.ebi.ac.uk" || url.protocol !== "https:") {
		throw new Error("Unexpected ENA download host");
	}

	return url.toString();
}

export async function getEnaFastqFiles(
	runAccessions: string[]
): Promise<EnaFastqFile[]> {
	const uniqueRuns = [...new Set(runAccessions)];

	if (uniqueRuns.length === 0) return [];

	if (uniqueRuns.some((accession) => !/^(ERR|SRR|DRR)\d+$/i.test(accession))) {
		throw new Error("Invalid ENA run accession");
	}

	const results = await Promise.all(
		uniqueRuns.map(async (accession) => {
			const params = new URLSearchParams({
				accession,
				result: "read_run",
				fields: "run_accession,fastq_ftp,fastq_md5,fastq_bytes",
				format: "json",
			});

			const response = await fetch(
				`https://www.ebi.ac.uk/ena/portal/api/filereport?${params}`
			);

			if (!response.ok) {
				throw new Error(`ENA request failed for ${accession}`);
			}

			const reports: EnaFileReport[] = await response.json();

			return reports.flatMap((report) => {
				const paths = (report.fastq_ftp ?? "").split(";").filter(Boolean);

				const md5s = (report.fastq_md5 ?? "").split(";");
				const sizes = (report.fastq_bytes ?? "").split(";");

				return paths.map((path, index) => {
					const url = toHttpsUrl(path);
					const size = Number(sizes[index]);

					return {
						runAccession: report.run_accession,
						fileName: new URL(url).pathname.split("/").pop()!,
						url,
						md5: md5s[index] || undefined,
						bytes: Number.isFinite(size) && sizes[index] ? size : undefined,
					};
				});
			});
		})
	);

	return results.flat();
}
