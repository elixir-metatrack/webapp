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
import { toast } from "sonner";
import {
	addProjectMember,
	getAllProjectMembers,
	removeProjectMember,
	updateProjectMember,
} from "@/lib/api-keycloak";
import type { Member, Project } from "@/lib/types";
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

import { MoreVertical } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function ProjectMembersTab({ project }: { project: Project }) {
	const queryClient = useQueryClient();

	const [openAdd, setOpenAdd] = useState(false);
	const [openInvite, setOpenInvite] = useState(false);

	const [memberId, setMemberId] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [role, setRole] = useState("MEMBER");
	const [editingMember, setEditingMember] = useState<Member | null>(null);
	const [removingMember, setRemovingMember] = useState<Member | null>(null);
	const [editRole, setEditRole] = useState("");

	/* ------------------ GET MEMBERS ------------------ */

	const { data: members = [] } = useQuery({
		queryKey: ["projectMembers", project.id],
		queryFn: () => getAllProjectMembers(project.id!),
	});

	/* ------------------ ADD MEMBER ------------------ */

	const addMutation = useMutation({
		mutationFn: () => addProjectMember(project.id!, memberId, role),
		onSuccess: () => {
			toast.success("Member added");
			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});
			setOpenAdd(false);
			setMemberId("");
		},
		onError: (err: unknown) =>
			toast.error((err as Error)?.message || "Error adding member"),
	});

	const updateRoleMutation = useMutation({
		mutationFn: () => {
			if (!editingMember) throw new Error("No member selected");
			return updateProjectMember(project.id!, editingMember.memberId, editRole);
		},

		onSuccess: () => {
			toast.success("Role updated");

			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});

			setEditingMember(null);
		},

		onError: (err: unknown) =>
			toast.error((err as Error)?.message || "Error updating role"),
	});

	const removeMutation = useMutation({
		mutationFn: () => {
			if (!removingMember) throw new Error("No member selected");
			return removeProjectMember(project.id!, removingMember.memberId);
		},

		onSuccess: () => {
			toast.success("Member removed");

			queryClient.invalidateQueries({
				queryKey: ["projectMembers", project.id],
			});

			setRemovingMember(null);
		},

		onError: (err: unknown) =>
			toast.error((err as Error)?.message || "Error removing member"),
	});

	/* ------------------ INVITE MEMBER (future) ------------------ */

	/*
	const inviteMutation = useMutation({
		mutationFn: () => inviteProjectMember(project.id!, email, role),
		onSuccess: () => {
			toast.success("Invitation sent");
			setOpenInvite(false);
			setEmail("");
		},
		onError: () => toast.error("Error sending invite"),
	});
	*/

	return (
		<div className="space-y-4">
			<p className="text-muted-foreground pt-2 text-sm">
				Manage project members
			</p>

			{/* MEMBER LIST */}

			<div className="space-y-2">
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
			</div>

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
								<label className="text-sm font-medium">Email</label>
								<Input
									placeholder="user@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
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

							<Field>
								<FieldLabel htmlFor="textarea-message">Message</FieldLabel>

								<FieldDescription>
									Enter your invitation message.
								</FieldDescription>

								<Textarea
									id="textarea-message"
									placeholder="Type your message here."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
								/>
							</Field>
						</div>

						<DialogFooter>
							<Button disabled>Send invitation</Button>
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
			</div>
		</div>
	);
}
