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
import { toast } from "sonner";
import { deleteProject, deleteSelectedSamples } from "@/lib/api-keycloak";

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
					toast.error(
						`${failed.length} sample(s) could not be deleted. Check your project permissions; linked samples must be managed in the parent project.`
					);
				}
				if (success.length > 0) {
					toast.success(`${success.length} sample(s) deleted successfully!`);
				}
				return;
			} else if (entityName === "project") {
				await deleteProject(projectId!);
				onDeleted?.([projectId!]);
				queryClient.invalidateQueries({
					queryKey: ["projects"],
				});
			}

			toast.success(`${entityName} deleted successfully!`);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Error deleting";
			toast.error(message);
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
