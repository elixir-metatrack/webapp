import Keycloak from "keycloak-js";

import { KEYCLOAK_URL } from "./config";

export const keycloak = new Keycloak({
	url: KEYCLOAK_URL,
	realm: "metatrack",
	clientId: "metatrack-spa",
});
