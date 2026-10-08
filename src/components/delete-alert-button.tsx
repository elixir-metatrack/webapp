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
import { Button } from "./ui/button";
import { deleteProject, deleteSelectedSamples } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "#/lib/toast";

interface DeleteAlertButtonProps {
	projectId?: string;
	item: { id: string } | { id: string }[];
	entityName?: "sample" | "project";
	onDeleted?: (deletedIds: string[]) => void;
}

export const DeleteAlertButton = ({
	projectId,
	item,
	entityName,
	onDeleted,
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
					console.error("Failed to delete:", failed);
				}
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
			const message = (error as Error)?.message || "Error deleting";
			toastError(message);
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					autoFocus={false}
					variant="ghost"
					className="w-full justify-start !px-2 text-red-500 hover:text-red-500"
				>
					<Trash2 />
					Delete
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your{" "}
						<strong>{entityName}(s)</strong> from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
