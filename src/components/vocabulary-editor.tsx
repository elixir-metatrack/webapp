import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";

interface VocabularyEditorProps {
	terms: string[];
	onTermsChange: (terms: string[]) => void;
	fieldKey: string;
}

export function VocabularyEditor({
	terms,
	onTermsChange,
}: VocabularyEditorProps) {
	const [newTerm, setNewTerm] = useState("");
	const [bulkTerms, setBulkTerms] = useState("");

	const handleAddTerm = () => {
		const term = newTerm.trim();

		if (!term || terms.includes(term)) return;

		onTermsChange([...terms, term]);
		setNewTerm("");
	};

	const handleAddBulkTerms = () => {
		const newTerms = bulkTerms
			.split("|")
			.map((term) => term.trim())
			.filter(Boolean);

		onTermsChange([...new Set([...terms, ...newTerms])]);
		setBulkTerms("");
	};

	const handleRemoveTerm = (termToRemove: string) => {
		onTermsChange(terms.filter((term) => term !== termToRemove));
	};

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label>Add term</Label>

				<div className="flex gap-2">
					<Input
						value={newTerm}
						onChange={(event) => setNewTerm(event.target.value)}
						placeholder="Enter a term..."
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleAddTerm();
							}
						}}
					/>

					<Button type="button" onClick={handleAddTerm}>
						<Plus className="mr-2 h-4 w-4" />
						Add
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Add multiple terms</Label>

				<Input
					value={bulkTerms}
					onChange={(event) => setBulkTerms(event.target.value)}
					placeholder="Term 1 | Term 2 | Term 3"
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleAddBulkTerms();
						}
					}}
				/>

				<p className="text-muted-foreground text-xs">
					Separate multiple terms using <strong>|</strong>
				</p>

				<Button
					type="button"
					variant="outline"
					onClick={handleAddBulkTerms}
					disabled={!bulkTerms.trim()}
				>
					Add Terms
				</Button>
			</div>

			<Separator />

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label>Terms ({terms.length})</Label>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onTermsChange([])}
					>
						Clear all
					</Button>
				</div>

				<div className="max-h-[250px] overflow-y-auto rounded-md border p-4">
					{terms.length === 0 ? (
						<p className="text-muted-foreground text-center text-sm">
							No terms added.
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{terms.map((term) => (
								<Badge key={term} variant="secondary" className="gap-1 pr-1">
									{term}

									<Button
										type="button"
										className="hover:bg-muted ml-1 rounded-sm"
										onClick={() => handleRemoveTerm(term)}
									>
										<X className="h-3 w-3" />
									</Button>
								</Badge>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
