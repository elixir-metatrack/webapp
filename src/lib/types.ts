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

export interface SampleWithAssays extends Sample {
	assays: Assay[];
}

export interface SampleFile {
	uuid: string;
	name: string;
	virtualPath: string;
	objectKey: string;
	status: string;
	sampleId: string;
	assayId: string;
	readRole: string;
	md5: string;
	unencryptedMd5: string;
}

export type CreateSample = Omit<
	Sample,
	"id" | "createdOn" | "lastUpdatedOn" | "modifiedOn" | "files"
>;

export type MeResponse = {
	userId: string;
	username: string;
	roles: string[];
	country: string;
	institution: string;
	orcid: string;
	firstName: string;
	lastName: string;
};

export type Member = {
	memberId: string;
	role: string;
	username?: string | null;
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
	parentProjectId?: number | null;
	dataOwningOrganization?: string;
	detailedDescription?: string;
	comments?: string;
}

export type InvitationRole = "VIEWER" | "EDITOR" | "ADMIN";

export type DeliveryStatus =
	| "NOT_ATTEMPTED"
	| "SENDING"
	| "SENT"
	| "FAILED"
	| "UNKNOWN";

export type InvitationStatus =
	| "PENDING"
	| "ACCEPTED"
	| "DECLINED"
	| "REVOKED"
	| "EXPIRED";

export interface ProjectInvitation {
	id: string;
	projectId: number;
	recipientEmail: string;
	inviterId: string;
	inviterDisplayName: string;
	role: InvitationRole;
	status: InvitationStatus;
	createdOn: string;
	expiresOn: string;
	respondedOn: string | null;
	deliveryStatus: DeliveryStatus;
	deliveryAttemptedOn: string | null;
	deliveryCompletedOn: string | null;
	deliveryRetryAfter: string | null;
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

export type UpdateAssay = Partial<
	Omit<Assay, "id" | "createdOn" | "modifiedOn" | "files">
>;

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

export interface Vocabulary {
	id: string;
	fieldKey: string;
	label: string;
	custom: boolean;
	terms: string[];
	createdOn: string;
	modifiedOn: string;
}

type VocabularyScope = "global" | "project";

export interface VocabularyManagerProps {
	projectId?: string;
	scope: VocabularyScope;
}

export type StorageStats = {
	fileCount: number;
	totalBytes: number;
};

export type TemplateType =
	| "sample"
	| "sample_extended"
	| "sample_virus"
	| "experiment_PE"
	| "experiment_SE";

export type SampleMetadataFieldType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";

export interface SampleMetadataField {
	id: string;
	key: string;
	label: string;
	type: SampleMetadataFieldType;
	tooltip: string;
	archived: boolean;
}

export type NotificationType = "PROJECT_INVITATION";

export type NotificationInvitation = {
	id: string;
	projectId: number;
	role: string;
	status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED" | "EXPIRED";
	expiresOn: string;
	actionable: boolean;
};

export type AppNotification = {
	id: string;
	type: NotificationType;
	createdOn: string;
	readOn: string | null;
	title: string;
	content: string;
	invitation: NotificationInvitation | null;
};

export type NotificationPage = {
	items: AppNotification[];
	page: number;
	size: number;
	total: number;
	unreadCount: number;
};
