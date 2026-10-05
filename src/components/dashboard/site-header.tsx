import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Fragment } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-user";

interface BreadcrumbItemProps {
	label: string;
	href?: string;
}

interface SiteHeaderProps {
	items?: BreadcrumbItemProps[];
}
function AlertColors() {
	return (
		<Alert className="w-full border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
			<AlertTriangleIcon />
			<AlertTitle>You are logged in as an administrator.</AlertTitle>
			<AlertDescription>
				You have access to additional privileged features and administrative
				functions.
			</AlertDescription>
		</Alert>
	);
}

export function SiteHeader({ items = [] }: SiteHeaderProps) {
	const DefaultItems: BreadcrumbItemProps[] = [...items];

	const { data: user } = useUser();

	const isSystemAdmin = user?.roles?.includes("system-admin");

	return (
		<div>
			<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
				<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mx-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							{DefaultItems.map((item, i) => (
								<Fragment key={item.href ?? item.label}>
									<BreadcrumbItem>
										{item.href ? (
											<BreadcrumbLink href={item.href}>
												{item.label}
											</BreadcrumbLink>
										) : (
											<BreadcrumbPage>{item.label}</BreadcrumbPage>
										)}
									</BreadcrumbItem>
									{i < DefaultItems.length - 1 && <BreadcrumbSeparator />}
								</Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			{isSystemAdmin && <AlertColors />}
		</div>
	);
}
