import JSZip from "jszip";

export const MAIN_NS =
	"http://schemas.openxmlformats.org/spreadsheetml/2006/main";

export const REL_NS =
	"http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export const PACKAGE_REL_NS =
	"http://schemas.openxmlformats.org/package/2006/relationships";

export const FIELD_ALIASES: Record<string, string> = {
	location: "geographic_location",
	instrument_model: "sequencing_instrument",
};

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function normalizeHeader(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

export function parseXml(xml: string): Document {
	const document = new DOMParser().parseFromString(xml, "application/xml");

	if (document.querySelector("parsererror")) {
		throw new Error("Invalid XML in Excel template");
	}

	return document;
}

export function getSharedStrings(xml: string): string[] {
	const document = parseXml(xml);

	return Array.from(document.getElementsByTagNameNS(MAIN_NS, "si")).map(
		(item) =>
			Array.from(item.getElementsByTagNameNS(MAIN_NS, "t"))
				.map((text) => text.textContent ?? "")
				.join("")
	);
}

export function getWorksheetHeaders(
	xml: string,
	sharedStrings: string[],
	headerRow = 2
): Map<string, string> {
	const document = parseXml(xml);
	const headers = new Map<string, string>();

	const rows = Array.from(document.getElementsByTagNameNS(MAIN_NS, "row"));

	const row = rows.find((item) => item.getAttribute("r") === String(headerRow));

	if (!row) {
		throw new Error(`Header row ${headerRow} not found`);
	}

	const cells = Array.from(row.getElementsByTagNameNS(MAIN_NS, "c"));

	for (const cell of cells) {
		const reference = cell.getAttribute("r") ?? "";
		const column = reference.match(/^[A-Z]+/)?.[0];

		if (!column) continue;

		const type = cell.getAttribute("t");

		const value =
			type === "inlineStr"
				? (cell.getElementsByTagNameNS(MAIN_NS, "t")[0]?.textContent ?? "")
				: (cell.getElementsByTagNameNS(MAIN_NS, "v")[0]?.textContent ?? "");

		const header = type === "s" ? (sharedStrings[Number(value)] ?? "") : value;

		headers.set(normalizeHeader(header), column);
	}

	return headers;
}

export function getWorksheetPath(
	workbookXml: string,
	relationshipsXml: string,
	sheetName: string
): string | null {
	const workbook = parseXml(workbookXml);
	const relationships = parseXml(relationshipsXml);

	const sheet = Array.from(
		workbook.getElementsByTagNameNS(MAIN_NS, "sheet")
	).find((item) => item.getAttribute("name") === sheetName);

	if (!sheet) return null;

	const relationshipId = sheet.getAttributeNS(REL_NS, "id");

	const relationship = Array.from(
		relationships.getElementsByTagNameNS(PACKAGE_REL_NS, "Relationship")
	).find((item) => item.getAttribute("Id") === relationshipId);

	const target = relationship?.getAttribute("Target");

	if (!target) {
		throw new Error(`Relationship missing for ${sheetName}`);
	}

	const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;

	const segments: string[] = [];

	for (const segment of path.split("/")) {
		if (segment === "..") {
			segments.pop();
		} else if (segment && segment !== ".") {
			segments.push(segment);
		}
	}

	return segments.join("/");
}

export function insertBefore(
	xml: string,
	closingTag: string,
	content: string
): string {
	if (!xml.includes(closingTag)) {
		throw new Error(`Missing XML tag: ${closingTag}`);
	}

	return xml.replace(closingTag, `${content}${closingTag}`);
}

export function addValidations(xml: string, validations: string[]): string {
	if (!validations.length) return xml;

	const existing = xml.match(
		/<dataValidations\b[^>]*>([\s\S]*?)<\/dataValidations>/
	);

	if (existing) {
		const oldCount = (existing[1].match(/<dataValidation\b/g) ?? []).length;

		return xml.replace(
			existing[0],
			`<dataValidations count="${oldCount + validations.length}">` +
				existing[1] +
				validations.join("") +
				`</dataValidations>`
		);
	}

	const block =
		`<dataValidations count="${validations.length}">` +
		validations.join("") +
		`</dataValidations>`;

	if (xml.includes("<pageMargins")) {
		return xml.replace("<pageMargins", `${block}<pageMargins`);
	}

	return insertBefore(xml, "</worksheet>", block);
}

export function addDefinedNames(xml: string, names: string[]): string {
	if (!names.length) return xml;

	const existing = xml.match(/<definedNames\b[^>]*>([\s\S]*?)<\/definedNames>/);

	if (existing) {
		return xml.replace(
			existing[0],
			`<definedNames>${existing[1]}${names.join("")}</definedNames>`
		);
	}

	const block = `<definedNames>${names.join("")}</definedNames>`;

	return xml.replace("</sheets>", `</sheets>${block}`);
}

export async function ensureVocabularySheet(
	zip: JSZip,
	workbookXml: string,
	relationshipsXml: string
): Promise<{
	workbookXml: string;
	relationshipsXml: string;
	vocabularyPath: string;
}> {
	const existingPath = getWorksheetPath(
		workbookXml,
		relationshipsXml,
		"Vocabularies"
	);

	if (existingPath) {
		return {
			workbookXml,
			relationshipsXml,
			vocabularyPath: existingPath,
		};
	}

	const workbook = parseXml(workbookXml);

	const sheets = Array.from(workbook.getElementsByTagNameNS(MAIN_NS, "sheet"));

	const nextSheetId =
		Math.max(
			0,
			...sheets.map((sheet) => Number(sheet.getAttribute("sheetId") ?? 0))
		) + 1;

	const relationships = parseXml(relationshipsXml);

	const usedIds = new Set(
		Array.from(
			relationships.getElementsByTagNameNS(PACKAGE_REL_NS, "Relationship")
		).map((item) => item.getAttribute("Id"))
	);

	let relationshipNumber = 1;

	while (usedIds.has(`rId${relationshipNumber}`)) {
		relationshipNumber++;
	}

	const relationshipId = `rId${relationshipNumber}`;

	let sheetNumber = 1;
	let vocabularyPath = "";

	do {
		vocabularyPath = `xl/worksheets/sheet${sheetNumber}.xml`;
		sheetNumber++;
	} while (zip.file(vocabularyPath));

	workbookXml = workbookXml.replace(
		"</sheets>",
		`<sheet name="Vocabularies" sheetId="${nextSheetId}" r:id="${relationshipId}"/></sheets>`
	);

	relationshipsXml = relationshipsXml.replace(
		"</Relationships>",
		`<Relationship Id="${relationshipId}" ` +
			`Type="${REL_NS}/worksheet" ` +
			`Target="worksheets/sheet${sheetNumber - 1}.xml"/>` +
			`</Relationships>`
	);

	const contentTypesFile = zip.file("[Content_Types].xml");

	if (!contentTypesFile) {
		throw new Error("Missing Content_Types.xml");
	}

	let contentTypesXml = await contentTypesFile.async("string");

	contentTypesXml = contentTypesXml.replace(
		"</Types>",
		`<Override PartName="/${vocabularyPath}" ` +
			`ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
			`</Types>`
	);

	zip.file("[Content_Types].xml", contentTypesXml);

	zip.file(
		vocabularyPath,
		`<?xml version="1.0" encoding="UTF-8"?>` +
			`<worksheet xmlns="${MAIN_NS}">` +
			`<dimension ref="A1:B1"/>` +
			`<sheetViews><sheetView workbookViewId="0"/></sheetViews>` +
			`<sheetFormatPr defaultRowHeight="15"/>` +
			`<cols>` +
			`<col min="1" max="1" width="36" customWidth="1"/>` +
			`<col min="2" max="2" width="42" customWidth="1"/>` +
			`</cols>` +
			`<sheetData/>` +
			`</worksheet>`
	);

	return {
		workbookXml,
		relationshipsXml,
		vocabularyPath,
	};
}

const XLSX_MIME =
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const CONTENT_TYPES_NS =
	"http://schemas.openxmlformats.org/package/2006/content-types";

function serializeXml(document: Document): string {
	return new XMLSerializer().serializeToString(document);
}

function removeVocabularyDefinedNames(workbook: Document): Set<string> {
	const removedNames = new Set<string>();

	const definedNames = Array.from(
		workbook.getElementsByTagNameNS(MAIN_NS, "definedName")
	);

	for (const definedName of definedNames) {
		const name = definedName.getAttribute("name");

		if (!name?.startsWith("vocab_")) continue;

		removedNames.add(name);
		definedName.parentNode?.removeChild(definedName);
	}

	const container = workbook.getElementsByTagNameNS(MAIN_NS, "definedNames")[0];

	if (container && container.children.length === 0) {
		container.parentNode?.removeChild(container);
	}

	return removedNames;
}

function removeVocabularyValidations(
	worksheetXml: string,
	removedNames: Set<string>
): string {
	const document = parseXml(worksheetXml);

	const containers = Array.from(
		document.getElementsByTagNameNS(MAIN_NS, "dataValidations")
	);

	for (const container of containers) {
		const validations = Array.from(
			container.getElementsByTagNameNS(MAIN_NS, "dataValidation")
		);

		for (const validation of validations) {
			if (validation.getAttribute("type") !== "list") {
				continue;
			}

			const formula = validation
				.getElementsByTagNameNS(MAIN_NS, "formula1")[0]
				?.textContent?.trim();

			if (!formula) continue;

			const rangeName = formula.replace(/^=/, "");

			if (removedNames.has(rangeName) || rangeName.startsWith("vocab_")) {
				validation.parentNode?.removeChild(validation);
			}
		}

		const remaining = container.getElementsByTagNameNS(
			MAIN_NS,
			"dataValidation"
		).length;

		if (remaining === 0) {
			container.parentNode?.removeChild(container);
		} else {
			container.setAttribute("count", String(remaining));
		}
	}

	return serializeXml(document);
}

export async function prepareExcelForUpload(file: File): Promise<File> {
	// CSV and other file formats remain unchanged.
	if (!file.name.toLowerCase().endsWith(".xlsx")) {
		return file;
	}

	const zip = await JSZip.loadAsync(file);

	const workbookFile = zip.file("xl/workbook.xml");
	const relationshipsFile = zip.file("xl/_rels/workbook.xml.rels");

	if (!workbookFile || !relationshipsFile) {
		throw new Error("Invalid Excel workbook structure");
	}

	const workbookXml = await workbookFile.async("string");
	const relationshipsXml = await relationshipsFile.async("string");

	const vocabularyPath = getWorksheetPath(
		workbookXml,
		relationshipsXml,
		"Vocabularies"
	);

	// No extra worksheet: send the original file.
	if (!vocabularyPath) {
		return file;
	}

	const workbook = parseXml(workbookXml);
	const relationships = parseXml(relationshipsXml);

	const vocabularySheet = Array.from(
		workbook.getElementsByTagNameNS(MAIN_NS, "sheet")
	).find((sheet) => sheet.getAttribute("name") === "Vocabularies");

	if (!vocabularySheet) {
		return file;
	}

	const relationshipId = vocabularySheet.getAttributeNS(REL_NS, "id");

	if (!relationshipId) {
		throw new Error("Vocabulary relationship ID not found");
	}

	const relationship = Array.from(
		relationships.getElementsByTagNameNS(PACKAGE_REL_NS, "Relationship")
	).find((item) => item.getAttribute("Id") === relationshipId);

	if (!relationship) {
		throw new Error("Vocabulary relationship not found");
	}

	// 1. Remove the worksheet declaration.
	vocabularySheet.parentNode?.removeChild(vocabularySheet);

	// 2. Remove its workbook relationship.
	relationship.parentNode?.removeChild(relationship);

	// 3. Remove vocabulary-specific named ranges.
	const removedNames = removeVocabularyDefinedNames(workbook);

	// 4. Remove dropdowns referencing those named ranges.
	const mainSheetName = Array.from(
		workbook.getElementsByTagNameNS(MAIN_NS, "sheet")
	).some((sheet) => sheet.getAttribute("name") === "Samples")
		? "Samples"
		: "Experiments";

	const mainPath = getWorksheetPath(
		serializeXml(workbook),
		serializeXml(relationships),
		mainSheetName
	);

	if (!mainPath) {
		throw new Error(`Main worksheet "${mainSheetName}" not found`);
	}

	const mainFile = zip.file(mainPath);

	if (!mainFile) {
		throw new Error("Main worksheet file not found");
	}

	const mainXml = await mainFile.async("string");

	zip.file(mainPath, removeVocabularyValidations(mainXml, removedNames));

	// 5. Remove the vocabulary worksheet XML.
	zip.remove(vocabularyPath);

	// Remove worksheet-specific relationships if present.
	const vocabularyFilename = vocabularyPath.split("/").pop();

	if (vocabularyFilename) {
		const worksheetDirectory = vocabularyPath.slice(
			0,
			vocabularyPath.lastIndexOf("/")
		);

		zip.remove(`${worksheetDirectory}/_rels/${vocabularyFilename}.rels`);
	}

	// 6. Remove its Content Types entry.
	const contentTypesFile = zip.file("[Content_Types].xml");

	if (!contentTypesFile) {
		throw new Error("Missing Content_Types.xml");
	}

	const contentTypes = parseXml(await contentTypesFile.async("string"));

	const overrides = Array.from(
		contentTypes.getElementsByTagNameNS(CONTENT_TYPES_NS, "Override")
	);

	for (const override of overrides) {
		if (override.getAttribute("PartName") === `/${vocabularyPath}`) {
			override.parentNode?.removeChild(override);
		}
	}

	zip.file("[Content_Types].xml", serializeXml(contentTypes));

	// 7. Save the updated workbook and relationships.
	zip.file("xl/workbook.xml", serializeXml(workbook));

	zip.file("xl/_rels/workbook.xml.rels", serializeXml(relationships));

	const blob = await zip.generateAsync({
		type: "blob",
		compression: "DEFLATE",
		mimeType: XLSX_MIME,
	});

	return new File([blob], file.name, {
		type: XLSX_MIME,
		lastModified: file.lastModified,
	});
}
