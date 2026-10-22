import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError } from "#/lib/toast";
import { updateMe } from "#/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";

export interface EditableProfile {
	firstName: string;
	lastName: string;
	country: string;
	institution: string;
	orcid: string;
}

interface EditProfileDialogProps {
	profile: EditableProfile;
}

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [values, setValues] = useState<EditableProfile>(profile);

	const queryClient = useQueryClient();

	useEffect(() => {
		if (open) {
			setValues(profile);
		}
	}, [open, profile]);

	const handleChange = (field: keyof EditableProfile, value: string) => {
		setValues((previous) => ({
			...previous,
			[field]: value,
		}));
	};

	const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const orcid = values.orcid.trim().replace(/^https?:\/\/orcid\.org\//i, "");

		if (orcid && !/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(orcid)) {
			toastError("Please enter a valid ORCID.");
			return;
		}

		const country = values.country.trim().toUpperCase();

		if (country && !/^[A-Z]{2}$/.test(country)) {
			toastError("Country must be a two-letter ISO country code.");
			return;
		}

		if (
			values.firstName.trim().length > 255 ||
			values.lastName.trim().length > 255
		) {
			toastError("Names cannot exceed 255 characters.");
			return;
		}

		if (values.institution.trim().length > 512) {
			toastError("Institution cannot exceed 512 characters.");
			return;
		}

		setSaving(true);

		try {
			await updateMe({
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				country,
				institution: values.institution.trim(),
				orcid,
			});

			await queryClient.invalidateQueries({
				queryKey: ["me"],
			});

			setOpen(false);
		} catch (error) {
			toastError(
				error instanceof Error ? error.message : "Failed to update profile."
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Pencil className="mr-2 size-4" />
					Edit Profile
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
					<DialogDescription>
						Update your profile information.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSave} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="profile-first-name">First name</Label>
						<Input
							id="profile-first-name"
							value={values.firstName}
							onChange={(event) =>
								handleChange("firstName", event.target.value)
							}
							placeholder="Enter your name"
							maxLength={255}
							disabled={saving}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profile-last-name">Last name</Label>
						<Input
							id="profile-last-name"
							value={values.lastName}
							onChange={(event) => handleChange("lastName", event.target.value)}
							placeholder="Enter your last name"
							maxLength={255}
							disabled={saving}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profile-country">Country</Label>
						<Input
							id="profile-country"
							value={values.country}
							onChange={(event) => handleChange("country", event.target.value)}
							placeholder="Enter your country"
							disabled={saving}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profile-institution">Institution</Label>
						<Input
							id="profile-institution"
							value={values.institution}
							onChange={(event) =>
								handleChange("institution", event.target.value)
							}
							placeholder="Enter your institution"
							maxLength={512}
							disabled={saving}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profile-orcid">ORCID</Label>
						<Input
							id="profile-orcid"
							value={values.orcid}
							onChange={(event) => handleChange("orcid", event.target.value)}
							placeholder="0000-0000-0000-0000"
							disabled={saving}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={saving}
						>
							Cancel
						</Button>

						<Button type="submit" disabled={saving}>
							{saving ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
