import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type RowData } from "@tanstack/react-table";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const QUICK_EDIT_LIMIT = 4;
export const NON_EDITABLE_COLUMNS = [
	"name",
	"taxonName",
	"hostTaxonName",
	"alias",
	"createdOn",
	"modifiedOn",
	"files",
	"id",
	"actions",
	"customMetadata",
];
export const NON_VIEWED_COLUMNS = ["id", "lastUpdatedOn", "alias"];

export const SAMPLE_NUMBER_FIELDS = new Set([
	"taxId",
	"hostTaxId",
	"latitude",
	"longitude",
]);

export const ASSAY_NUMBER_FIELDS = new Set(["insertSize"]);

export const DATE_FIELDS = new Set([
	"collectionDate",
	"createdOn",
	"modifiedOn",
]);

export const SAMPLE_COLUMN_ORDER = [
	"name",
	"projectTitle",
	"description",
	"taxId",
	"taxonName",
	"isolationSource",
	"collectionDate",
	"location",
	"hostHealthState",
	"hostTaxId",
	"hostTaxonName",
	"isolate",
	"collectedBy",
	"latitude",
	"longitude",
	"environmentalSample",
	"hostAssociated",
	"hostCommonName",
	"hostSubjectId",
	"collectorName",
	"collectingInstitution",
	"hostSex",
	"influenzaTestMethod",
	"influenzaTestResult",
	"otherPathogensTested",
	"otherPathogensTestResult",
	"hostHabitat",
	"isolationSourceHostAssociated",
	"hostBehaviour",
	"isolationSourceNonHostAssociated",
	"influenzaVirusType",
	"influenzaSubType",
	"serovar",
	"strain",
	"hostAge",
	"county",
	"commune",
	"hospitalHealthInstitution",
	"mlst",
	"alias",
	"sequencingLab",
	"institution",
	"createdOn",
	"modifiedOn",
	"lastUpdatedOn",
] as const;

// Empty means use the order in which assay fields are received.
export const ASSAY_COLUMN_ORDER: string[] = [];

export function getColumnOrder(
	dataType: "sample" | "assay"
): readonly string[] {
	return dataType === "sample" ? SAMPLE_COLUMN_ORDER : ASSAY_COLUMN_ORDER;
}

declare module "@tanstack/react-table" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		label?: string;
	}
}

export function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [
			key,
			value === "" || value === undefined ? null : value,
		])
	) as T;
}

export const seo = ({
	title,
	description,
	keywords,
	image,
}: {
	title: string;
	description?: string;
	image?: string;
	keywords?: string;
}) => {
	const tags = [
		{ title },
		{ name: "description", content: description },
		{ name: "keywords", content: keywords },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:creator", content: "@tannerlinsley" },
		{ name: "twitter:site", content: "@tannerlinsley" },
		{ name: "og:type", content: "website" },
		{ name: "og:title", content: title },
		{ name: "og:description", content: description },
		...(image
			? [
					{ name: "twitter:image", content: image },
					{ name: "twitter:card", content: "summary_large_image" },
					{ name: "og:image", content: image },
				]
			: []),
	];

	return tags;
};

export function getApiErrorMessage(data: unknown): string {
	if (Array.isArray(data)) {
		const messages = data
			.map((error) => {
				if (error && typeof error === "object" && "message" in error) {
					const item = error as {
						sample?: string;
						fieldKey?: string;
						message?: string;
					};

					if (item.sample && item.fieldKey && item.message) {
						return `${item.sample} - ${item.fieldKey}: ${item.message}`;
					}

					return item.message;
				}

				return null;
			})
			.filter(Boolean);

		if (messages.length > 0) {
			return messages.join("\n");
		}
	}

	if (data && typeof data === "object") {
		const error = data as {
			message?: string;
			details?: string;
			title?: string;
			violations?: Array<{
				field?: string;
				message?: string;
			}>;
		};

		// Bean Validation / Constraint Violation
		if (Array.isArray(error.violations) && error.violations.length > 0) {
			const messages = error.violations
				.map((violation) => {
					if (violation.field && violation.message) {
						return `${violation.field}: ${violation.message}`;
					}

					return violation.message;
				})
				.filter(Boolean);

			if (messages.length > 0) {
				return messages.join("\n");
			}
		}

		// Erro comum
		if (error.message) {
			return error.message;
		}

		if (error.details) {
			return error.details;
		}

		if (error.title) {
			return error.title;
		}
	}

	return "API error";
}
