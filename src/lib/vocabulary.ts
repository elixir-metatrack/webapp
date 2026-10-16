import type { Vocabulary } from "@/lib/types";

export function toVocabularyKey(field: string): string {
	return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function createVocabularyMap(
	globalVocabularies: Vocabulary[],
	projectVocabularies: Vocabulary[] = []
) {
	const map = new Map<string, string[]>();

	for (const vocabulary of globalVocabularies) {
		map.set(vocabulary.fieldKey, vocabulary.terms);
	}

	/*
	 * Project vocabulary overrides global vocabulary
	 * for Samples.
	 */
	for (const vocabulary of projectVocabularies) {
		map.set(vocabulary.fieldKey, vocabulary.terms);
	}

	return map;
}

export function getVocabularyTerms(
	vocabularyMap: Map<string, string[]>,
	fieldKey: string
): string[] {
	return vocabularyMap.get(toVocabularyKey(fieldKey)) ?? [];
}
