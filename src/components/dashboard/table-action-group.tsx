import type { ReactNode } from "react";

interface TableActionGroupProps {
	label: string;
	children: ReactNode;
}

export function TableActionGroup({ label, children }: TableActionGroupProps) {
	return (
		<div
			role="group"
			aria-label={label}
			className="flex min-w-0 flex-col gap-1.5"
		>
			<span className="text-muted-foreground text-xs font-medium">{label}</span>
			<div className="flex flex-wrap items-center gap-2">{children}</div>
		</div>
	);
}
