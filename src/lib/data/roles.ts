export const PROJECT_ROLES = {
	OWNER: {
		label: "Owner",
		color: "bg-amber-700 text-white border-amber-800 text-sm",
		description:
			"Has full control over the project, including project management and access permissions.",
	},
	ADMIN: {
		label: "Admin",
		color: "bg-purple-100 text-purple-800 border-purple-200 text-sm",
		description: "Can manage the project, its members, and project settings.",
	},
	EDITOR: {
		label: "Editor",
		color: "bg-blue-100 text-blue-800 border-blue-200 text-sm",
		description:
			"Can view and edit project data, including samples and assays.",
	},
	VIEWER: {
		label: "Viewer",
		color: "bg-slate-100 text-slate-700 border-slate-200 text-sm",
		description: "Can view project data but cannot make changes.",
	},
} as const;

export type ProjectRole = keyof typeof PROJECT_ROLES;

export const PROJECT_ROLE_OPTIONS = Object.entries(PROJECT_ROLES).map(
	([value, role]) => ({
		value: value as ProjectRole,
		label: role.label,
	})
);
