import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addSamplesToAssay,
	getSamplesInAssay,
	getSamples as getSamplesNew,
} from "@/lib/api-keycloak";
import { Input } from "@/components/ui/input";
import { SquarePlus } from "lucide-react";
import { toastError, toastSuccess } from "#/lib/toast";

interface AddSamplesToAssayDialogProps {
	projectId: string;
	assayId: string;
}

export function AddSamplesToAssayDialog({
	projectId,
	assayId,
}: AddSamplesToAssayDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
	const [search, setSearch] = useState("");

	const queryClient = useQueryClient();

	const { data: samples = [] } = useQuery({
		queryKey: ["samples", projectId],
		queryFn: () => getSamplesNew(projectId),
	});

	const { data: assaySamples = [] } = useQuery({
		queryKey: ["assaySamples", assayId],
		queryFn: () => getSamplesInAssay(projectId, assayId),
		enabled: open,
	});

	const existingSampleNames = new Set(
		assaySamples.map((sample) => sample.name)
	);

	const filteredSamples = samples
		.filter(
			(sample) =>
				!existingSampleNames.has(sample.name) &&
				sample.name.toLowerCase().includes(search.toLowerCase())
		)
		.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, {
				numeric: true,
				sensitivity: "base",
			})
		);

	const { mutate, isPending } = useMutation({
		mutationFn: () => addSamplesToAssay(projectId, assayId, selectedSamples),
		onSuccess: () => {
			toastSuccess("Samples added to assay!");
			queryClient.invalidateQueries({ queryKey: ["assaySamples", assayId] });
			setOpen(false);
			setSelectedSamples([]);
		},
		onError: (err: Error) => {
			toastError(err?.message ?? "Failed to add samples");
		},
	});

	const toggleSample = (sampleName: string) => {
		setSelectedSamples((prev) =>
			prev.includes(sampleName)
				? prev.filter((s) => s !== sampleName)
				: [...prev, sampleName]
		);
	};

	const toggleSelectAll = () => {
		const visibleNames = filteredSamples.map((sample) => sample.name);

		const allVisibleSelected =
			visibleNames.length > 0 &&
			visibleNames.every((name) => selectedSamples.includes(name));

		if (allVisibleSelected) {
			setSelectedSamples((prev) =>
				prev.filter((name) => !visibleNames.includes(name))
			);
		} else {
			setSelectedSamples((prev) => [...new Set([...prev, ...visibleNames])]);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				setOpen(value);

				if (!value) {
					setSelectedSamples([]);
					setSearch("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<SquarePlus />
					Add Samples
				</Button>
			</DialogTrigger>

			<DialogContent className="max-w-lg" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Select Samples to Add</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					{/* SEARCH */}
					<Input
						placeholder="Search samples..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{/* SELECT ALL */}
					<div className="flex items-center gap-2 border-b pb-2">
						<Checkbox
							checked={
								filteredSamples.length > 0 &&
								filteredSamples.every((sample) =>
									selectedSamples.includes(sample.name)
								)
							}
							onCheckedChange={toggleSelectAll}
						/>
						<span className="text-sm font-medium">Select All</span>
					</div>

					{/* SAMPLE LIST */}
					<div className="max-h-72 space-y-2 overflow-y-auto">
						{filteredSamples.length === 0 ? (
							<p className="text-muted-foreground text-sm">No samples found</p>
						) : (
							filteredSamples.map((sample) => (
								<div key={sample.id} className="flex items-center gap-2">
									<Checkbox
										checked={selectedSamples.includes(sample.name)}
										onCheckedChange={() => toggleSample(sample.name)}
									/>
									<span className="text-sm">{sample.name}</span>
								</div>
							))
						)}
					</div>
				</div>

				<DialogFooter className="flex justify-between">
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>

					<Button
						onClick={() => mutate()}
						disabled={selectedSamples.length === 0 || isPending}
					>
						{isPending ? "Adding..." : "Add Selected Samples"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
