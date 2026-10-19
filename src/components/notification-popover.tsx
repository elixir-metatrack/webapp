import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronRight } from "lucide-react";
import { getNotifications } from "@/lib/api-keycloak";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface NotificationPopoverProps {
	isCollapsed: boolean;
}

export function NotificationPopover({ isCollapsed }: NotificationPopoverProps) {
	const [open, setOpen] = useState(false);
	const { data, isLoading, isError } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => getNotifications(0, 3),
	});

	const notifications = data?.items ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className={`-ml-1 h-8 w-full flex-none justify-start gap-2 px-2 font-normal hover:bg-neutral-300 ${
						isCollapsed ? "relative justify-center overflow-visible" : ""
					}`}
				>
					<Bell className="size-6 shrink-0" />

					{!isCollapsed && (
						<span className="flex-1 text-left">Notifications</span>
					)}

					<Badge
						variant={unreadCount === 0 ? "secondary" : "default"}
						className={
							isCollapsed
								? "border-sidebar absolute -top-1 -right-1 z-10 flex size-4 items-center justify-center rounded-full border-2 p-0 text-[10px]"
								: unreadCount > 0
									? "bg-chart-5 ml-auto"
									: "ml-auto"
						}
					>
						{unreadCount > 99 ? "99+" : unreadCount}
					</Badge>
				</Button>
			</PopoverTrigger>

			<PopoverContent align="start" side="right" className="w-[360px] p-0">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h4 className="font-semibold">Notifications</h4>
					<Badge variant="secondary">{unreadCount} unread</Badge>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground px-4 py-6 text-sm">
						Loading notifications...
					</p>
				) : isError ? (
					<p className="text-destructive px-4 py-6 text-sm">
						Could not load notifications.
					</p>
				) : notifications.length === 0 ? (
					<p className="text-muted-foreground px-4 py-6 text-center text-sm">
						You have no notifications.
					</p>
				) : (
					<div>
						{notifications.slice(0, 3).map((notification) => (
							<Link
								key={notification.id}
								to="/projects/notifications"
								className="hover:bg-muted/70 flex gap-3 border-b px-4 py-3 transition-colors"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-start gap-2">
										{!notification.readOn && (
											<span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
										)}

										<p className="truncate text-sm font-medium">
											{notification.title}
										</p>
									</div>

									<p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
										{notification.content}
									</p>

									<p className="text-muted-foreground mt-1 text-xs">
										{new Date(notification.createdOn).toLocaleString()}
									</p>
								</div>

								<ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0" />
							</Link>
						))}
					</div>
				)}

				<div className="p-2">
					<Button asChild variant="ghost" className="w-full justify-between">
						<Link to="/projects/notifications" onClick={() => setOpen(false)}>
							View all notifications
							<ChevronRight className="size-4" />
						</Link>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
