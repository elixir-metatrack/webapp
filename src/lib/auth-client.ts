import { api } from "./api-keycloak";
import type { MeResponse } from "./types";

export interface UpdateMeRequest {
	firstName?: string | null;
	lastName?: string | null;
	country?: string | null;
	institution?: string | null;
	orcid?: string | null;
}

export function getMe(): Promise<MeResponse> {
	return api("whoami") as Promise<MeResponse>;
}

export function updateMe(data: UpdateMeRequest): Promise<MeResponse> {
	return api("whoami", {
		method: "PATCH",
		body: JSON.stringify(data),
	});
}
