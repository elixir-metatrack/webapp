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
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addSamplesToAssay,
	getSamples as getSamplesNew,
} from "@/lib/api-keycloak";
import { Input } from "@/components/ui/input";
import { SquarePlus } from "lucide-react";

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

	const filteredSamples = samples.filter((sample) =>
		sample.name.toLowerCase().includes(search.toLowerCase())
	);

	const { mutate, isPending } = useMutation({
		mutationFn: () => addSamplesToAssay(projectId, assayId, selectedSamples),
		onSuccess: () => {
			toast.success("Samples added to assay!");
			queryClient.invalidateQueries({ queryKey: ["assaySamples", assayId] });
			setOpen(false);
			setSelectedSamples([]);
		},
		onError: (err: Error) => {
			toast.error(err?.message ?? "Failed to add samples");
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
		setSelectedSamples((prev) =>
			visibleNames.every((name) => prev.includes(name))
				? prev.filter((name) => !visibleNames.includes(name))
				: [...new Set([...prev, ...visibleNames])]
		);
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
							aria-label="Select all visible samples"
							checked={
								filteredSamples.length > 0 &&
								filteredSamples.every((sample) =>
									selectedSamples.includes(sample.name)
								)
							}
							disabled={filteredSamples.length === 0}
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
										aria-label={`Select ${sample.name}`}
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
