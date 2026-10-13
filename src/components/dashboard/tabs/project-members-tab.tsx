import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addProjectMember,
	getAllProjectMembers,
	getProjectInvitations,
	inviteProjectMember,
	removeProjectMember,
	resendProjectInvitation,
	revokeProjectInvitation,
	updateProjectMember,
} from "@/lib/api-keycloak";
import type {
	InvitationRole,
	Member,
	Project,
	ProjectInvitation,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
	ChevronLeft,
	ChevronRight,
	Mail,
	MoreVertical,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { toastError, toastSuccess } from "#/lib/toast";

export function ProjectMembersTab({ project }: { project: Project }) {
	const queryClient = useQueryClient();

	const [openAdd, setOpenAdd] = useState(false);
	const [openInvite, setOpenInvite] = useState(false);

	const [memberId, setMemberId] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("MEMBER");
	const [editingMember, setEditingMember] = useState<Member | null>(null);
	const [removingMember, setRemovingMember] = useState<Member | null>(null);
	const [editRole, setEditRole] = useState("");

	const [invitationPage, setInvitationPage] = useState(0);
	const invitationPageSize = 10;

	const {
		data: invitationsPage,
		isPending: invitationsLoading,
		isError: invitationsError,
		refetch: refetchInvitations,
	} = useQuery({
		queryKey: [
			"projectInvitations",
			project.id,
			invitationPage,
			invitationPageSize,
		],
		queryFn: () =>
			getProjectInvitations(project.id!, invitationPage, invitationPageSize),
		enabled: !!project.id,
	});

	console.log("invitationsPage", invitationsPage);
	const invitations = invitationsPage ?? [];
	console.log("invitations", invitations);

	const pendingInvitations = invitations.filter(
		(invitation) => invitation.status === "PENDING"
	);

	/* ------------------ GET MEMBERS ------------------ */

	const { data: members = [] } = useQuery({
		queryKey: ["projectMembers", project.id],
		queryFn: () => getAllProjectMembers(project.id!),
	});

	/* ------------------ ADD MEMBER ------------------ */

	const addMutation = useMutation({
		mutationFn: () => addProjectMember(project.id!, memberId, role),
		onSuccess: () => {
			toastSuccess("Member added");
			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});
			setOpenAdd(false);
			setMemberId("");
		},
		onError: (err: unknown) =>
			toastError((err as Error)?.message || "Error adding member"),
	});

	const updateRoleMutation = useMutation({
		mutationFn: () => {
			if (!editingMember) throw new Error("No member selected");
			return updateProjectMember(project.id!, editingMember.memberId, editRole);
		},

		onSuccess: () => {
			toastSuccess("Role updated");

			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});

			setEditingMember(null);
		},

		onError: (err: unknown) =>
			toastError((err as Error)?.message || "Error updating role"),
	});

	const removeMutation = useMutation({
		mutationFn: () => {
			if (!removingMember) throw new Error("No member selected");
			return removeProjectMember(project.id!, removingMember.memberId);
		},

		onSuccess: () => {
			toastSuccess("Member removed");

			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});

			setRemovingMember(null);
		},

		onError: (err: unknown) =>
			toastError((err as Error)?.message || "Error removing member"),
	});

	const [inviteRole, setInviteRole] = useState<InvitationRole>("VIEWER");

	const [createdInvitation, setCreatedInvitation] =
		useState<ProjectInvitation | null>(null);

	const inviteMutation = useMutation({
		mutationFn: () =>
			inviteProjectMember(project.id!, email.trim(), inviteRole),

		onSuccess: (invitation) => {
			setCreatedInvitation(invitation);
			setEmail("");

			toastSuccess(
				"Invitation created. Delivery status: " + invitation.deliveryStatus
			);

			queryClient.invalidateQueries({
				queryKey: ["projectInvitations", project.id],
			});
		},

		onError: (err: unknown) => {
			toastError((err as Error)?.message || "Error creating invitation");
		},
	});

	const resendMutation = useMutation({
		mutationFn: () => {
			if (!createdInvitation) {
				throw new Error("No invitation selected");
			}

			return resendProjectInvitation(project.id!, createdInvitation.id);
		},

		onSuccess: (invitation) => {
			setCreatedInvitation(invitation);

			toastSuccess("Delivery attempt completed: " + invitation.deliveryStatus);

			queryClient.invalidateQueries({
				queryKey: ["projectInvitations", project.id],
			});
		},

		onError: (err: unknown) => {
			toastError((err as Error)?.message || "Error resending invitation");
		},
	});

	const resendInvitationMutation = useMutation({
		mutationFn: (invitationId: string) =>
			resendProjectInvitation(project.id!, invitationId),

		onSuccess: async (updatedInvitation) => {
			toastSuccess(`Delivery status: ${updatedInvitation.deliveryStatus}`);

			await queryClient.invalidateQueries({
				queryKey: ["projectInvitations", project.id],
			});
		},

		onError: (err: unknown) => {
			toastError((err as Error)?.message || "Error resending invitation");
		},
	});

	const [invitationToRevoke, setInvitationToRevoke] =
		useState<ProjectInvitation | null>(null);

	const revokeInvitationMutation = useMutation({
		mutationFn: (invitationId: string) =>
			revokeProjectInvitation(project.id!, invitationId),

		onSuccess: async () => {
			toastSuccess("Invitation cancelled");

			setInvitationToRevoke(null);

			setInvitationPage(0);

			await queryClient.invalidateQueries({
				queryKey: ["projectInvitations", project.id],
			});
		},

		onError: (err: unknown) => {
			toastError((err as Error)?.message || "Error cancelling invitation");
		},
	});

	const canResendInvitation = (invitation: ProjectInvitation) => {
		if (invitation.status !== "PENDING") return false;

		if (
			invitation.deliveryStatus === "SENDING" ||
			invitation.deliveryStatus === "SENT"
		) {
			return false;
		}

		if (!invitation.deliveryRetryAfter) return true;

		return new Date(invitation.deliveryRetryAfter).getTime() <= Date.now();
	};

	return (
		<div className="space-y-4">
			{/* MEMBER LIST */}
			<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
				<div className="min-w-0 space-y-4">
					<div>
						<h3 className="font-semibold">Members</h3>
						<p className="text-muted-foreground text-sm">
							Manage project members.
						</p>
					</div>
					{members.length === 0 ? (
						<p className="text-muted-foreground text-sm">No members yet</p>
					) : (
						members.map((member: Member) => (
							<div
								key={member.memberId}
								className="flex items-center justify-between rounded-md border p-3"
							>
								<div>
									<p className="text-sm font-medium">
										{member.email ?? member.memberId}
									</p>

									<Badge
										variant={member.role === "OWNER" ? "default" : "secondary"}
									>
										{member.role}
									</Badge>
								</div>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => {
												setEditingMember(member);
												setEditRole(member.role);
											}}
										>
											Edit role
										</DropdownMenuItem>

										<DropdownMenuItem
											className="text-red-500 focus:text-red-500"
											onClick={() => setRemovingMember(member)}
										>
											Remove member
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))
					)}

					{/* ACTION BUTTONS */}

					<div className="flex gap-2">
						{/* ADD MEMBER */}

						<Dialog open={openAdd} onOpenChange={setOpenAdd}>
							<DialogTrigger asChild>
								<Button>Add member</Button>
							</DialogTrigger>

							<DialogContent aria-describedby={undefined}>
								<DialogHeader>
									<DialogTitle>Add Project Member</DialogTitle>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-sm font-medium">User ID</label>
										<Input
											placeholder="user ID"
											value={memberId}
											onChange={(e) => setMemberId(e.target.value)}
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">Role</label>

										<Select value={role} onValueChange={setRole}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>

											<SelectContent>
												<SelectItem value="OWNER">OWNER</SelectItem>
												<SelectItem value="ADMIN">ADMIN</SelectItem>
												<SelectItem value="EDITOR">EDITOR</SelectItem>
												<SelectItem value="VIEWER">VIEWER</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<DialogFooter>
									<Button
										onClick={() => addMutation.mutate()}
										disabled={!memberId || addMutation.isPending}
									>
										Add member
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* INVITE MEMBER */}

						<Dialog open={openInvite} onOpenChange={setOpenInvite}>
							<DialogTrigger asChild>
								<Button variant="secondary">Invite by email</Button>
							</DialogTrigger>

							<DialogContent aria-describedby={undefined}>
								<DialogHeader>
									<DialogTitle>Invite Member by Email</DialogTitle>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<label
											htmlFor="invite-email"
											className="text-sm font-medium"
										>
											Email
										</label>

										<Input
											id="invite-email"
											type="email"
											placeholder="user@example.org"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium">Role</label>

										<Select
											value={inviteRole}
											onValueChange={(value) =>
												setInviteRole(value as InvitationRole)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>

											<SelectContent>
												<SelectItem value="VIEWER">VIEWER</SelectItem>
												<SelectItem value="EDITOR">EDITOR</SelectItem>
												<SelectItem value="ADMIN">ADMIN</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<p className="text-muted-foreground text-sm">
										The recipient must accept the invitation before becoming a
										project member.
									</p>

									{createdInvitation && (
										<div className="space-y-2 rounded-md border p-3">
											<p className="text-sm font-medium">
												Invitation status: {createdInvitation.status}
											</p>

											<p className="text-muted-foreground text-sm">
												Delivery status: {createdInvitation.deliveryStatus}
											</p>

											{createdInvitation.deliveryStatus === "SENT" && (
												<p className="text-sm">
													The email server accepted the message. This does not
													guarantee inbox delivery.
												</p>
											)}

											{["FAILED", "UNKNOWN", "NOT_ATTEMPTED"].includes(
												createdInvitation.deliveryStatus
											) && (
												<p className="text-muted-foreground text-sm">
													Email delivery was not confirmed. You can retry
													without creating another invitation.
												</p>
											)}

											{createdInvitation.deliveryRetryAfter &&
												new Date(
													createdInvitation.deliveryRetryAfter
												).getTime() > Date.now() && (
													<p className="text-muted-foreground text-sm">
														Retry available after{" "}
														{new Date(
															createdInvitation.deliveryRetryAfter
														).toLocaleString()}
													</p>
												)}

											{createdInvitation.status === "PENDING" &&
												["FAILED", "UNKNOWN", "NOT_ATTEMPTED"].includes(
													createdInvitation.deliveryStatus
												) && (
													<Button
														variant="outline"
														className="w-full"
														disabled={
															resendMutation.isPending ||
															!!(
																createdInvitation.deliveryRetryAfter &&
																new Date(
																	createdInvitation.deliveryRetryAfter
																).getTime() > Date.now()
															)
														}
														onClick={() => resendMutation.mutate()}
													>
														{resendMutation.isPending
															? "Retrying..."
															: "Resend invitation email"}
													</Button>
												)}
										</div>
									)}
								</div>

								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setOpenInvite(false)}
									>
										Close
									</Button>

									<Button
										disabled={
											!email.trim() ||
											!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
											inviteMutation.isPending
										}
										onClick={() => inviteMutation.mutate()}
									>
										{inviteMutation.isPending
											? "Sending..."
											: "Send invitation"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<Dialog
							open={!!editingMember}
							onOpenChange={() => setEditingMember(null)}
						>
							<DialogContent aria-describedby={undefined}>
								<DialogHeader>
									<DialogTitle>Edit Member Role</DialogTitle>
								</DialogHeader>

								<div className="space-y-4">
									<p className="text-muted-foreground text-sm">
										{editingMember?.email ?? editingMember?.memberId}
									</p>

									<Select value={editRole} onValueChange={setEditRole}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>

										<SelectContent>
											<SelectItem value="OWNER">OWNER</SelectItem>
											<SelectItem value="ADMIN">ADMIN</SelectItem>
											<SelectItem value="EDITOR">EDITOR</SelectItem>
											<SelectItem value="VIEWER">VIEWER</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<DialogFooter>
									<Button
										onClick={() => updateRoleMutation.mutate()}
										disabled={updateRoleMutation.isPending}
									>
										Update role
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* PENDING INVITATIONS */}
				<div className="min-w-0 space-y-3">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold">Pending invitations</h3>
								<p className="text-muted-foreground text-sm">
									Manage invitations that have not been decided yet.
								</p>
							</div>

							<Button
								variant="outline"
								size="icon"
								onClick={() => refetchInvitations()}
								disabled={invitationsLoading}
								title="Refresh invitations"
							>
								<RefreshCw
									className={`h-4 w-4 ${invitationsLoading ? "animate-spin" : ""}`}
								/>
							</Button>
						</div>

						{invitationsLoading ? (
							<p className="text-muted-foreground text-sm">
								Loading invitations...
							</p>
						) : invitationsError ? (
							<div className="space-y-2">
								<p className="text-destructive text-sm">
									Could not load invitations.
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => refetchInvitations()}
								>
									Try again
								</Button>
							</div>
						) : pendingInvitations.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No pending invitations on this page.
							</p>
						) : (
							<div className="space-y-2">
								{pendingInvitations.map((invitation) => (
									<div
										key={invitation.id}
										className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="min-w-0 space-y-1">
											<div className="flex items-center gap-2">
												<Mail className="text-muted-foreground h-4 w-4 shrink-0" />
												<p className="text-sm font-medium break-all">
													{invitation.recipientEmail}
												</p>
											</div>

											<div className="flex flex-col items-start gap-2 text-sm">
												<div className="flex items-center gap-2">
													<span>Role:</span>
													<Badge variant="secondary">{invitation.role}</Badge>
												</div>

												<div className="flex items-center gap-2">
													<span>Status:</span>
													<Badge
														variant={
															invitation.deliveryStatus === "SENT"
																? "default"
																: invitation.deliveryStatus === "FAILED"
																	? "destructive"
																	: "outline"
														}
													>
														{invitation.deliveryStatus}
													</Badge>
												</div>
											</div>

											<p className="text-muted-foreground text-xs">
												Expires:{" "}
												{new Date(invitation.expiresOn).toLocaleString()}
											</p>
										</div>

										<div className="flex shrink-0 gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={
													!canResendInvitation(invitation) ||
													resendInvitationMutation.isPending
												}
												onClick={() =>
													resendInvitationMutation.mutate(invitation.id)
												}
											>
												<RefreshCw className="mr-2 h-4 w-4" />
												Resend
											</Button>

											<Button
												variant="destructive"
												size="sm"
												disabled={revokeInvitationMutation.isPending}
												onClick={() => setInvitationToRevoke(invitation)}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Cancel
											</Button>
										</div>
									</div>
								))}
							</div>
						)}

						<div className="flex items-center justify-between">
							<p className="text-muted-foreground text-xs">
								Page {invitationPage + 1}
							</p>

							<div className="flex gap-2">
								<Button
									variant="outline"
									size="icon"
									disabled={invitationPage === 0 || invitationsLoading}
									onClick={() =>
										setInvitationPage((page) => Math.max(0, page - 1))
									}
									aria-label="Previous page"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>

								<Button
									variant="outline"
									size="icon"
									disabled={
										invitationsLoading ||
										invitations.length < invitationPageSize
									}
									onClick={() => setInvitationPage((page) => page + 1)}
									aria-label="Next page"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				<AlertDialog
					open={!!removingMember}
					onOpenChange={() => setRemovingMember(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Remove project member?</AlertDialogTitle>

							<AlertDialogDescription>
								This will remove{" "}
								<strong>
									{removingMember?.email ?? removingMember?.memberId}
								</strong>{" "}
								from the project.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>

							<AlertDialogAction
								onClick={() => removeMutation.mutate()}
								className="bg-red-600 hover:bg-red-700"
							>
								Remove member
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog
					open={!!invitationToRevoke}
					onOpenChange={(open) => {
						if (!open && !revokeInvitationMutation.isPending) {
							setInvitationToRevoke(null);
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Cancel invitation?</AlertDialogTitle>

							<AlertDialogDescription>
								This will revoke the pending invitation sent to{" "}
								<strong>{invitationToRevoke?.recipientEmail}</strong>. The
								recipient will no longer be able to accept it.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<AlertDialogFooter>
							<AlertDialogCancel disabled={revokeInvitationMutation.isPending}>
								Keep invitation
							</AlertDialogCancel>

							<AlertDialogAction
								className="bg-red-600 hover:bg-red-700"
								disabled={revokeInvitationMutation.isPending}
								onClick={(event) => {
									event.preventDefault();

									if (invitationToRevoke) {
										revokeInvitationMutation.mutate(invitationToRevoke.id);
									}
								}}
							>
								{revokeInvitationMutation.isPending
									? "Cancelling..."
									: "Cancel invitation"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
