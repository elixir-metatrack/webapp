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

export interface EditableProfile {
	username: string;
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

	const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const orcid = values.orcid.trim().replace(/^https?:\/\/orcid\.org\//i, "");

		if (orcid && !/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(orcid)) {
			toastError("Please enter a valid ORCID.");
			return;
		}

		// TODO: Call the profile update endpoint when available.
		// No API request is made for now.

		setSaving(true);

		setTimeout(() => {
			setSaving(false);
			setOpen(false);
			toastError("Profile editing is not yet connected to the server.");
		}, 300);
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
						Update your profile information. Changes cannot currently be saved
						to your account.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSave} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="profile-username">Username</Label>
						<Input
							id="profile-username"
							value={values.username}
							onChange={(event) => handleChange("username", event.target.value)}
							placeholder="Enter your username"
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
