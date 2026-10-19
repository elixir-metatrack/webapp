import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	acceptProjectInvitation,
	declineProjectInvitation,
	getNotifications,
	markNotificationRead,
	syncNotifications,
} from "@/lib/api-keycloak";
import type { AppNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/projects/notifications")({
	component: NotificationsPage,
});

function NotificationsPage() {
	const queryClient = useQueryClient();
	const [syncReady, setSyncReady] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	// Synchronize invitations before loading the inbox.
	useEffect(() => {
		let active = true;

		syncNotifications()
			.catch(() => {
				// Still try to load existing notifications if sync fails.
			})
			.finally(() => {
				if (active) setSyncReady(true);
			});

		return () => {
			active = false;
		};
	}, []);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => getNotifications(0, 20),
		enabled: syncReady,
	});

	const refreshNotifications = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["notifications"],
		});
	};

	const invitationMutation = useMutation({
		mutationFn: async ({
			notification,
			decision,
		}: {
			notification: AppNotification;
			decision: "accept" | "decline";
		}) => {
			const invitationId = notification.invitation?.id;

			if (!invitationId) {
				throw new Error("This notification has no invitation.");
			}

			if (decision === "accept") {
				await acceptProjectInvitation(invitationId);
			} else {
				await declineProjectInvitation(invitationId);
			}
		},
		onSuccess: async () => {
			setActionError(null);
			await Promise.all([
				refreshNotifications(),
				queryClient.invalidateQueries({ queryKey: ["projects"] }),
				queryClient.invalidateQueries({ queryKey: ["projectMembers"] }),
			]);
		},
		onError: (err) => {
			setActionError(
				err instanceof Error ? err.message : "Could not process the invitation."
			);
		},
	});

	const markReadMutation = useMutation({
		mutationFn: ({
			notificationId,
			read,
		}: {
			notificationId: string;
			read: boolean;
		}) => markNotificationRead(notificationId, read),
		onSuccess: refreshNotifications,
		onError: (err) => {
			setActionError(
				err instanceof Error
					? err.message
					: "Could not update the notification."
			);
		},
	});

	const notifications = data?.items ?? [];

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div>
				<h1 className="text-2xl font-semibold">Notifications</h1>
				<p className="text-muted-foreground">
					Project invitations and other updates.
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Badge variant="secondary">{data?.unreadCount ?? 0} unread</Badge>
			</div>

			{actionError && (
				<p role="alert" className="text-destructive text-sm">
					{actionError}
				</p>
			)}

			{(isLoading || !syncReady) && (
				<p className="text-muted-foreground">Loading notifications...</p>
			)}

			{isError && (
				<p role="alert" className="text-destructive text-sm">
					{error instanceof Error
						? error.message
						: "Could not load notifications."}
				</p>
			)}

			{syncReady && !isLoading && !isError && notifications.length === 0 && (
				<Card>
					<CardContent className="text-muted-foreground py-8 text-center">
						You have no notifications.
					</CardContent>
				</Card>
			)}

			<div className="space-y-4">
				{notifications.map((notification) => {
					const invitation = notification.invitation;
					const actionable =
						notification.type === "PROJECT_INVITATION" &&
						invitation?.actionable === true &&
						invitation.status === "PENDING";

					const busy =
						invitationMutation.isPending || markReadMutation.isPending;

					return (
						<Card key={notification.id}>
							<CardHeader>
								<div className="flex flex-wrap items-start justify-between gap-2">
									<CardTitle className="text-base">
										{notification.title}
									</CardTitle>

									{!notification.readOn && (
										<Badge variant="default">Unread</Badge>
									)}
								</div>

								<CardDescription>
									{new Date(notification.createdOn).toLocaleString()}
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-4">
								<p className="text-sm">{notification.content}</p>

								{invitation && (
									<div className="rounded-md border p-3 text-sm">
										<p>
											<span className="font-medium">Project ID:</span>{" "}
											{invitation.projectId}
										</p>
										<p>
											<span className="font-medium">Role:</span>{" "}
											{invitation.role}
										</p>
										<p>
											<span className="font-medium">Status:</span>{" "}
											{invitation.status}
										</p>
										<p>
											<span className="font-medium">Expires:</span>{" "}
											{new Date(invitation.expiresOn).toLocaleDateString()}
										</p>
									</div>
								)}

								<div className="flex flex-wrap gap-2">
									{actionable && (
										<>
											<Button
												disabled={busy}
												onClick={() =>
													invitationMutation.mutate({
														notification,
														decision: "accept",
													})
												}
											>
												Accept invitation
											</Button>

											<Button
												variant="outline"
												disabled={busy}
												onClick={() =>
													invitationMutation.mutate({
														notification,
														decision: "decline",
													})
												}
											>
												Decline
											</Button>
										</>
									)}

									{!notification.readOn && (
										<Button
											variant="ghost"
											disabled={busy}
											onClick={() =>
												markReadMutation.mutate({
													notificationId: notification.id,
													read: true,
												})
											}
										>
											Mark as read
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{data && data.total > notifications.length && (
				<p className="text-muted-foreground text-sm">
					Showing {notifications.length} of {data.total} notifications.
					Pagination can be added to load older notifications.
				</p>
			)}
		</div>
	);
}
