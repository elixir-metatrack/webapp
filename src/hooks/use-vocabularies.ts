import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import type { Vocabulary } from "@/lib/types";

import {
	getGlobalAssayVocabularies,
	getGlobalSampleVocabularies,
	getSampleVocabularies,
} from "@/lib/api-keycloak";

import { createVocabularyMap, getVocabularyTerms } from "@/lib/vocabulary";

export function useVocabularies(
	dataType: "sample" | "assay",
	projectId?: string
) {
	const { data: globalVocabularies = [] } = useQuery<Vocabulary[]>({
		queryKey: ["global-vocabularies", dataType],
		queryFn: () =>
			dataType === "assay"
				? getGlobalAssayVocabularies()
				: getGlobalSampleVocabularies(),
	});

	const { data: projectVocabularies = [] } = useQuery<Vocabulary[]>({
		queryKey: ["sample-vocabularies", projectId],
		enabled: Boolean(projectId && dataType === "sample"),
		queryFn: () => getSampleVocabularies(projectId!),
	});

	const vocabularyMap = React.useMemo(
		() =>
			createVocabularyMap(
				globalVocabularies,
				dataType === "sample" ? projectVocabularies : []
			),
		[globalVocabularies, projectVocabularies, dataType]
	);

	const getTerms = React.useCallback(
		(fieldKey: string) => getVocabularyTerms(vocabularyMap, fieldKey),
		[vocabularyMap]
	);

	return {
		globalVocabularies,
		projectVocabularies,
		vocabularyMap,
		getTerms,
	};
}
