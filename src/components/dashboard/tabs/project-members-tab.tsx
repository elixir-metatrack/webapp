import { useEffect, useState } from "react";
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
	searchRealmUsers,
	updateProjectMember,
} from "@/lib/api-keycloak";
import type {
	InvitationRole,
	Member,
	Project,
	ProjectInvitation,
	RealmUser,
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
	Info,
	Mail,
	MoreVertical,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { toastError, toastSuccess } from "#/lib/toast";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { PROJECT_ROLES } from "#/lib/data/roles";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { RoleBadge } from "#/components/role-badge";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "#/components/ui/combobox";

function InfoTooltip({ content }: { content: React.ReactNode }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground inline-flex items-center"
					aria-label="More information"
					tabIndex={-1}
				>
					<Info className="h-4 w-4" />
				</button>
			</TooltipTrigger>

			<TooltipContent className="max-w-xs">{content}</TooltipContent>
		</Tooltip>
	);
}

export function ProjectMembersTab({ project }: { project: Project }) {
	const queryClient = useQueryClient();

	const [openAdd, setOpenAdd] = useState(false);
	const [openInvite, setOpenInvite] = useState(false);
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("VIEWER");
	const [editingMember, setEditingMember] = useState<Member | null>(null);
	const [removingMember, setRemovingMember] = useState<Member | null>(null);
	const [editRole, setEditRole] = useState("");
	const [isRefreshingInvitations, setIsRefreshingInvitations] = useState(false);

	const [invitationPage, setInvitationPage] = useState(0);
	const invitationPageSize = 10;
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
	const [selectedUser, setSelectedUser] = useState<RealmUser | null>(null);

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

	const invitations = invitationsPage ?? [];

	const pendingInvitations = invitations.filter(
		(invitation) => invitation.status === "PENDING"
	);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm.trim());
		}, 300);

		return () => clearTimeout(timeout);
	}, [searchTerm]);

	/* ------------------ GET MEMBERS ------------------ */

	const { data: members = [] } = useQuery({
		queryKey: ["projectMembers", project.id],
		queryFn: () => getAllProjectMembers(project.id!),
	});

	/* ---------------- SEARCH MEMBERS ---------------- */

	const { data: userSearchResults, isFetching: isSearchingUsers } = useQuery({
		queryKey: ["realm-user-search", debouncedSearchTerm],
		queryFn: () => searchRealmUsers(debouncedSearchTerm),
		enabled: openAdd && debouncedSearchTerm.length >= 2,
	});

	const availableUsers = (userSearchResults?.users ?? []).filter(
		(user) => !members.some((member) => member.memberId === user.userId)
	);

	/* ------------------ ADD MEMBER ------------------ */

	const addMutation = useMutation({
		mutationFn: () => {
			if (!selectedUser) {
				throw new Error("Please select a user");
			}

			return addProjectMember(project.id!, selectedUser.userId, role);
		},

		onSuccess: () => {
			toastSuccess("Member added");

			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});

			setOpenAdd(false);
			setSelectedUser(null);
			setSearchTerm("");
			setDebouncedSearchTerm("");
			setRole("VIEWER");
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

	const handleRefreshInvitations = async () => {
		if (isRefreshingInvitations) return;

		setIsRefreshingInvitations(true);

		try {
			await Promise.all([
				refetchInvitations(),
				new Promise((resolve) => setTimeout(resolve, 600)),
			]);
		} finally {
			setIsRefreshingInvitations(false);
		}
	};

	return (
		<div className="flex h-full flex-col gap-4">
			{/* MEMBER LIST */}
			<div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
				<div className="min-w-0 space-y-4">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="font-semibold">Members</h3>

							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-muted-foreground h-7 gap-1.5 px-2"
									>
										<Info className="h-4 w-4" />
										Role permissions
									</Button>
								</PopoverTrigger>

								<PopoverContent
									align="start"
									className="w-80 max-w-[calc(100vw-2rem)]"
								>
									<div className="space-y-1">
										<h4 className="font-semibold">Project roles</h4>
										<p className="text-muted-foreground text-sm">
											Each role determines what a member can do in this project.
										</p>
									</div>

									<div className="mt-4 space-y-4">
										{Object.entries(PROJECT_ROLES).map(([key, role]) => (
											<div key={key} className="flex items-start gap-3">
												<Badge
													variant="outline"
													className={`${role.color} mt-0.5 shrink-0`}
												>
													{role.label}
												</Badge>

												<p className="text-muted-foreground text-sm">
													{role.description}
												</p>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>

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
										{member.email ?? member.username ?? member.memberId}
									</p>

									<RoleBadge role={member.role} />
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
							<Tooltip>
								<TooltipTrigger asChild>
									<DialogTrigger asChild>
										<Button>Add member</Button>
									</DialogTrigger>
								</TooltipTrigger>
								<TooltipContent>
									Only existing MetaTrack users can be added directly to a
									project.
								</TooltipContent>
							</Tooltip>

							<DialogContent aria-describedby={undefined}>
								<DialogHeader>
									<DialogTitle>Add Project Member</DialogTitle>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<label htmlFor="member-search">Search user</label>

										<Combobox<RealmUser>
											items={availableUsers}
											value={selectedUser}
											onValueChange={(user) => {
												setSelectedUser(user);
											}}
											itemToStringLabel={(user) => user.displayName}
											filter={null}
										>
											<ComboboxInput
												id="member-search"
												placeholder="Search by name or email..."
												showTrigger
												showClear
												onChange={(event) => {
													setSearchTerm(event.target.value);
												}}
											/>

											<ComboboxContent
												onWheel={(e) => e.stopPropagation()}
												className="pointer-events-auto"
											>
												{searchTerm.trim().length < 2 ? (
													<ComboboxEmpty>
														Enter at least 2 characters to search.
													</ComboboxEmpty>
												) : isSearchingUsers ? (
													<div className="text-muted-foreground p-3 text-center text-sm">
														Searching users...
													</div>
												) : availableUsers.length === 0 ? (
													<ComboboxEmpty>No users found.</ComboboxEmpty>
												) : (
													<ComboboxList>
														{(user) => (
															<ComboboxItem key={user.userId} value={user}>
																<div className="flex flex-col">
																	<span>{user.displayName}</span>
																	<span className="text-muted-foreground text-xs">
																		{user.email}
																	</span>
																</div>
															</ComboboxItem>
														)}
													</ComboboxList>
												)}
											</ComboboxContent>
										</Combobox>

										{userSearchResults?.hasMore && (
											<p className="text-muted-foreground text-xs">
												Showing the first 20 matches. Refine your search.
											</p>
										)}
									</div>

									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<label className="text-sm font-medium">Role</label>

											<InfoTooltip
												content={
													<div className="space-y-2">
														<p>
															<strong>OWNER:</strong> Has full control over the
															project, including project management and access
															permissions.
														</p>
														<p>
															<strong>ADMIN:</strong> Can manage the project,
															its members, and project settings.
														</p>
														<p>
															<strong>EDITOR:</strong> Can view and edit project
															data, including samples and assays.
														</p>
														<p>
															<strong>VIEWER:</strong> Can view project data but
															cannot make changes.
														</p>
													</div>
												}
											/>
										</div>

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
										disabled={!selectedUser || addMutation.isPending}
									>
										{addMutation.isPending ? "Adding..." : "Add member"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						{/* INVITE MEMBER */}

						<Dialog open={openInvite} onOpenChange={setOpenInvite}>
							<Tooltip>
								<TooltipTrigger asChild>
									<DialogTrigger asChild>
										<Button variant="secondary">Invite by email</Button>
									</DialogTrigger>
								</TooltipTrigger>
								<TooltipContent>
									Invite collaborators to join the project via email.
								</TooltipContent>
							</Tooltip>

							<DialogContent aria-describedby={undefined}>
								<DialogHeader>
									<div className="flex items-center gap-2">
										<DialogTitle>Invite Member by Email</DialogTitle>

										<InfoTooltip
											content={
												<div className="space-y-2">
													<p>
														Selecting this option will trigger the following
														process:
													</p>
													<ol className="list-decimal space-y-1 pl-4">
														<li>
															An email containing a link to this project will be
															sent from noreply@metatrack.no.
														</li>
														<li>
															The recipient must log in to MetaTrack and request
															access to the project.
														</li>
														<li>
															Project members with the OWNER or ADMIN role will
															be notified and must approve the request.
														</li>
													</ol>
												</div>
											}
										/>
									</div>
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
										<div className="flex items-center gap-2">
											<label className="text-sm font-medium">Role</label>

											<InfoTooltip
												content={
													<div className="space-y-2">
														<p>
															<strong>OWNER:</strong> Full project control,
															including member and role management.
														</p>
														<p>
															<strong>ADMIN:</strong> Administrative access to
															the project and its members.
														</p>
														<p>
															<strong>EDITOR:</strong> Can edit project data.
														</p>
														<p>
															<strong>VIEWER:</strong> Can view project data
															without editing it.
														</p>
													</div>
												}
											/>
										</div>

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
										{editingMember?.email ??
											editingMember?.username ??
											editingMember?.memberId}
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
								onClick={handleRefreshInvitations}
								disabled={invitationsLoading || isRefreshingInvitations}
								title="Refresh invitations"
								aria-label="Refresh invitations"
							>
								<RefreshCw
									className={`h-4 w-4 ${
										invitationsLoading || isRefreshingInvitations
											? "animate-spin"
											: ""
									}`}
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
													<RoleBadge role={invitation.role} />
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
									{removingMember?.email ??
										removingMember?.username ??
										removingMember?.memberId}
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
