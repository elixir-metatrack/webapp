export const COLUMN_TOOLTIPS: Record<string, string> = {
	name: "Unique name of the sample.",

	alias:
		'Unique ID for identification of a sample in ENA. This should be the "TEXT_ID" OR "SAMPLE_NUMBER".',

	taxId:
		"Taxonomy ID of the organism as in the NCBI Taxonomy database. Entries in the NCBI Taxonomy database have integer taxon IDs. You can find the NCBI Taxonomy database here: https://www.ncbi.nlm.nih.gov/datasets/taxonomy/",

	taxonName:
		"Scientific name of the organism as in the NCBI Taxonomy database. Scientific names typically follow the binomial nomenclature. For example, the scientific name for humans is Homo sapiens. NB! you don't need to provide this as it will be automatically fetched from the Tax ID in MetaTrack.",

	title: "Title of the sample.",

	description:
		"Description of the sample. Example: Staphylococcus aureus isolated from blood culture.",

	isolationSource:
		"Describes the physical, environmental and/or local geographical source of the biological sample from which the sample was derived (example: feces, soil, hospital, nasal swab). If no suitable value is available, use one of the following: Not generated – Data were not generated. Not provided – Data are not provided. Restricted access – Data exist but are access restricted. Not applicable – Not relevant for this sample.",

	collectionDate:
		"The date the sample was collected with the intention of sequencing, either as an instance (single point in time) or interval. In case no exact time is available, the date/time can be right truncated i.e. all of these are valid ISO8601 compliant times (YYYY-MM-DDTHH:mm:ss±hh:mm): 2008-01-23T19:23:10+00:00; 2008-01-23T19:23:10; 2008-01-23; 2008-01; 2008.",

	location:
		"The geographical origin of where the sample was collected from, with the intention of sequencing, as defined by the country or sea name. Country or sea names should be chosen from the INSDC country list.",

	hostHealthState:
		"Health status of the host at the time of sample collection. If no suitable value is available, use one of the following: Not generated – Data were not generated. Not provided – Data are not provided. Restricted access – Data exist but are access restricted. Not applicable – Not relevant for this sample.",

	hostTaxId:
		"NCBI Taxonomy ID of the host to the organism from which sample was obtained. Entries in the NCBI Taxonomy database have integer taxon IDs.",

	hostTaxonName:
		"Scientific name of the natural (as opposed to laboratory) host to the organism from which sample was obtained.",

	isolate: "Individual isolate from which the sample was obtained.",

	collectedBy:
		"Name of persons or institute who collected the specimen. Example: Ola Nordmann or University Hospital of North Norway.",

	latitude:
		"The geographical origin of the sample as defined by latitude. Values should be reported in decimal degrees using the WGS84 system.",

	longitude:
		"The geographical origin of the sample as defined by longitude. Values should be reported in decimal degrees using the WGS84 system.",

	environmentalSample:
		"Identifies sequences derived by direct molecular isolation from a bulk environmental DNA sample with no reliable identification of the source organism.",

	hostAssociated:
		"Indicates whether the sequenced pathogen is host associated. Expected values: Yes or No.",

	hostCommonName: "Common name of the host. Example: human.",

	hostSubjectId:
		"A unique identifier by which each subject can be referred to. This should be de-identified. Example: #131.",

	collectorName:
		"Name of the person who collected the specimen. If no suitable value is available, use: Not generated, Not provided, Restricted access, or Not applicable.",

	institution:
		"Name of the institution to which the person collecting the specimen belongs. Format: Institute Name, Institute Address.",

	hostSex:
		"Gender or sex of the host. If no suitable value is available, use: Not generated, Not provided, Restricted access, or Not applicable.",

	influenzaTestMethod:
		"Method by which the current assessment of a sample as flu positive/negative is made. If multiple tests were performed, please state them separated by semicolon. Example: RT-PCR or antigen ELISA.",

	influenzaTestResult:
		"Classification of a sample as flu positive or negative based on the test performed. Format: P(ositive)/N(egative).",

	otherPathogensTested:
		"Classification of pathogenic organisms other than influenza virus tested in the current assessment of a sample. If no other pathogen test was performed, use 'none'.",

	otherPathogensTestResult:
		"Classification of a sample as positive or negative based on the test performed. Format: P(ositive)/N(egative)/not applicable.",

	hostHabitat: "Natural habitat of the avian or mammalian host.",

	hostTissue:
		"Name of host tissue or organ sampled for analysis. Example: tracheal tissue.",

	isolationSourceHostAssociated:
		"Describes the physical, environmental and/or local geographical source of the biological sample from which the sample was derived (example: soil)",

	hostBehaviour: "Natural behaviour of the host.",

	isolationSourceNonHostAssociated:
		"Describes the physical, environmental and/or local geographical source of the biological sample from which the sample was derived when not host associated.",

	influenzaVirusType: "One of the three influenza virus classification types.",

	influenzaSubType:
		"Influenza sub types. For detailed description of classification, see CDC influenza virus classification documentation.",

	serovar:
		"Serological variety of a species (usually a prokaryote) characterized by its antigenic properties. Example: Escherichia coli O157:H7.",

	strain:
		"Name of the strain from which the sample was obtained. Example: Escherichia coli O157 Sakai.",

	hostAge:
		"Age of host at the time of sampling. Relevant scale depends on species and study.",

	county:
		"The geographical origin of the sample as defined by the specific region (Fylke) name. Example: Troms.",

	commune:
		"The geographical origin of the sample as defined by the specific municipality (Kommune) name. Example: Tromsø.",

	hospitalHealthInstitution:
		"The hospital or health institution where the sample was collected. Example: University Hospital of North Norway.",

	mlst: "Multi-Locus Sequence Typing (MLST) scheme assigned to the isolate.",

	sequencingLab:
		"Typically the laboratory that carried out the sequencing of the samples.",

	collectingInstitution:
		"Name of the institution to which the person collecting the specimen belongs. Format: Institute Name, Institute Address.",

	// EXPERIMENT COLUMNS TOOLTIP
	sampleName:
		'Unique name of the sample. Identical to "Sample Name" as this is the sequence data from the original sample.',

	studyAccession: "Study accession or unique name.",

	files: "FASTQ files linked to the sample",

	fileMd5:
		"The file MD5 checksum. This field is mandatory if you do not use the Webin File Uploader or upload the checksum using a .md5 file.",

	fileName: "The file name including any subdirectory name.",

	fileUnencryptedMd5: "The file unencrypted MD5 checksum.",

	forwardFileMd5:
		"The file MD5 checksum for the forward FASTQ file. This field is mandatory if you do not use the Webin File Uploader or upload the checksum using a .md5 file.",

	forwardFileName:
		"The file name of compressed forward FASTQ including any subdirectory name.",

	forwardFileUnencryptedMd5:
		"The file unencrypted MD5 checksum for the forward FASTQ file.",

	insertSize:
		"The size (distance between paired reads) of the DNA fragment that is sequenced in bp. Typical examples: NextSeq 500 uses 500 or 550 bp; MiSeq systems use 50, 150, 250 and 300 bp.",

	reverseFileMd5:
		"The file MD5 checksum for the reverse FASTQ file. This field is mandatory if you do not use the Webin File Uploader or upload the checksum using a .md5 file.",

	reverseFileName:
		"The file name of compressed reverse FASTQ including any subdirectory name.",

	reverseFileUnencryptedMd5:
		"The file unencrypted MD5 checksum for the reverse FASTQ file.",

	sequencingPlatform: "The sequencing platform used in the experiment.",

	instrumentModel: "The sequencing instrument model used in the experiment.",

	libraryName: "The submitter's name for this library.",

	libraryLayout:
		"Library layout specifies whether to expect single or paired configuration of reads. In the case of paired reads, information about the relative distance and orientation is specified.",

	librarySelection:
		"Method used to select for or against, enrich, or screen the material being sequenced.",

	librarySource:
		"The library source specifies the type of source material that is being sequenced.",

	libraryStrategy: "Sequencing technique intended for this library.",

	sequencingLaboratory:
		"The sequencing laboratory or company used in the experiment.",

	// CREATE AND MODIFY ON
	createdOn: "Date of creation",
	modifiedOn: "Last modification date",
};
