import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-user";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	User,
	Fingerprint,
	Shield,
	Globe,
	Building2,
	ExternalLink,
	Loader2Icon,
} from "lucide-react";
import { SiteHeader } from "@/components/dashboard/site-header";
import { EditProfileDialog } from "#/components/dashboard/edit-profile-dialog";

export const Route = createFileRoute("/projects/my-profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { data: user, isLoading } = useUser();

	if (isLoading) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<Loader2Icon className="size-12 animate-spin" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div>
			<SiteHeader
				items={[{ label: "My Profile", href: "/projects/my-profile" }]}
			/>
			<div className="flex h-[80vh] items-center justify-center">
				<Card className="max-w-4xl">
					<CardHeader>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="text-2xl">My Profile</CardTitle>
								<CardDescription className="mt-1">
									Information associated with your MetaTrack account
								</CardDescription>
							</div>

							<EditProfileDialog
								profile={{
									username: user.username ?? "",
									country: user.country ?? "",
									institution: user.institution ?? "",
									orcid: user.orcid ?? "",
								}}
							/>
						</div>
					</CardHeader>

					<CardContent className="space-y-8">
						<div className="grid gap-6 md:grid-cols-2">
							<Card>
								<CardContent className="flex items-center gap-4">
									<User className="text-primary size-8" />

									<div className="min-w-0">
										<p className="text-muted-foreground text-sm">Username</p>
										<p className="font-semibold">{user.username || "-"}</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="flex items-center gap-4">
									<Fingerprint className="text-primary size-8" />

									<div className="min-w-0">
										<p className="text-muted-foreground text-sm">User ID</p>
										<p className="font-mono text-sm break-all">
											{user.userId || "-"}
										</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="flex items-center gap-4">
									<Globe className="text-primary size-8" />

									<div className="min-w-0">
										<p className="text-muted-foreground text-sm">Country</p>
										<p className="font-semibold">{user.country || "-"}</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="flex items-center gap-4">
									<Building2 className="text-primary size-8" />

									<div className="min-w-0">
										<p className="text-muted-foreground text-sm">Institution</p>
										<p className="font-semibold break-words">
											{user.institution || "-"}
										</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="flex items-center gap-4">
									<ExternalLink className="text-primary size-8" />

									<div className="min-w-0">
										<p className="text-muted-foreground text-sm">ORCID</p>
										{user.orcid ? (
											<a
												href={`https://orcid.org/${user.orcid.replace(
													/^https?:\/\/orcid\.org\//,
													""
												)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary font-mono text-sm break-all hover:underline"
											>
												{user.orcid}
											</a>
										) : (
											<p className="font-semibold">-</p>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						<div>
							<div className="mb-4 flex items-center gap-2">
								<Shield className="size-5" />
								<h3 className="text-lg font-semibold">Roles</h3>
							</div>

							<div className="flex flex-wrap gap-2">
								{user.roles?.length ? (
									user.roles.map((role) => (
										<Badge
											key={role}
											variant="secondary"
											className={
												role === "system-admin"
													? "border-transparent bg-zinc-600 text-white hover:bg-zinc-700"
													: ""
											}
										>
											{role}
										</Badge>
									))
								) : (
									<p className="text-muted-foreground">No roles assigned</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
