import { isTableImportViolations, TableImportError } from "./table-import";
import { keycloak } from "./keycloak";
import type {
	Assay,
	CreateSample,
	InvitationRole,
	Member,
	NotificationPage,
	PresignDownloadRequest,
	PresignDownloadResponse,
	PresignUploadRequest,
	PresignUploadResponse,
	Project,
	ProjectInvitation,
	Sample,
	SampleFile,
	SampleMetadataField,
	SampleMetadataFieldType,
	SampleStatsByDateResponse,
	StatisticsResponse,
	StorageStats,
	Taxon,
	TemplateType,
	Vocabulary,
} from "./types";
import { API_URL, API_BASE_URL } from "./config";
import { getApiErrorMessage } from "./utils";

// ============================================================
// API
// ============================================================

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function api<T = unknown>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const request = async (): Promise<Response> => {
		const token = keycloak.token;

		const headers: Record<string, string> = {
			...(options.headers as Record<string, string> | undefined),
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
			headers["Content-Type"] = "application/json";
		}

		return fetch(`${API_URL}/${endpoint}`, {
			...options,
			headers,
		});
	};

	let authenticationFailed = false;

	try {
		if (!keycloak.authenticated) {
			throw new Error("Not authenticated");
		}

		try {
			await keycloak.updateToken(30);
		} catch (error) {
			authenticationFailed = true;
			throw error;
		}

		let res = await request();

		if (res.status === 401) {
			try {
				await keycloak.updateToken(-1);
			} catch (error) {
				authenticationFailed = true;
				throw error;
			}

			res = await request();
		}

		if (res.status === 401) {
			throw new Error("Authentication expired");
		}

		if (!res.ok) {
			const contentType = res.headers.get("content-type");
			let message = "API error";

			if (contentType?.includes("application/json")) {
				const data = await res.json();
				if (
					(endpoint.endsWith("/samplesheet") ||
						/assays\/[^/]+\/experiments$/.test(endpoint)) &&
					isTableImportViolations(data)
				) {
					throw new TableImportError(data);
				}
				throw new Error(getApiErrorMessage(data));
			}

			throw new ApiError(message, res.status);
		}

		const contentType = res.headers.get("content-type");

		if (!contentType || !contentType.includes("application/json")) {
			return undefined as T;
		}

		return (await res.json()) as T;
	} catch (error) {
		const shouldRedirect =
			authenticationFailed ||
			!keycloak.authenticated ||
			(error instanceof Error &&
				(error.message === "Authentication expired" ||
					error.message === "Not authenticated"));

		if (shouldRedirect) {
			window.location.href = "/";
		}

		throw error;
	}
}

export async function apiPublic<T = unknown>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const res = await fetch(`${API_URL}/${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
	});

	if (!res.ok) {
		let message = "API error";

		try {
			const data = await res.json();
			message = data?.message ?? message;
		} catch {
			message = await res.text();
		}

		throw new Error(message);
	}

	return res.json();
}

// ============================================================
// Projects
// ============================================================

export async function getProjects() {
	return api<Project[]>("projects");
}

export async function getProjectsPublic() {
	return apiPublic<Project[]>("projects");
}

export async function getProjectsByUser() {
	return api<Project[]>("projects/me");
}

export function createInvestigation(data: Project) {
	return api<Project>("projects", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateProject(
	projectId: string,
	data: { name?: string; description?: string }
) {
	return api(`projects/${projectId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function deleteProject(projectId: string): Promise<void> {
	await api(`projects/${projectId}`, {
		method: "DELETE",
	});
}

// ============================================================
// Sub-Projects
// ============================================================

export async function createSubProject(
	parentProjectId: string,
	data: { name: string; description?: string; sampleIds: string[] }
): Promise<Project> {
	return api<Project>(`projects/${parentProjectId}/subprojects`, {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function getSubProjects(projectId: string): Promise<Project[]> {
	return api<Project[]>(`projects/${projectId}/subprojects`);
}

export async function linkSamplesToProject(
	projectId: string,
	sampleIds: string[]
): Promise<void> {
	await api(`projects/${projectId}/samples/link`, {
		method: "PUT",
		body: JSON.stringify({ sampleIds }),
	});
}

export async function unlinkSamplesFromProject(
	projectId: string,
	sampleIds: string[]
): Promise<void> {
	await api(`projects/${projectId}/samples/link`, {
		method: "DELETE",
		body: JSON.stringify({ sampleIds }),
	});
}

// ============================================================
// Project Members & Join Requests
// ============================================================

export async function getAllProjectMembers(
	projectId: string
): Promise<Member[]> {
	return api<Member[]>(`projects/${projectId}/members`, {
		method: "GET",
	});
}

export async function addProjectMember(
	projectId: string,
	memberId: string,
	role: string
) {
	return api(`projects/${projectId}/member/${memberId}`, {
		method: "POST",
		body: JSON.stringify({ role }),
	});
}

export async function updateProjectMember(
	projectId: string,
	memberId: string,
	role: string
) {
	return api(`projects/${projectId}/member/${memberId}`, {
		method: "PUT",
		body: JSON.stringify({ role }),
	});
}

export async function removeProjectMember(projectId: string, memberId: string) {
	return api(`projects/${projectId}/member/${memberId}`, {
		method: "DELETE",
	});
}

export async function joinProject(
	projectId: string,
	role: string
): Promise<void> {
	await api(`projects/${projectId}/join/${role}`, {
		method: "POST",
	});
}

export async function getJoinRequests(projectId: string): Promise<unknown[]> {
	return api<unknown[]>(`projects/${projectId}/joinrequests`);
}

export async function approveJoinRequest(
	projectId: string,
	userId: string
): Promise<void> {
	await api(`projects/${projectId}/joinrequests/${userId}/approve`, {
		method: "POST",
	});
}

export async function deleteJoinRequest(
	projectId: string,
	userId: string
): Promise<void> {
	await api(`projects/${projectId}/joingrequests/${userId}`, {
		method: "DELETE",
	});
}

export async function inviteProjectMember(
	projectId: string,
	email: string,
	role: InvitationRole
): Promise<ProjectInvitation> {
	return api<ProjectInvitation>(`projects/${projectId}/invitations`, {
		method: "POST",
		body: JSON.stringify({
			email: email.trim(),
			role,
		}),
	});
}

export async function resendProjectInvitation(
	projectId: string,
	invitationId: string
): Promise<ProjectInvitation> {
	return api<ProjectInvitation>(
		`projects/${projectId}/invitations/${invitationId}/resend`,
		{
			method: "POST",
		}
	);
}

export async function getProjectInvitations(
	projectId: string,
	page = 0,
	size = 20
): Promise<ProjectInvitation[]> {
	return api<ProjectInvitation[]>(
		`projects/${projectId}/invitations?page=${page}&size=${size}`,
		{ method: "GET" }
	);
}

export async function revokeProjectInvitation(
	projectId: string,
	invitationId: string
): Promise<void> {
	await api(`projects/${projectId}/invitations/${invitationId}`, {
		method: "DELETE",
	});
}

export async function acceptProjectInvitation(
	invitationId: string
): Promise<ProjectInvitation> {
	return api<ProjectInvitation>(`invitations/${invitationId}/accept`, {
		method: "POST",
	});
}

export async function declineProjectInvitation(
	invitationId: string
): Promise<ProjectInvitation> {
	return api<ProjectInvitation>(`invitations/${invitationId}/decline`, {
		method: "POST",
	});
}

// ============================================================
// Samples
// ============================================================

export async function getSamples(projectId: string): Promise<Sample[]> {
	const data = await api<Sample[] | { samples: Sample[] }>(
		`projects/${projectId}/samples`
	);

	return Array.isArray(data) ? data : (data.samples ?? []);
}

export async function createSample(
	data: CreateSample,
	projectId: string
): Promise<void> {
	try {
		await api(`projects/${projectId}/samples`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	} catch (error) {
		if (error instanceof ApiError && error.status === 409) {
			throw new Error("A sample with this name already exists.");
		}

		throw error;
	}
}

export async function updateSample(
	projectId: string,
	sampleId: string,
	data: Partial<CreateSample>
): Promise<void> {
	await api(`projects/${projectId}/samples/${sampleId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function batchEditSamples(
	projectId: string,
	data: {
		sampleData: Partial<CreateSample>[];
	}
): Promise<void> {
	await api(`projects/${projectId}/samples`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}

export async function deleteSelectedSamples<T extends { id: string }>(
	projectId: string,
	selectedRows: T[] | T
): Promise<{ success: string[]; failed: string[] }> {
	const sampleIds = Array.isArray(selectedRows)
		? selectedRows.map((row) => row.id)
		: [selectedRows.id];

	const results = await Promise.allSettled(
		sampleIds.map(async (sampleId) => {
			await api(`projects/${projectId}/samples/${sampleId}`, {
				method: "DELETE",
			});

			return {
				id: sampleId,
				ok: true,
			};
		})
	);

	const success: string[] = [];
	const failed: string[] = [];

	results.forEach((r) => {
		if (r.status === "fulfilled" && r.value.ok) {
			success.push(r.value.id);
		} else if (r.status === "fulfilled") {
			failed.push(r.value.id);
		} else {
			failed.push("unknown");
		}
	});

	return { success, failed };
}

export async function uploadSamplesheet(
	projectId: string,
	file: File
): Promise<unknown> {
	const formData = new FormData();
	formData.append("file", file);

	return api(`projects/${projectId}/samples/samplesheet`, {
		method: "POST",
		body: formData,
	});
}

export async function getAssaysInSample(
	projectId: string,
	sampleId: string
): Promise<Assay[]> {
	const data = await api<Assay[] | { assays: Assay[] }>(
		`projects/${projectId}/samples/${sampleId}/assays`
	);

	return Array.isArray(data) ? data : (data.assays ?? []);
}

// ============================================================
// Sample Metadata Fields
// ============================================================

export async function getSampleMetadataFields(
	projectId: string
): Promise<SampleMetadataField[]> {
	return api<SampleMetadataField[]>(
		`projects/${projectId}/sample-metadata-fields`
	);
}

export async function createSampleMetadataField(
	projectId: string,
	data: {
		key: string;
		label: string;
		tooltip: string;
		type: SampleMetadataFieldType;
	}
): Promise<SampleMetadataField> {
	return api<SampleMetadataField>(
		`projects/${projectId}/sample-metadata-fields`,
		{
			method: "POST",
			body: JSON.stringify(data),
		}
	);
}

export async function updateSampleMetadataField(
	projectId: string,
	fieldId: string,
	data: {
		label?: string;
		tooltip?: string;
		archived?: boolean;
	}
): Promise<SampleMetadataField> {
	return api<SampleMetadataField>(
		`projects/${projectId}/sample-metadata-fields/${fieldId}`,
		{
			method: "PATCH",
			body: JSON.stringify(data),
		}
	);
}

export async function deleteSampleMetadataField(
	projectId: string,
	fieldId: string
): Promise<void> {
	await api(`projects/${projectId}/sample-metadata-fields/${fieldId}`, {
		method: "DELETE",
	});
}

// ============================================================
// Sample Vocabularies
// ============================================================

export async function getSampleVocabularies(
	projectId: string
): Promise<Vocabulary[]> {
	return api<Vocabulary[]>(`projects/${projectId}/sample-vocabularies`);
}

export async function getSampleVocabulary(
	projectId: string,
	fieldKey: string
): Promise<Vocabulary> {
	return api<Vocabulary>(
		`projects/${projectId}/sample-vocabularies/${fieldKey}`
	);
}

export async function updateSampleVocabulary(
	projectId: string,
	fieldKey: string,
	terms: string[]
): Promise<void> {
	await api(`projects/${projectId}/sample-vocabularies/${fieldKey}`, {
		method: "PUT",
		body: JSON.stringify({ terms }),
	});
}

export async function deleteSampleVocabulary(
	projectId: string,
	fieldKey: string
): Promise<void> {
	await api(`projects/${projectId}/sample-vocabularies/${fieldKey}`, {
		method: "DELETE",
	});
}

export async function createSampleVocabulary(
	projectId: string,
	fieldKey: string,
	terms: string[]
): Promise<Vocabulary> {
	return api<Vocabulary>(`projects/${projectId}/sample-vocabularies`, {
		method: "POST",
		body: JSON.stringify({ fieldKey, terms }),
	});
}

// ============================================================
// Global Sample Vocabularies
// ============================================================

export async function getGlobalSampleVocabularies(): Promise<Vocabulary[]> {
	return api<Vocabulary[]>("sample-vocabularies");
}

export async function getGlobalSampleVocabulary(
	fieldKey: string
): Promise<Vocabulary> {
	return api<Vocabulary>(`sample-vocabularies/${encodeURIComponent(fieldKey)}`);
}

export async function updateGlobalSampleVocabulary(
	fieldKey: string,
	terms: string[]
): Promise<Vocabulary> {
	return api<Vocabulary>(
		`sample-vocabularies/${encodeURIComponent(fieldKey)}`,
		{
			method: "PUT",
			body: JSON.stringify({ terms }),
		}
	);
}

export async function deleteGlobalSampleVocabulary(
	fieldKey: string
): Promise<void> {
	await api(`sample-vocabularies/${encodeURIComponent(fieldKey)}`, {
		method: "DELETE",
	});
}

// ============================================================
// Assays
// ============================================================

export async function getAssays(projectId: string): Promise<Assay[]> {
	const data = await api<Assay[] | { assays: Assay[] }>(
		`projects/${projectId}/assays`
	);

	return Array.isArray(data) ? data : (data.assays ?? []);
}

export async function getAssayById(
	projectId: string,
	assayId: string
): Promise<Assay> {
	return api<Assay>(`projects/${projectId}/assays/${assayId}`);
}

export async function createAssay(
	projectId: string,
	payload: Partial<Assay>
): Promise<Assay> {
	return api<Assay>(`projects/${projectId}/assays`, {
		method: "POST",
		body: JSON.stringify({
			name: payload.name,
			studyAccession: payload.studyAccession ?? null,
			instrumentModel: payload.instrumentModel ?? null,
			libraryName: payload.libraryName ?? null,
			librarySource: payload.librarySource ?? null,
			libraryStrategy: payload.libraryStrategy ?? null,
			librarySelection: payload.librarySelection ?? null,
			libraryLayout: payload.libraryLayout ?? null,
			insertSize: payload.insertSize ?? null,
		}),
	});
}

export async function updateAssay(
	projectId: string,
	assayId: string,
	payload: Partial<Assay>
) {
	return api(`projects/${projectId}/assays/${assayId}`, {
		method: "PATCH",
		body: JSON.stringify(payload),
	});
}

export async function deleteAssay(projectId: string, assayId: string) {
	return api(`projects/${projectId}/assays/${assayId}`, {
		method: "DELETE",
	});
}

export async function getSamplesInAssay(
	projectId: string,
	assayId: string
): Promise<Sample[]> {
	return api<Sample[]>(`projects/${projectId}/assays/${assayId}/samples`);
}

export async function addSamplesToAssay(
	projectId: string,
	assayId: string,
	sampleNames: string[]
): Promise<void> {
	return api(`projects/${projectId}/assays/${assayId}/samples`, {
		method: "PUT",
		body: JSON.stringify({ sampleNames }),
	});
}

export async function uploadExperiments(
	projectId: string,
	assayId: string,
	file: File
): Promise<void> {
	const formData = new FormData();
	formData.append("file", file);

	await api(`projects/${projectId}/assays/${assayId}/experiments`, {
		method: "POST",
		body: formData,
	});
}

export async function deleteSamplesFromAssay(
	projectId: string,
	assayId: string,
	sampleNames: string[]
): Promise<void> {
	return api(`projects/${projectId}/assays/${assayId}/samples`, {
		method: "DELETE",
		body: JSON.stringify({ sampleNames }),
	});
}

// ============================================================
// Global Assay Vocabularies
// ============================================================

export async function getGlobalAssayVocabularies(): Promise<Vocabulary[]> {
	return api<Vocabulary[]>("assay-vocabularies");
}

export async function getGlobalAssayVocabulary(
	fieldKey: string
): Promise<Vocabulary> {
	return api<Vocabulary>(`assay-vocabularies/${encodeURIComponent(fieldKey)}`);
}

export async function updateGlobalAssayVocabulary(
	fieldKey: string,
	terms: string[]
): Promise<Vocabulary> {
	return api<Vocabulary>(`assay-vocabularies/${encodeURIComponent(fieldKey)}`, {
		method: "PUT",
		body: JSON.stringify({ terms }),
	});
}

export async function deleteGlobalAssayVocabulary(
	fieldKey: string
): Promise<void> {
	await api(`assay-vocabularies/${encodeURIComponent(fieldKey)}`, {
		method: "DELETE",
	});
}

// ============================================================
// Files
// ============================================================

export async function getSampleFiles(
	projectId: number,
	sampleId: string
): Promise<SampleFile[]> {
	return api<SampleFile[]>(`projects/${projectId}/samples/${sampleId}/files`, {
		method: "GET",
	});
}

export async function getFilesSampleAssay(
	projectId: number,
	assayId: string,
	sampleId: string
): Promise<SampleFile[]> {
	return api<SampleFile[]>(
		`projects/${projectId}/assays/${assayId}/samples/${sampleId}/files`,
		{
			method: "GET",
		}
	);
}

export async function requestPresignedUpload(
	data: PresignUploadRequest
): Promise<PresignUploadResponse> {
	return api<PresignUploadResponse>("files/presign-upload", {
		method: "POST",
		body: JSON.stringify({
			projectId: data.projectId,
			assayId: data.assayId,
			sampleName: data.sampleName,
			fileName: data.file.name,
		}),
	});
}

export async function requestPresignedDownload(
	data: PresignDownloadRequest
): Promise<PresignDownloadResponse> {
	return api<PresignDownloadResponse>("files/presign-download", {
		method: "POST",
		body: JSON.stringify({
			projectId: data.projectId,
			assayId: data.assayId,
			sampleName: data.sampleName,
			fileName: data.fileName,
		}),
	});
}

export async function deleteProjectFile(
	projectId: number,
	fileUuid: string
): Promise<void> {
	await api<void>(`projects/${projectId}/files/${fileUuid}`, {
		method: "DELETE",
	});
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
	const res = await fetch(uploadUrl, {
		method: "PUT",
		body: file,
	});

	if (!res.ok) {
		throw new Error("Error uploading file to storage");
	}
}

export async function progressUploadFile(
	url: string,
	file: File,
	onProgress?: (progress: number) => void
) {
	return new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		xhr.open("PUT", url);

		xhr.setRequestHeader(
			"Content-Type",
			file.type || "application/octet-stream"
		);

		if (onProgress) {
			xhr.upload.onprogress = (event) => {
				if (!event.lengthComputable) return;

				const percent = Math.round((event.loaded * 100) / event.total);

				onProgress(percent);
			};
		}

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`Upload failed with status ${xhr.status}`));
			}
		};

		xhr.onerror = () => reject(new Error("Upload failed"));

		xhr.send(file);
	});
}

// ============================================================
// Statistics / Taxonomy
// ============================================================

export async function getStatistics() {
	return apiPublic<StatisticsResponse>("statistics");
}

export async function getTaxon(taxon_id: string): Promise<Taxon> {
	return api<Taxon>(`../taxon/${taxon_id}`);
}

export async function getSamplesByDate(): Promise<SampleStatsByDateResponse> {
	return apiPublic<SampleStatsByDateResponse>(`statistics/samples-by-date`);
}

export async function getProjectStorageStatistics(
	projectId: string
): Promise<StorageStats> {
	return api<StorageStats>(`projects/${projectId}/statistics/storage`);
}

// ============================================================
// Templates
// ============================================================

export async function downloadTemplate(type: TemplateType): Promise<void> {
	const TEMPLATE_PATHS: Record<TemplateType, string> = {
		sample: "/templates/samples/sample.csv",
		sample_extended: "/templates/samples/sample_extended.csv",
		sample_virus: "/templates/samples/sample_virus.csv",
		experiment_PE: "/templates/experiments/experiment_PE.csv",
		experiment_SE: "/templates/experiments/experiment_SE.csv",
	};

	const path = TEMPLATE_PATHS[type];
	const filename = `${type}.csv`;

	const res = await fetch(`${API_BASE_URL}${path}`);

	if (!res.ok) {
		throw new Error(`Failed to download ${filename}`);
	}

	downloadBlob(await res.blob(), filename);
}

export async function downloadExcelTemplate(type: TemplateType): Promise<void> {
	const res = await fetch(`${API_URL}/templates/excel/${type}`);
	if (!res.ok) throw new Error("Failed to download Excel template");
	downloadBlob(await res.blob(), `${type}-v1.xlsx`);
}

export async function exportExcelData(
	projectId: string,
	sampleNames: string[],
	assayId?: string
): Promise<void> {
	if (sampleNames.length === 0) throw new Error("Choose samples to export");
	const path = assayId
		? `projects/${projectId}/assays/${assayId}/experiments/export`
		: `projects/${projectId}/samples/export`;
	const response = await fetch(`${API_URL}/${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${keycloak.token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ sampleNames }),
	});
	if (!response.ok) {
		const message = response.headers
			.get("content-type")
			?.includes("application/json")
			? getApiErrorMessage(await response.json())
			: await response.text();
		throw new Error(message || "Failed to export Excel file");
	}
	const filename = assayId
		? `experiments-${assayId}.xlsx`
		: `samples-${projectId}.xlsx`;
	downloadBlob(await response.blob(), filename);
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	try {
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
	} finally {
		anchor.remove();
		URL.revokeObjectURL(url);
	}
}

// ============================================================
// Notifications
// ============================================================

export async function getNotifications(
	page = 0,
	size = 20,
	unread = false
): Promise<NotificationPage> {
	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	});

	if (unread) {
		params.set("unread", "true");
	}

	return api<NotificationPage>(`notifications?${params.toString()}`);
}

export async function syncNotifications(): Promise<{
	created: number;
}> {
	return api<{ created: number }>("notifications/sync", {
		method: "POST",
	});
}

export async function markNotificationRead(
	notificationId: string,
	read: boolean
): Promise<void> {
	await api(`notifications/${notificationId}`, {
		method: "PATCH",
		body: JSON.stringify({ read }),
	});
}
