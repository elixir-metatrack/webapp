"use client";

import { useState } from "react";
import { Globe, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

import { Vocabularies } from "@/components/dashboard/Vocabularies";

type VocabularyDataType = "sample" | "assay";

interface VocabulariesDialogProps {
	projectId: string;
	dataType: VocabularyDataType;
	isSystemAdmin: boolean;
	disable?: boolean;
}

export function VocabulariesDialog({
	projectId,
	dataType,
	isSystemAdmin,
	disable,
}: VocabulariesDialogProps) {
	const [open, setOpen] = useState(false);

	const entityLabel = dataType === "sample" ? "Sample" : "Assay";

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant={isSystemAdmin ? "destructive" : "outline"}
					disabled={disable}
				>
					{isSystemAdmin ? (
						<>
							<Globe />
							Global Vocabulary
						</>
					) : (
						<>
							<NotebookPen />
							Add control vocabulary
						</>
					)}
				</Button>
			</DialogTrigger>

			<DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isSystemAdmin
							? `Global ${entityLabel} Vocabularies`
							: `${entityLabel} Vocabularies`}
					</DialogTitle>

					<DialogDescription>
						{isSystemAdmin
							? `Manage global ${entityLabel.toLowerCase()} vocabularies available across the system.`
							: `Manage ${entityLabel.toLowerCase()} custom field vocabularies for this project.`}
					</DialogDescription>
				</DialogHeader>

				<div className="pt-2">
					<Vocabularies
						projectId={projectId}
						dataType={dataType}
						isSystemAdmin={isSystemAdmin}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
