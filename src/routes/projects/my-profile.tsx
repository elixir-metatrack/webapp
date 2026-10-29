import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Fingerprint,
	Globe,
	Building2,
	ExternalLink,
	Loader2Icon,
	ALargeSmall,
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

	const fullName = [user.firstName, user.lastName]
		.filter((name) => name?.trim())
		.join(" ");

	const displayName = fullName || user.username || "My Profile";

	const initials = fullName
		? fullName
				.split(/\s+/)
				.map((name) => name[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: (user.username?.slice(0, 2) || "U").toUpperCase();

	const orcidId = user.orcid?.replace(/^https?:\/\/orcid\.org\//i, "");

	return (
		<div className="min-h-screen">
			<SiteHeader
				items={[{ label: "My Profile", href: "/projects/my-profile" }]}
			/>

			<main className="mx-auto w-full max-w-5xl space-y-8 p-4 py-8 md:p-8">
				<Card className="rounded-2xl shadow-sm">
					<CardContent className="p-6 sm:p-8">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
							<div className="bg-primary/10 text-primary flex size-20 shrink-0 items-center justify-center rounded-2xl">
								<span className="text-2xl font-semibold tracking-tight">
									{initials}
								</span>
							</div>

							<div className="min-w-0 flex-1 space-y-1">
								<h1 className="text-3xl font-bold tracking-tight break-words">
									{displayName}
								</h1>

								<p className="text-muted-foreground">@{user.username}</p>

								<p className="text-muted-foreground text-sm">
									Information associated with your MetaTrack account
								</p>
							</div>

							<EditProfileDialog
								profile={{
									firstName: user.firstName ?? "",
									lastName: user.lastName ?? "",
									country: user.country ?? "",
									institution: user.institution ?? "",
									orcid: user.orcid ?? "",
								}}
							/>
						</div>
					</CardContent>
				</Card>

				<section className="space-y-4">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">
							Personal information
						</h2>
						<p className="text-muted-foreground text-sm">
							Your account and research details
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<ProfileInfoCard
							icon={<ALargeSmall />}
							label="First Name"
							value={user.firstName || "-"}
							mono
						/>

						<ProfileInfoCard
							icon={<ALargeSmall />}
							label="Last Name"
							value={user.lastName || "-"}
							mono
						/>

						<ProfileInfoCard
							icon={<Fingerprint />}
							label="User ID"
							value={user.userId || "-"}
							mono
						/>

						<ProfileInfoCard
							icon={<Globe />}
							label="Country"
							value={user.country || "-"}
						/>

						<ProfileInfoCard
							icon={<Building2 />}
							label="Institution"
							value={user.institution || "-"}
						/>

						<Card className="rounded-2xl shadow-sm">
							<CardContent className="flex min-w-0 items-start gap-4 p-5">
								<div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl">
									<Fingerprint className="text-muted-foreground size-5" />
								</div>

								<div className="min-w-0 flex-1 space-y-1">
									<p className="text-muted-foreground text-sm">ORCID</p>

									{orcidId ? (
										<a
											href={`https://orcid.org/${orcidId}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary inline-flex max-w-full items-center gap-2 text-sm font-medium break-all hover:underline"
										>
											{orcidId}
											<ExternalLink className="size-3.5 shrink-0" />
										</a>
									) : (
										<p className="text-sm font-medium">-</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">
							Roles and permissions
						</h2>
						<p className="text-muted-foreground text-sm">
							Roles assigned to your account
						</p>
					</div>

					<Card className="rounded-2xl shadow-sm">
						<CardContent className="flex flex-wrap items-center gap-2 p-5">
							{user.roles?.length ? (
								user.roles.map((role) => (
									<Badge
										key={role}
										variant="secondary"
										className={`rounded-full px-3 py-1 ${
											role === "system-admin"
												? "border-transparent bg-zinc-700 text-white hover:bg-zinc-600"
												: ""
										}`}
									>
										{role}
									</Badge>
								))
							) : (
								<p className="text-muted-foreground text-sm">
									No roles assigned
								</p>
							)}
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
}

interface ProfileInfoCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	mono?: boolean;
}

function ProfileInfoCard({
	icon,
	label,
	value,
	mono = false,
}: ProfileInfoCardProps) {
	return (
		<Card className="rounded-2xl shadow-sm">
			<CardContent className="flex min-w-0 items-start gap-4 p-5">
				<div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl">
					<div className="text-muted-foreground size-5 [&>svg]:size-full">
						{icon}
					</div>
				</div>

				<div className="min-w-0 flex-1 space-y-1">
					<p className="text-muted-foreground text-sm">{label}</p>
					<p
						className={`text-sm font-medium break-words ${
							mono ? "font-mono" : ""
						}`}
					>
						{value}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
