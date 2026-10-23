interface TableImportViolation {
	sample?: string;
	row?: string;
	field?: string;
	fieldKey?: string;
	message: string;
}

export class TableImportError extends Error {
	constructor(public readonly violations: TableImportViolation[]) {
		super(
			violations
				.map((error) =>
					[
						error.sample ?? error.row,
						error.fieldKey ?? error.field,
						error.message,
					]
						.filter(Boolean)
						.join(": ")
				)
				.join("\n")
		);
		this.name = "TableImportError";
	}
}

export function isTableImportViolations(
	value: unknown
): value is TableImportViolation[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every(
			(item: unknown) =>
				typeof item === "object" &&
				item !== null &&
				"message" in item &&
				typeof item.message === "string"
		)
	);
}

export const TABLE_FILE_ACCEPT = ".csv,.tsv,.txt,.xls,.xlsx";

export function isTableFile(file: File): boolean {
	return /\.(csv|tsv|txt|xls|xlsx)$/i.test(file.name);
}
