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
import { deleteProject, deleteSelectedSamples } from "@/lib/api-keycloak";
import { toastError, toastSuccess } from "#/lib/toast";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

interface DeleteAlertButtonProps {
	projectId?: string;
	item: { id: string } | { id: string }[];
	entityName?: "sample" | "project";
	onDeleted?: (deletedIds: string[]) => void;
	insideDropdown?: boolean;
}

export const DeleteAlertButton = ({
	projectId,
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
			variant="ghost"
			size="sm"
			className="text-red-500 hover:text-red-500"
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
						This action cannot be undone. This will permanently delete your{" "}
						<strong>{entityName}(s)</strong> from our servers.
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
