// New types

export interface Sample {
	id: string;
	name: string;

	alias: string | null;
	taxId: number | null;
	hostTaxId: number | null;
	mlst: string | null;
	isolationSource: string | null;
	collectionDate: string | null; // Date
	location: string | null;
	sequencingLab: string | null;
	institution: string | null;
	hostHealthState: string | null;

	projectTitle: string | null;
	description: string | null;
	isolate: string | null;
	collectedBy: string | null;
	latitude: number | null;
	longitude: number | null;
	environmentalSample: string | null;
	hostAssociated: string | null;
	hostCommonName: string | null;
	hostSubjectId: string | null;
	collectorName: string | null;
	collectingInstitution: string | null;
	hostSex: string | null;
	influenzaTestMethod: string | null;
	influenzaTestResult: string | null;
	otherPathogensTested: string | null;
	otherPathogensTestResult: string | null;
	hostHabitat: string | null;
	isolationSourceHostAssociated: string | null;
	hostBehaviour: string | null;
	isolationSourceNonHostAssociated: string | null;
	influenzaVirusType: string | null;
	influenzaSubType: string | null;
	serovar: string | null;
	strain: string | null;
	hostAge: string | null;
	county: string | null;
	commune: string | null;
	hospitalHealthInstitution: string | null;

	createdOn: string | null; // Date
	modifiedOn: string | null; // Date

	customMetadata?: Record<string, unknown>;

	files?: SampleFile[];
}

export interface SampleFile {
	name: string;
}

export type CreateSample = Omit<
	Sample,
	"id" | "createdOn" | "lastUpdatedOn" | "modifiedOn" | "files"
>;

export type MeResponse = {
	userId: string;
	username: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	isAuthenticated: boolean;
	roles: string[];
	avatar?: string;
};

export type Member = {
	memberId: string;
	role: string;
	email?: string | null;
};

export interface Project {
	id?: string;
	name: string;
	description?: string;
	ownerId?: string;
	ownerUsername?: string;
	sampleCount?: number;
	createdOn?: string; // Date
	modifiedOn?: string;
}

export interface StatisticsResponse {
	projectCount: number;
	sampleCount: number;
	assayCount: number;
	lastUpdated: string;
}

export interface PresignUploadRequest {
	projectId: number;
	assayId: string;
	sampleName: string;
	file: File;
}

export interface PresignDownloadRequest {
	projectId: number;
	assayId: string;
	sampleName: string;
	fileName: string;
}

export interface PresignUploadResponse {
	url: string;
	objectKey: string;
	expiresIn: number;
	expiresAt: string;
}

export type PresignDownloadResponse = PresignUploadResponse;

export interface Assay {
	id: string;
	name: string;
	studyAccession?: string | null;
	instrumentModel?: string | null;
	libraryName?: string | null;
	librarySource?: string | null;
	libraryStrategy?: string | null;
	librarySelection?: string | null;
	libraryLayout?: string | null;
	insertSize?: number | null;
	createdOn?: string | null;
	modifiedOn?: string | null;
	files?: SampleFile[];
}

export type AssaySampleRow = Omit<Assay, "id">;

export interface Taxon {
	taxon_id: string;
	name: string;
}

export type SampleStatsByDateItem = {
	date: string;
	sampleCount: number;
};

export type SampleStatsByDateResponse = {
	items: SampleStatsByDateItem[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
};

export type TemplateType =
	| "sample"
	| "sample_extended"
	| "sample_virus"
	| "experiment";

export type SampleMetadataFieldType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";

export interface SampleMetadataField {
	id: string;
	key: string;
	label: string;
	type: SampleMetadataFieldType;
	archived: boolean;
}
