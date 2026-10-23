import { PROJECT_ROLES, type ProjectRole } from "#/lib/data/roles";
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
	role: ProjectRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
	const config = PROJECT_ROLES[role];

	return (
		<Badge variant="outline" className={config.color}>
			{config.label}
		</Badge>
	);
}
