import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
	deleteProject,
	deleteSelectedSamples,
	deleteProjectFile,
	deleteSamplesFromAssay,
} from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "#/lib/toast";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

interface DeleteAlertButtonProps {
	projectId?: string;
	assayId?: string;
	item: { id: string; name?: string } | { id: string; name?: string }[];
	entityName?: "sample" | "project" | "fastq" | "assay";
	onDeleted?: (deletedIds: string[]) => void;
	insideDropdown?: boolean;
}

export const DeleteAlertButton = ({
	projectId,
	assayId,
	item,
	entityName,
	onDeleted,
	insideDropdown = true,
}: DeleteAlertButtonProps) => {
	const queryClient = useQueryClient();

	const handleDelete = async () => {
		const itemsToDelete = Array.isArray(item) ? item : [item];

		try {
			if (entityName === "sample") {
				const { success, failed } = await deleteSelectedSamples(
					projectId!,
					itemsToDelete
				);

				if (success.length > 0) {
					onDeleted?.(success);
					queryClient.invalidateQueries({
						queryKey: ["samples"],
					});
				}

				if (failed.length > 0) {
					toastError(
						`${failed.length} sample(s) could not be deleted. Check your project permissions; linked samples must be managed in the parent project.`
					);
				}
				if (success.length > 0) {
					toastSuccess(`${success.length} sample(s) deleted successfully!`);
				}
				return;
			}
			if (entityName === "assay") {
				if (!projectId || !assayId) {
					throw new Error(
						"Project ID and assay ID are required to delete samples from an assay."
					);
				}

				const sampleNames = itemsToDelete.map((item) => {
					if (!item.name) {
						throw new Error("Sample name is missing.");
					}

					return item.name;
				});

				console.log(projectId, assayId, sampleNames);

				await deleteSamplesFromAssay(projectId, assayId, sampleNames);

				onDeleted?.(sampleNames);

				await queryClient.invalidateQueries({
					queryKey: ["assaySamples", assayId, String(projectId)],
					exact: false,
					refetchType: "active",
				});

				toastSuccess(
					`${sampleNames.length} sample(s) removed from assay successfully!`
				);

				return;
			}
			if (entityName === "fastq") {
				if (!projectId) {
					throw new Error("Project ID is required to delete FASTQ files.");
				}

				const results = await Promise.allSettled(
					itemsToDelete.map((file) =>
						deleteProjectFile(Number(projectId), file.id)
					)
				);

				const success = itemsToDelete
					.filter((_, index) => results[index].status === "fulfilled")
					.map((file) => file.id);

				const failed = results.length - success.length;

				if (success.length > 0) {
					onDeleted?.(success);

					await queryClient.invalidateQueries({
						queryKey: assayId
							? ["assaySamples", assayId, projectId]
							: ["assaySamples"],
					});

					toastSuccess(`${success.length} FASTQ file(s) deleted successfully!`);
				}

				if (failed > 0) {
					toastError(`${failed} FASTQ file(s) could not be deleted.`);
				}

				return;
			} else if (entityName === "project") {
				await deleteProject(projectId!);
				onDeleted?.([projectId!]);
				queryClient.invalidateQueries({
					queryKey: ["projects"],
				});
			}

			toastSuccess(`${entityName} deleted successfully!`, {
				action: {
					label: "Undo",
					onClick: () => console.log("Undo"),
				},
			});
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Error deleting";

			toastError(message);
		}
	};

	const trigger = insideDropdown ? (
		<DropdownMenuItem
			className="gap-2 text-red-500 focus:text-red-500"
			onSelect={(e) => e.preventDefault()}
		>
			<Trash2 className="size-5 text-red-500" />
			Delete
		</DropdownMenuItem>
	) : (
		<Button
			variant={entityName === "fastq" ? "destructive" : "ghost"}
			size="sm"
			className={
				entityName === "fastq" ? "" : "text-red-500 hover:text-red-500"
			}
		>
			<Trash2 className="mr-2 size-4" />
			Delete
		</Button>
	);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>

					<AlertDialogDescription>
						This action cannot be undone. The selected{" "}
						<strong>
							{entityName === "fastq" ? "FASTQ file(s)" : `${entityName}(s)`}
						</strong>{" "}
						will be permanently deleted from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleDelete} variant="destructive">
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
